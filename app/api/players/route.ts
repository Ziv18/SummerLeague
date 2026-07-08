import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { canManageTeam } from "@/lib/require-admin";
import type { Player } from "@/lib/types";

interface PlayerWithTeam extends Player {
  team_name: string;
}

export async function GET(req: NextRequest) {
  const teamId = new URL(req.url).searchParams.get("team_id");
  const { rows } = teamId
    ? await query<Player>(`SELECT * FROM players WHERE team_id = $1 ORDER BY name ASC`, [teamId])
    : await query<PlayerWithTeam>(
        `SELECT p.*, t.name AS team_name FROM players p JOIN teams t ON t.id = p.team_id ORDER BY t.name ASC, p.name ASC`
      );
  return NextResponse.json({ players: rows });
}

export async function POST(req: NextRequest) {
  const { team_id, name, number, position } = (await req.json()) as {
    team_id?: number | string;
    name?: string;
    number?: number | null;
    position?: string | null;
  };
  if (!team_id || !name || !name.trim()) {
    return NextResponse.json({ error: "יש לבחור קבוצה ולהזין שם שחקן." }, { status: 400 });
  }

  const allowed = await canManageTeam(team_id);
  if (!allowed) {
    return NextResponse.json({ error: "אין לך הרשאה לנהל שחקנים בקבוצה זו." }, { status: 403 });
  }

  const { rows } = await query<Player>(
    `INSERT INTO players (team_id, name, number, position) VALUES ($1, $2, $3, $4) RETURNING *`,
    [team_id, name.trim(), number || null, position || null]
  );
  return NextResponse.json({ player: rows[0] }, { status: 201 });
}
