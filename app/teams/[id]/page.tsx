import { Container, Box, Typography, Card, List, ListItem, ListItemText, Chip, Stack } from "@mui/material";
import { query } from "@/lib/db";
import { formatGameDate } from "@/lib/date";
import { GAME_STAGE_COLORS, GAME_STAGE_LABELS } from "@/lib/game-stage";
import type { Team, Player, Game, GameStatus } from "@/lib/types";

interface GameWithTeams extends Game {
  home_name: string;
  away_name: string;
}

const STATUS_LABELS: Record<GameStatus, string> = { scheduled: "מתוכנן", live: "חי", final: "סופי" };

export default async function TeamPage({ params }: { params: { id: string } }) {
  const { rows: teamRows } = await query<Team>(`SELECT * FROM teams WHERE id = $1`, [params.id]);
  const team = teamRows[0];

  if (!team) {
    return (
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Box sx={{ py: 7 }}>
          <Typography variant="h3">הקבוצה לא נמצאה</Typography>
        </Box>
      </Container>
    );
  }

  const { rows: players } = await query<Player>(
    `SELECT * FROM players WHERE team_id = $1 ORDER BY number ASC NULLS LAST, name ASC`,
    [params.id]
  );

  const { rows: games } = await query<GameWithTeams>(
    `SELECT g.*, ht.name AS home_name, at.name AS away_name
     FROM games g
     JOIN teams ht ON ht.id = g.home_team_id
     JOIN teams at ON at.id = g.away_team_id
     WHERE g.home_team_id = $1 OR g.away_team_id = $1
     ORDER BY g.game_date ASC`,
    [params.id]
  );

  return (
    <Container maxWidth="md" sx={{ pb: 8 }}>
      <Box
        sx={{
          py: 7,
          borderRight: "5px solid",
          borderColor: "transparent",
          borderImage: `linear-gradient(180deg, ${team.color || "#F2A93B"}, ${team.color2 || "#0F1B2D"}) 1`,
          pr: 2.5,
        }}
      >
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>קבוצה</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>{team.name}</Typography>
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>סגל</Typography>
      <Card variant="outlined" sx={{ mb: 5 }}>
        {players.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontFamily: "'JetBrains Mono', monospace", p: 3 }}>
            עדיין לא נוספו שחקנים.
          </Typography>
        ) : (
          <List disablePadding>
            {players.map((p, i) => (
              <ListItem key={p.id} divider={i < players.length - 1}>
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", color: "primary.main", fontWeight: 700, width: 36 }}>
                  {p.number ?? "—"}
                </Typography>
                <ListItemText primary={p.name} />
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.active_league || ""}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </Card>

      <Typography variant="h5" sx={{ mb: 2 }}>לוח משחקים</Typography>
      {games.length === 0 ? (
        <Typography color="text.secondary" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>אין משחקים מתוכננים.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {games.map((g) => {
            const date = formatGameDate(g.game_date);
            const hasScore = g.status !== "scheduled" && g.home_score !== null && g.away_score !== null;
            return (
              <Card variant="outlined" key={g.id} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "text.secondary" }}>{date}</Typography>
                <Typography>{g.home_name} נגד {g.away_name}</Typography>
                {hasScore ? (
                  <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                    {g.home_score} - {g.away_score}
                  </Typography>
                ) : (
                  <Chip size="small" label={STATUS_LABELS[g.status]} variant="outlined" />
                )}
                {g.stage && <Chip size="small" label={GAME_STAGE_LABELS[g.stage]} sx={{ bgcolor: GAME_STAGE_COLORS[g.stage], color: "common.white", fontWeight: 700 }} />}
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
