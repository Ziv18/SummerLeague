import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { Team } from "@/lib/types";

export async function GET() {
  const { rows } = await query<Team>(`SELECT * FROM teams ORDER BY name ASC`);
  return NextResponse.json({ teams: rows });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  const { name, color } = (await req.json()) as { name?: string; color?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "יש להזין שם קבוצה." }, { status: 400 });
  }

  try {
    const { rows } = await query<Team>(
      `INSERT INTO teams (name, color) VALUES ($1, $2) RETURNING *`,
      [name.trim(), color || "#F2A93B"]
    );
    return NextResponse.json({ team: rows[0] }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "כבר קיימת קבוצה עם שם זה." }, { status: 409 });
    }
    throw e;
  }
}
