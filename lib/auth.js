import * as jose from "jose";

export async function verifyToken(token) {
  try {
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    return payload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function generateToken(user) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  return await new jose.SignJWT({
    id: user?.id,
    email: user?.email,
    name: user?.name,
    student_id: user?.student_id,
    github_username: user?.github_username,
    leetcode_username: user?.leetcode_username,
    role: user?.role,
    upload_project: user?.upload_project,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(secret);
}
