import { Container, Box, Typography, Card, Chip, Stack } from "@mui/material";
import { query } from "@/lib/db";
import { formatGameDate, formatGameTime } from "@/lib/date";
import type { Game, GameStatus } from "@/lib/types";

interface GameWithTeams extends Game {
  home_name: string;
  home_color: string | null;
  home_color2: string | null;
  away_name: string;
  away_color: string | null;
  away_color2: string | null;
}

const STATUS_LABELS: Record<GameStatus, string> = { scheduled: "מתוכנן", live: "חי", final: "סופי" };
const STATUS_COLOR: Record<GameStatus, "default" | "success"> = { scheduled: "default", live: "success", final: "default" };

export default async function HomePage() {
  const { rows: games } = await query<GameWithTeams>(
    `SELECT g.*, ht.name AS home_name, ht.color AS home_color, ht.color2 AS home_color2,
            at.name AS away_name, at.color AS away_color, at.color2 AS away_color2
     FROM games g
     JOIN teams ht ON ht.id = g.home_team_id
     JOIN teams at ON at.id = g.away_team_id
     ORDER BY g.game_date DESC`
  );

  const upcoming = games.filter((g) => g.status !== "final");
  const played = games.filter((g) => g.status === "final");

  return (
    <Container maxWidth="md" sx={{ pb: 8 }}>
      <Box sx={{ py: 7 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>
          לוח משחקים העונה
        </Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>כל משחק. כל תוצאה.</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 480 }}>
          עקבו אחרי ליגת הקיץ בזמן אמת - תוצאות, משחקים קרובים, וסגלי קבוצות מלאים.
        </Typography>
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>קרוב ובשידור חי</Typography>
      {upcoming.length === 0 ? (
        <Empty text="אין משחקים מתוכננים עדיין." />
      ) : (
        <Stack spacing={1.5} sx={{ mb: 5 }}>
          {upcoming.map((g) => <GameRow key={g.id} g={g} />)}
        </Stack>
      )}

      <Typography variant="h5" sx={{ mb: 2 }}>תוצאות</Typography>
      {played.length === 0 ? (
        <Empty text="אין תוצאות סופיות עדיין." />
      ) : (
        <Stack spacing={1.5}>
          {played.map((g) => <GameRow key={g.id} g={g} />)}
        </Stack>
      )}
    </Container>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'JetBrains Mono', monospace", py: 3, mb: 3 }}>
      {text}
    </Typography>
  );
}

function GameRow({ g }: { g: GameWithTeams }) {
  const dateStr = formatGameDate(g.game_date);
  const timeStr = formatGameTime(g.game_date);
  const hasScore = g.status !== "scheduled" && g.home_score !== null && g.away_score !== null;

  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "90px 1fr auto 1fr" },
          gap: 2,
          alignItems: "center",
          textAlign: { xs: "center", sm: "start" },
        }}
      >
        <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "text.secondary" }}>
          {dateStr}
          <br />
          {timeStr}
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: "center", sm: "flex-start" }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "3px",
              flexShrink: 0,
              background: `linear-gradient(135deg, ${g.home_color || "#F2A93B"} 50%, ${g.home_color2 || "#0F1B2D"} 50%)`,
            }}
          />
          <Typography fontWeight={600}>{g.home_name}</Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, minWidth: 24, textAlign: "center" }}>
            {hasScore ? g.home_score : "–"}
          </Typography>
          <Chip label={STATUS_LABELS[g.status]} size="small" color={STATUS_COLOR[g.status]} variant={g.status === "live" ? "filled" : "outlined"} />
          <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, minWidth: 24, textAlign: "center" }}>
            {hasScore ? g.away_score : "–"}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: "center", sm: "flex-end" }}>
          <Typography fontWeight={600}>{g.away_name}</Typography>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "3px",
              flexShrink: 0,
              background: `linear-gradient(135deg, ${g.away_color || "#E14B4B"} 50%, ${g.away_color2 || "#0F1B2D"} 50%)`,
            }}
          />
        </Stack>
      </Box>
    </Card>
  );
}
