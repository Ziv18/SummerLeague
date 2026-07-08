import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { Team } from "@/lib/types";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  const { name, color } = (await req.json()) as { name?: string; color?: string };
  const { rows } = await query<Team>(
    `UPDATE teams SET name = COALESCE($1, name), color = COALESCE($2, color) WHERE id = $3 RETURNING *`,
    [name?.trim() || null, color || null, params.id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "הקבוצה לא נמצאה." }, { status: 404 });
  return NextResponse.json({ team: rows[0] });
}

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
