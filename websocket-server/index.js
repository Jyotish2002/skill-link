import http from "http";
import Server from "socket.io";
import jwt from "jsonwebtoken";
import { connection } from "@/util/db";

// Create HTTP server
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store active connections
const rooms = new Map();

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;

    const sessionId = socket.handshake.query.sessionId;
    if (!sessionId) {
      return next(new Error("Session ID required"));
    }

    // Check if user has access to this session
    const result = await connection.query(
      `SELECT * FROM sessions WHERE id = $1 AND (mentor_id = $2 OR learner_id = $2)`,
      [sessionId, socket.userId]
    );

    if (result.rows.length === 0) {
      return next(new Error("Not authorized for this session"));
    }

    socket.sessionId = sessionId;
    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Authentication error"));
  }
});

// Handle connections
io.on("connection", (socket) => {
  const userId = socket.userId;
  const sessionId = socket.sessionId;

  // Initialize room if it doesn't exist
  if (!rooms.has(sessionId)) {
    rooms.set(sessionId, new Map());
  }

  const room = rooms.get(sessionId);
  room.set(userId, socket);

  console.log(`User ${userId} joined session ${sessionId}`);

  // Notify others in room
  room.forEach((client, id) => {
    if (id !== userId) {
      client.emit("user-joined", { userId });
    }
  });

  // Handle WebRTC signaling
  socket.on("offer", (data) => {
    room.forEach((client, id) => {
      if (id !== userId) {
        client.emit("offer", data);
      }
    });
  });

  socket.on("answer", (data) => {
    room.forEach((client, id) => {
      if (id !== userId) {
        client.emit("answer", data);
      }
    });
  });

  socket.on("ice-candidate", (data) => {
    room.forEach((client, id) => {
      if (id !== userId) {
        client.emit("ice-candidate", data);
      }
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${userId} left session ${sessionId}`);

    // Remove from room
    room.delete(userId);

    // Notify others
    room.forEach((client) => {
      client.emit("user-left", { userId });
    });

    // Remove room if empty
    if (room.size === 0) {
      rooms.delete(sessionId);
    }
  });
});

// Start server
const PORT = process.env.WS_PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
