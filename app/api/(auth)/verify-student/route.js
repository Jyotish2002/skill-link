import { NextResponse } from "next/server";
import { connection } from "@/util/db";

export async function POST(request) {
  try {
    const { name, studentID } = await request.json();

    // Validate input
    if (!name || !studentID) {
      return NextResponse.json(
        { message: "Name and Roll Number are required" },
        { status: 400 }
      );
    }

    const studentResult = await connection.query(
      "SELECT * FROM students WHERE roll_no = $1 AND LOWER(name) = LOWER($2)",
      [studentID, name]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { message: "No student found with the provided name and roll number" },
        { status: 404 }
      );
    }

    const existingUserResult = await connection.query(
      "SELECT * FROM users WHERE student_id = $1",
      [studentID]
    );

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { message: "An account with this roll number already exists" },
        { status: 409 }
      );
    }

    const studentEmail = studentResult.rows[0].email;

    const maskedEmail = studentEmail;

    return NextResponse.json(
      {
        message: "Student verified successfully",
        maskedEmail: maskedEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
