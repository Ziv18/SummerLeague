import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as { username?: string; password?: string };

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return NextResponse.json({ error: "שם המשתמש חייב להכיל לפחות 3 תווים." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 8 תווים." }, { status: 400 });
  }

  const clean = username.trim();
  const { rows: existing } = await query<{ id: number }>(`SELECT id FROM users WHERE username = $1`, [clean]);
  if (existing.length > 0) {
    return NextResponse.json({ error: "שם המשתמש הזה כבר תפוס." }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const { rows } = await query<Pick<User, "id" | "username" | "role" | "team_id">>(
    `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, username, role, team_id`,
    [clean, password_hash]
  );
  const user = rows[0];
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
