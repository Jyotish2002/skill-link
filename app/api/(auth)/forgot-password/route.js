import { NextResponse } from "next/server";
import { connection } from "@/util/db";
import { sendVerificationEmail, generateVerificationToken } from "@/util/email";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const userResult = await connection.query(
      "SELECT * FROM users WHERE email = $1 AND is_verified = true",
      [email]
    );

    const users = userResult.rows;

    if (users.length === 0) {
      return NextResponse.json(
        { message: "No verified account found with this email" },
        { status: 404 }
      );
    }

    // Generate password reset token
    const resetToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await connection.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [resetToken, tokenExpiry, email]
    );

    // Send password reset email
    await sendVerificationEmail(
      email,
      resetToken,
      "Reset Your Password",
      "/reset-password"
    );

    return NextResponse.json(
      { message: "Password reset link sent to your email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
