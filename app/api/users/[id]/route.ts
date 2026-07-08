import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireCreator } from "@/lib/require-admin";
import type { User, UserRole } from "@/lib/types";

const ASSIGNABLE_ROLES: UserRole[] = ["user", "manager", "admin"];

// PATCH /api/users/:id
// Changes a user's role (and their team, if they're becoming a manager).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const creator = await requireCreator();
  if (!creator) {
    return NextResponse.json({ error: "ליוצר האתר בלבד." }, { status: 403 });
  }

  if (String(creator.id) === String(params.id)) {
    return NextResponse.json({ error: "לא ניתן לערוך את החשבון של עצמך מכאן." }, { status: 400 });
  }

  const { rows: existingRows } = await query<User>(`SELECT * FROM users WHERE id = $1`, [params.id]);
  const existing = existingRows[0];
  if (!existing) {
    return NextResponse.json({ error: "המשתמש לא נמצא." }, { status: 404 });
  }

  if (existing.role === "creator") {
    return NextResponse.json({ error: "לא ניתן לערוך חשבון יוצר דרך הממשק." }, { status: 403 });
  }

  const { role, team_id } = (await req.json()) as { role?: UserRole; team_id?: number | null };
  if (role && !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "תפקיד לא תקין." }, { status: 400 });
  }

  if (role === "manager" && !team_id) {
    return NextResponse.json({ error: "יש לבחור קבוצה עבור מנהל/ת קבוצה." }, { status: 400 });
  }

  const nextRole = role || existing.role;
  const nextTeamId = nextRole === "manager" ? team_id || existing.team_id : null;
  const { rows } = await query(
    `UPDATE users SET role = $1, team_id = $2 WHERE id = $3
     RETURNING id, username, role, team_id, created_at`,
    [nextRole, nextTeamId, params.id]
  );

  return NextResponse.json({ user: rows[0] });
}

// DELETE /api/users/:id
// Removes a user account entirely.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const creator = await requireCreator();
  if (!creator) {
    return NextResponse.json({ error: "ליוצר האתר בלבד." }, { status: 403 });
  }
  if (String(creator.id) === String(params.id)) {
    return NextResponse.json({ error: "לא ניתן למחוק את החשבון של עצמך." }, { status: 400 });
  }

  const { rows: existingRows } = await query<User>(`SELECT role FROM users WHERE id = $1`, [params.id]);
  if (existingRows[0]?.role === "creator") {
    return NextResponse.json({ error: "לא ניתן למחוק חשבון יוצר דרך הממשק." }, { status: 403 });
  }

  await query(`DELETE FROM users WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}