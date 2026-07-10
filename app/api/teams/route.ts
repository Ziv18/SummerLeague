import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { Team } from "@/lib/types";

export async function GET() {
  const { rows } = await query<Team>(`SELECT * FROM teams ORDER BY name ASC`);
  return NextResponse.json({ teams: rows });
}

// Creating a new team is still admin/creator only - managers can edit their
// own team's colors (see PATCH in [id]/route.ts) but never create or delete teams.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  const { name, color, color2 } = (await req.json()) as { name?: string; color?: string; color2?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "יש להזין שם קבוצה." }, { status: 400 });
  }

  try {
    const { rows } = await query<Team>(
      `INSERT INTO teams (name, color, color2) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), color || "#F2A93B", color2 || "#0F1B2D"]
    );
    return NextResponse.json({ team: rows[0] }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "כבר קיימת קבוצה עם שם זה." }, { status: 409 });
    }
    throw e;
  }
}
