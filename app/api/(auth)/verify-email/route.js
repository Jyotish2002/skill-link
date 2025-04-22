import { NextResponse } from "next/server";
import { connection } from "@/util/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { message: "Invalid verification token" },
      { status: 400 }
    );
  }

  try {
    const userResult = await connection.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    const users = userResult.rows;

    if (users.length === 0) {
      const verifiedUserResult = await connection.query(
        "SELECT * FROM users WHERE is_verified = true AND verification_token IS NULL"
      );

      if (verifiedUserResult.rows.length > 0) {
        return NextResponse.json(
          { message: "Email has already been verified" },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 404 }
      );
    }

    await connection.query(
      "UPDATE users SET is_verified = true, verification_token = NULL, token_expiry = NULL WHERE verification_token = $1",
      [token]
    );

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
