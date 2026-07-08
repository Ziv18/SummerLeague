import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireCreator } from "@/lib/require-admin";

export async function GET() {
  const creator = await requireCreator();
  if (!creator) return NextResponse.json({ error: "ליוצר האתר בלבד" }, { status: 403 });

  const { rows } = await query(
    `SELECT u.id, u.username, u.role, u.team_id, u.created_at, t.name AS team_name
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id
     ORDER BY u.created_at DESC`
  );
  return NextResponse.json({ users: rows });
}