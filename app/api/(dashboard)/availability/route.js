// app/api/availability/route.js
import { NextResponse } from "next/server";
import { query } from "@/util/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mentorId = searchParams.get("mentorId");

  if (!mentorId) {
    return NextResponse.json(
      { error: "Mentor ID is required" },
      { status: 400 }
    );
  }

  try {
    // Get mentor's availability
    const availabilityQuery = `
      SELECT * FROM availability
      WHERE mentor_id = $1
      ORDER BY day_of_week, start_time
    `;

    const availabilityResult = await query(availabilityQuery, [mentorId]);

    // Get mentor's booked sessions (to show unavailable slots)
    const bookedSessionsQuery = `
      SELECT start_time, end_time
      FROM sessions
      WHERE mentor_id = $1 AND status != 'cancelled' AND start_time > NOW()
    `;

    const bookedSessionsResult = await query(bookedSessionsQuery, [mentorId]);

    return NextResponse.json({
      availability: availabilityResult.rows,
      bookedSessions: bookedSessionsResult.rows,
    });
  } catch (err) {
    console.error("Error fetching availability:", err);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// For mentors to update their availability (basic implementation)
export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userData = await query("SELECT role FROM users WHERE id = $1", [
    user.id,
  ]);

  if (
    userData.rows.length === 0 ||
    !["mentor", "both"].includes(userData.rows[0].role)
  ) {
    return NextResponse.json(
      { error: "Only mentors can update availability" },
      { status: 403 }
    );
  }

  try {
    const { day_of_week, start_time, end_time } = await request.json();

    // Input validation
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: "Invalid day of week" },
        { status: 400 }
      );
    }

    // Insert new availability
    const insertQuery = `
      INSERT INTO availability (mentor_id, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      user.id,
      day_of_week,
      start_time,
      end_time,
    ]);

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating availability:", err);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}
