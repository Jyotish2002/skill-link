// app/api/ws/call/[sessionId]/route.js
import { verifyJwtToken } from "@/lib/auth"; // You'll need to implement this
import { query } from "@/util/db";

// Store for active connections
const rooms = new Map();

export const runtime = "edge";

export async function GET(request, { params }) {
  const { sessionId } = params;

  // Verify the request can be upgraded to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(request);

  // Extract token from cookies
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  const token = cookies["auth-token"]; // Use your actual token name

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Verify JWT token (implement this function)
    const userData = await verifyJwtToken(token);
    const userId = userData.userId;

    // Check if user has access to this session
    const sessionResult = await query(
      `SELECT * FROM sessions WHERE id = $1 AND (mentor_id = $2 OR learner_id = $2)`,
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return new Response("Forbidden", { status: 403 });
    }

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
        client.send(
          JSON.stringify({
            type: "user-joined",
            userId,
          })
        );
      }
    });

    // Handle messages
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Forward messages to other participants
      room.forEach((client, id) => {
        if (id !== userId) {
          client.send(event.data);
        }
      });
    };

    // Handle disconnection
    socket.onclose = () => {
      console.log(`User ${userId} left session ${sessionId}`);

      // Remove from room
      room.delete(userId);

      // Notify others
      room.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "user-left",
            userId,
          })
        );
      });

      // Remove room if empty
      if (room.size === 0) {
        rooms.delete(sessionId);
      }
    };

    return response;
  } catch (err) {
    console.error("WebSocket auth error:", err);
    return new Response("Unauthorized", { status: 401 });
  }
}
