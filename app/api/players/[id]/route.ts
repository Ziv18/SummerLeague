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

  const { name, number, position, team_id } = (await req.json()) as {
    name?: string;
    number?: number | null;
    position?: string | null;
    team_id?: number | null;
  };
  // Only full admins may move a player to a different team.
  const nextTeamId = user.role === "admin" && team_id ? team_id : null;

  const { rows } = await query<Player>(
    `UPDATE players
     SET name = COALESCE($1, name),
         number = COALESCE($2, number),
         position = COALESCE($3, position),
         team_id = COALESCE($4, team_id)
     WHERE id = $5 RETURNING *`,
    [name?.trim() || null, number ?? null, position || null, nextTeamId, params.id]
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
