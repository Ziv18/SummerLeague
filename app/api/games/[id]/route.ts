import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { Game, GameStatus, GameStage } from "@/lib/types";
import { GAME_STAGES } from "@/lib/game-stage";

const VALID_STATUS: GameStatus[] = ["scheduled", "live", "final"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  const body = (await req.json()) as {
    home_score?: number | null;
    away_score?: number | null;
    status?: GameStatus;
    game_date?: string;
    stage?: GameStage | null;
  };
  const { home_score, away_score, status, game_date, stage } = body;
  if (status && !VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: "סטטוס לא תקין." }, { status: 400 });
  }
  if (stage && !GAME_STAGES.some((item) => item.value === stage)) {
    return NextResponse.json({ error: "שלב משחק לא תקין." }, { status: 400 });
  }

  const { rows } = await query<Game>(
    `UPDATE games
     SET home_score = COALESCE($1, home_score),
         away_score = COALESCE($2, away_score),
         status = COALESCE($3, status),
         game_date = COALESCE($4, game_date),
         stage = CASE WHEN $5 THEN $6 ELSE stage END
     WHERE id = $7 RETURNING *`,
    [home_score ?? null, away_score ?? null, status || null, game_date || null, Object.hasOwn(body, "stage"), stage || null, params.id]
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
