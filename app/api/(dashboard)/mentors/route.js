import { NextResponse } from "next/server";
import { query } from "@/util/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skill = searchParams.get("skill");

  const offset = (page - 1) * limit;

  try {
    let mentorQuery = `
      SELECT u.id, u.name, u.bio, u.role,
      COALESCE(
        (SELECT AVG(r.rating)::numeric(10,1)
         FROM sessions s
         JOIN ratings r ON s.id = r.session_id
         WHERE s.mentor_id = u.id
        ), 0) as average_rating
      FROM users u
      WHERE u.role IN ('mentor', 'both')
    `;

    let queryParams = [];

    if (skill) {
      mentorQuery += `
        AND EXISTS (
          SELECT 1 FROM user_skills us
          JOIN skills s ON us.skill_id = s.id
          WHERE us.user_id = u.id AND s.name ILIKE $1
        )
      `;
      queryParams.push(`%${skill}%`);
    }

    // Count total for pagination
    const countQuery = `SELECT COUNT(*) FROM (${mentorQuery}) AS mentors`;
    const totalResult = await query(countQuery, queryParams);
    const total = parseInt(totalResult.rows[0].count);

    // Add pagination
    mentorQuery += ` ORDER BY u.name LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }`;
    queryParams.push(limit, offset);

    const mentorsResult = await query(mentorQuery, queryParams);

    // Fetch skills for each mentor
    const mentorsWithSkills = await Promise.all(
      mentorsResult.rows.map(async (mentor) => {
        const skillsQuery = `
          SELECT s.name
          FROM user_skills us
          JOIN skills s ON us.skill_id = s.id
          WHERE us.user_id = $1
        `;
        const skillsResult = await query(skillsQuery, [mentor.id]);

        return {
          ...mentor,
          skills: skillsResult.rows.map((row) => row.name),
        };
      })
    );

    return NextResponse.json({
      mentors: mentorsWithSkills,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching mentors:", err);
    return NextResponse.json(
      { error: "Failed to fetch mentors" },
      { status: 500 }
    );
  }
}
