import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireCreatorOrAdmin } from "@/lib/require-admin";

export async function GET() {
  const user = await requireCreatorOrAdmin();
  if (!user) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  // Never return password_hash.
  const { rows } = await query(
    `SELECT u.id, u.username, u.role, u.team_id, u.created_at, t.name AS team_name
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id
     ORDER BY u.created_at DESC`
  );
  return NextResponse.json({ users: rows });
}
