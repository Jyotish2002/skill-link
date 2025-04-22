import { NextResponse } from "next/server";
import { query } from "@/util/db";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function GET(request, { params }) {
  const { sessionId } = params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch detailed session information with participant names
    const sessionQuery = `
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
      WHERE s.id = $1
    `;

    const result = await query(sessionQuery, [sessionId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = result.rows[0];

    // Verify user has permission to access this session (must be the mentor or learner)
    if (session.mentor_id !== user.id && session.learner_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this session" },
        { status: 403 }
      );
    }

    return NextResponse.json(session);
  } catch (err) {
    console.error("Error fetching session:", err);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// Allow updating specific session
export async function PATCH(request, { params }) {
  const { sessionId } = params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await request.json();

    // Expanded allowable updates to include in-progress
    const allowedUpdates = ["status", "notes"];
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Check if session exists and user has permission
    const sessionCheck = await query("SELECT * FROM sessions WHERE id = $1", [
      sessionId,
    ]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionCheck.rows[0];

    // Verify user has permission (must be participant in the session)
    if (session.mentor_id !== user.id && session.learner_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this session" },
        { status: 403 }
      );
    }

    // If updating to completed status, add completion timestamp
    if (updates.status === "completed") {
      filteredUpdates.completed_at = new Date().toISOString();
    }

    // If updating to in-progress status, add started timestamp
    if (updates.status === "in-progress") {
      filteredUpdates.started_at = new Date().toISOString();
    }

    // Build update query dynamically
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    Object.entries(filteredUpdates).forEach(([key, value]) => {
      updateFields.push(`${key} = $${paramIndex}`);
      queryParams.push(value);
      paramIndex++;
    });

    // Add the session ID as the last parameter
    queryParams.push(sessionId);

    const updateQuery = `
      UPDATE sessions
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, queryParams);

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating session:", err);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

// Allow deletion of a session (soft delete or cancellation)
export async function DELETE(request, { params }) {
  const { sessionId } = params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if session exists and user has permission
    const sessionCheck = await query("SELECT * FROM sessions WHERE id = $1", [
      sessionId,
    ]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionCheck.rows[0];

    // Verify user has permission (must be participant in the session)
    if (session.mentor_id !== user.id && session.learner_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this session" },
        { status: 403 }
      );
    }

    // Instead of hard delete, we'll update status to cancelled
    const deleteQuery = `
      UPDATE sessions 
      SET status = 'cancelled', cancelled_by = $1, cancelled_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(deleteQuery, [user.id, sessionId]);

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error deleting session:", err);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
