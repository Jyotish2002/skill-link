import { NextResponse } from "next/server";
import { query } from "@/util/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { authOptions } from "@/lib/auth";

// Get sessions for current user
export async function GET(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all"; // upcoming, past, all
  const role = searchParams.get("role") || "all"; // mentor, learner, all

  try {
    let whereClause = "";

    if (type === "upcoming") {
      whereClause += " AND s.start_time > NOW()";
    } else if (type === "past") {
      whereClause += " AND s.start_time <= NOW()";
    }

    if (role === "mentor") {
      whereClause += " AND s.mentor_id = $1";
    } else if (role === "learner") {
      whereClause += " AND s.learner_id = $1";
    } else {
      whereClause += " AND (s.mentor_id = $1 OR s.learner_id = $1)";
    }

    const sessionsQuery = `
      SELECT 
        s.*,
        m.name as mentor_name,
        l.name as learner_name,
        COALESCE(r.rating, 0) as rating,
        r.feedback
      FROM sessions s
      JOIN users m ON s.mentor_id = m.id
      JOIN users l ON s.learner_id = l.id
      LEFT JOIN ratings r ON s.id = r.session_id
      WHERE 1=1 ${whereClause}
      ORDER BY s.start_time DESC
    `;

    const result = await query(sessionsQuery, [user.id]);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// Create a new session (booking)
export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mentor_id, start_time, end_time } = await request.json();

    // Validate user is not booking themselves
    if (user.id === parseInt(mentor_id)) {
      return NextResponse.json(
        { error: "Cannot book a session with yourself" },
        { status: 400 }
      );
    }

    // Check if mentor exists and is a mentor
    const mentorCheck = await query(
      "SELECT id FROM users WHERE id = $1 AND role IN ('mentor', 'both')",
      [mentor_id]
    );

    if (mentorCheck.rows.length === 0) {
      return NextResponse.json({ error: "Invalid mentor ID" }, { status: 400 });
    }

    // Check if slot is available (no conflicting sessions)
    const conflictCheck = await query(
      `SELECT id FROM sessions 
       WHERE mentor_id = $1 
       AND status != 'cancelled'
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [mentor_id, start_time, end_time]
    );

    if (conflictCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      );
    }

    // Create the session
    const insertQuery = `
      INSERT INTO sessions (mentor_id, learner_id, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;

    const result = await query(insertQuery, [
      mentor_id,
      user.id,
      start_time,
      end_time,
    ]);

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error creating session:", err);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// Update session status (confirm/cancel)
export async function PATCH(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await request.json();

    if (!["confirmed", "cancelled", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if user is the mentor for this session
    const sessionCheck = await query("SELECT * FROM sessions WHERE id = $1", [
      id,
    ]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const currentSession = sessionCheck.rows[0];

    // Only the mentor can confirm/cancel, or a learner can cancel their own session
    if (
      (currentSession.mentor_id !== user.id && status !== "cancelled") ||
      (currentSession.learner_id !== user.id && status === "cancelled")
    ) {
      return NextResponse.json(
        { error: "Not authorized to update this session" },
        { status: 403 }
      );
    }

    // Update session
    const updateQuery = `
      UPDATE sessions
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(updateQuery, [status, id]);

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating session:", err);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
