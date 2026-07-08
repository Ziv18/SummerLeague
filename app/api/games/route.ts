import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { Game } from "@/lib/types";

interface GameWithTeams extends Game {
  home_name: string;
  away_name: string;
}

export async function GET() {
  const { rows } = await query<GameWithTeams>(
    `SELECT g.*, ht.name AS home_name, at.name AS away_name
     FROM games g
     JOIN teams ht ON ht.id = g.home_team_id
     JOIN teams at ON at.id = g.away_team_id
     ORDER BY g.game_date DESC`
  );
  return NextResponse.json({ games: rows });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "למנהלים בלבד." }, { status: 403 });

  const { home_team_id, away_team_id, game_date } = (await req.json()) as {
    home_team_id?: number | string;
    away_team_id?: number | string;
    game_date?: string;
  };
  if (!home_team_id || !away_team_id || !game_date) {
    return NextResponse.json({ error: "יש לבחור קבוצת בית, קבוצת חוץ, ותאריך." }, { status: 400 });
  }
  if (String(home_team_id) === String(away_team_id)) {
    return NextResponse.json({ error: "קבוצת הבית וקבוצת החוץ חייבות להיות שונות." }, { status: 400 });
  }

  const { rows } = await query<Game>(
    `INSERT INTO games (home_team_id, away_team_id, game_date, status)
     VALUES ($1, $2, $3, 'scheduled') RETURNING *`,
    [home_team_id, away_team_id, game_date]
  );
  return NextResponse.json({ game: rows[0] }, { status: 201 });
}
