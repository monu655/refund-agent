import { NextRequest } from "next/server";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "refundai2024";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return Response.json({ success: true, token: "admin-authenticated" });
  }
  return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
}