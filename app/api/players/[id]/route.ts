import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { canManageTeam } from "@/lib/require-admin";
import type { Player } from "@/lib/types";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { rows: existingRows } = await query<Player>(`SELECT * FROM players WHERE id = $1`, [params.id]);
  const existing = existingRows[0];
  if (!existing) return NextResponse.json({ error: "השחקן לא נמצא." }, { status: 404 });

  const user = await canManageTeam(existing.team_id);
  if (!user) return NextResponse.json({ error: "אין לך הרשאה לנהל שחקנים בקבוצה זו." }, { status: 403 });

  const body = (await req.json()) as {
    name?: string;
    number?: number | null;
    active_league?: string | null;
    team_id?: number | null;
  };
  const updates: string[] = [];
  const values: Array<string | number | null> = [];
  const set = (column: string, value: string | number | null) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if (Object.hasOwn(body, "name")) {
    const name = body.name?.trim();
    if (!name) return NextResponse.json({ error: "יש להזין שם שחקן." }, { status: 400 });
    set("name", name);
  }
  if (Object.hasOwn(body, "number")) set("number", body.number ?? null);
  if (Object.hasOwn(body, "active_league")) set("active_league", body.active_league?.trim() || null);

  if (Object.hasOwn(body, "team_id")) {
    // League admins and creators may move players; team managers may not.
    if (user.role !== "admin" && user.role !== "creator") {
      return NextResponse.json({ error: "אין לך הרשאה להעביר שחקנים בין קבוצות." }, { status: 403 });
    }
    const teamId = Number(body.team_id);
    if (!Number.isInteger(teamId) || teamId <= 0) {
      return NextResponse.json({ error: "יש לבחור קבוצה תקינה." }, { status: 400 });
    }
    const { rows: teams } = await query(`SELECT id FROM teams WHERE id = $1`, [teamId]);
    if (!teams[0]) return NextResponse.json({ error: "הקבוצה לא נמצאה." }, { status: 404 });
    set("team_id", teamId);
  }

  if (updates.length === 0) return NextResponse.json({ player: existing });

  values.push(params.id);
  const { rows } = await query<Player>(
    `UPDATE players SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return NextResponse.json({ player: rows[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { rows: existingRows } = await query<Player>(`SELECT * FROM players WHERE id = $1`, [params.id]);
  const existing = existingRows[0];
  if (!existing) return NextResponse.json({ error: "השחקן לא נמצא." }, { status: 404 });

  const user = await canManageTeam(existing.team_id);
  if (!user) return NextResponse.json({ error: "אין לך הרשאה לנהל שחקנים בקבוצה זו." }, { status: 403 });

  await query(`DELETE FROM players WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}
