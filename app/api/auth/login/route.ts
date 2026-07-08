import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as { username?: string; password?: string };
  if (!username || !password) {
    return NextResponse.json({ error: "יש להזין שם משתמש וסיסמה." }, { status: 400 });
  }

  const { rows } = await query<User>(`SELECT * FROM users WHERE username = $1`, [username.trim()]);
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים." }, { status: 401 });
  }

  const token = await createSessionToken(user);
  const res = NextResponse.json({ user: { username: user.username, role: user.role } });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
