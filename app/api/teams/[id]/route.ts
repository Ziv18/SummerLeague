import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, canManageTeam } from "@/lib/require-admin";
import type { Team } from "@/lib/types";

// PATCH is used for two different things now:
//  - admins/creators can rename a team AND change its colors
//  - a team's own manager can change ONLY its colors, never its name
// canManageTeam() already returns the user for admin/creator (any team) or
// for a manager whose team_id matches this team - same helper the players
// API uses, so the permission rule stays defined in exactly one place.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canManageTeam(params.id);
  if (!user) return NextResponse.json({ error: "אין לך הרשאה לערוך קבוצה זו." }, { status: 403 });

  const { name, color, color2 } = (await req.json()) as { name?: string; color?: string; color2?: string };

  // Managers can only touch colors - a name change coming from a manager
  // request is silently ignored rather than trusted from the client.
  const nextName = user.role === "manager" ? null : name?.trim() || null;

  const { rows } = await query<Team>(
    `UPDATE teams
     SET name = COALESCE($1, name),
         color = COALESCE($2, color),
         color2 = COALESCE($3, color2)
     WHERE id = $4 RETURNING *`,
    [nextName, color || null, color2 || null, params.id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "הקבוצה לא נמצאה." }, { status: 404 });
  return NextResponse.json({ team: rows[0] });
}

// Creating/deleting teams stays admin/creator only.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  try {
    await query(`DELETE FROM teams WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code?: string }).code === "23503") {
      return NextResponse.json(
        { error: "לא ניתן למחוק קבוצה עם משחקים מתוכננים. יש להסיר קודם את המשחקים שלה." },
        { status: 409 }
      );
    }
    throw e;
  }
}
