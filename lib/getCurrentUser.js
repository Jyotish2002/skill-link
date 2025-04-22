import { cookies } from "next/headers";
import * as jose from "jose";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = await cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    return {
      id: payload?.id,
      email: payload?.email,
      name: payload?.name,
      student_id: payload?.student_id,
      github_username: payload?.github_username,
      leetcode_username: payload?.leetcode_username,
      role: payload?.role,
      upload_project: payload?.upload_project,
    };
  } catch (error) {
    return null;
  }
}
