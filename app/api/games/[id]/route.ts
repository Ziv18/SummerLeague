import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { Game, GameStatus } from "@/lib/types";

const VALID_STATUS: GameStatus[] = ["scheduled", "live", "final"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  const { home_score, away_score, status, game_date } = (await req.json()) as {
    home_score?: number | null;
    away_score?: number | null;
    status?: GameStatus;
    game_date?: string;
  };
  if (status && !VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: "סטטוס לא תקין." }, { status: 400 });
  }

  const { rows } = await query<Game>(
    `UPDATE games
     SET home_score = COALESCE($1, home_score),
         away_score = COALESCE($2, away_score),
         status = COALESCE($3, status),
         game_date = COALESCE($4, game_date)
     WHERE id = $5 RETURNING *`,
    [home_score ?? null, away_score ?? null, status || null, game_date || null, params.id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "המשחק לא נמצא." }, { status: 404 });
  return NextResponse.json({ game: rows[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  await query(`DELETE FROM games WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}
