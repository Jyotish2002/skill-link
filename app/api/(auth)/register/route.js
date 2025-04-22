import { NextResponse } from "next/server";
import { connection } from "@/util/db";
import bcrypt from "bcryptjs";
import { sendVerificationEmail, generateVerificationToken } from "@/util/email";

export async function POST(request) {
  try {
    const { name, email, password, cpassword } = await request.json();

    // Validate input
    if (!name || !email || !password || !cpassword) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password !== cpassword) {
      return NextResponse.json(
        { message: "Password and confirm password do not match" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsersResult = await connection.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (existingUsersResult.rows.length > 0) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with verification details
    const insertResult = await connection.query(
      "INSERT INTO users (email, name, password, verification_token, token_expiry, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [email, name, hashedPassword, verificationToken, tokenExpiry, false]
    );

    // Send verification email
    const sendMail = await sendVerificationEmail(email, verificationToken);

    if (insertResult.rowCount > 0 && sendMail) {
      return NextResponse.json(
        { message: "User registered successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Failed to register user" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
