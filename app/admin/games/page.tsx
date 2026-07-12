"use client";
import { useState, useEffect, type FormEvent } from "react";
import {
  Box, Typography, Paper, Stack, TextField, Button, Alert, MenuItem, Card, Chip,
} from "@mui/material";
import { formatGameDateTime } from "@/lib/date";
import { GAME_STAGES, GAME_STAGE_COLORS, GAME_STAGE_LABELS } from "@/lib/game-stage";
import type { Team, Game, GameStatus, GameStage } from "@/lib/types";

interface GameWithTeams extends Game {
  home_name: string;
  away_name: string;
}

const STATUS_LABELS: Record<GameStatus, string> = {
  scheduled: "מתוכנן",
  live: "חי",
  final: "סופי",
};

export default function AdminGamesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<GameWithTeams[]>([]);
  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");
  const [gameDate, setGameDate] = useState("");
  const [stage, setStage] = useState<GameStage | "">("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [teamsRes, gamesRes] = await Promise.all([fetch("/api/teams"), fetch("/api/games")]);
    const teamsData = await teamsRes.json();
    const gamesData = await gamesRes.json();
    setTeams(teamsData.teams || []);
    setGames(gamesData.games || []);
    if (!homeId && teamsData.teams?.length) setHomeId(String(teamsData.teams[0].id));
    if (!awayId && teamsData.teams?.length > 1) setAwayId(String(teamsData.teams[1].id));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleGames = normalizedSearch
    ? games.filter((game) => [
      game.home_name,
      game.away_name,
      game.status,
      game.stage ? GAME_STAGE_LABELS[game.stage] : "",
    ].some((value) => value.toLowerCase().includes(normalizedSearch)))
    : games;

  async function addGame(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!gameDate) {
      setError("יש לבחור תאריך ושעה.");
      return;
    }
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ home_team_id: homeId, away_team_id: awayId, game_date: new Date(gameDate).toISOString(), stage: stage || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setGameDate("");
    setStage("");
    load();
  }

  async function updateGame(id: number, patch: Partial<{ home_score: number | null; away_score: number | null; status: GameStatus; stage: GameStage | null }>) {
    const res = await fetch(`/api/games/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return false;
    }
    load();
    return true;
  }

  async function removeGame(id: number) {
    if (!confirm("למחוק את המשחק?")) return;
    await fetch(`/api/games/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>קביעת משחק</Typography>
      <Paper variant="outlined" sx={{ p: 3, mb: 5 }}>
        <Box component="form" onSubmit={addGame}>
          <Stack spacing={2.5} sx={{ maxWidth: 360 }}>
            <TextField select label="קבוצת בית" value={homeId} onChange={(e) => setHomeId(e.target.value)} required fullWidth>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="קבוצת חוץ" value={awayId} onChange={(e) => setAwayId(e.target.value)} required fullWidth>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="תאריך ושעה"
              type="datetime-local"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField select label="שלב המשחק" value={stage} onChange={(e) => setStage(e.target.value as GameStage | "")} fullWidth>
              <MenuItem value="">ללא תג</MenuItem>
              {GAME_STAGES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </TextField>
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={teams.length < 2}>קביעת משחק</Button>
            {teams.length < 2 && <Typography variant="body2" color="text.secondary">צריך לפחות 2 קבוצות קודם.</Typography>}
          </Stack>
        </Box>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>משחקים ותוצאות</Typography>
      <TextField
        label="חיפוש משחק"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="קבוצה, סטטוס או שלב"
        sx={{ mb: 2, minWidth: 280 }}
      />
      {loading ? (
        <Typography color="text.secondary">טוען…</Typography>
      ) : visibleGames.length === 0 ? (
        <Typography color="text.secondary">אין משחקים עדיין.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {visibleGames.map((g) => <GameEditor key={g.id} g={g} onUpdate={updateGame} onDelete={removeGame} />)}
        </Stack>
      )}
    </Box>
  );
}

function GameEditor({
  g,
  onUpdate,
  onDelete,
}: {
  g: GameWithTeams;
  onUpdate: (id: number, patch: Partial<{ home_score: number | null; away_score: number | null; status: GameStatus; stage: GameStage | null }>) => Promise<boolean>;
  onDelete: (id: number) => void;
}) {
  const [homeScore, setHomeScore] = useState(g.home_score ?? "");
  const [awayScore, setAwayScore] = useState(g.away_score ?? "");
  const [status, setStatus] = useState<GameStatus>(g.status);
  const [stage, setStage] = useState<GameStage | "">(g.stage || "");
  const [editing, setEditing] = useState(false);
  const hasChanges = homeScore !== (g.home_score ?? "") || awayScore !== (g.away_score ?? "") || status !== g.status || stage !== (g.stage || "");

  function cancel() {
    setHomeScore(g.home_score ?? "");
    setAwayScore(g.away_score ?? "");
    setStatus(g.status);
    setStage(g.stage || "");
    setEditing(false);
  }

  async function save() {
    const saved = await onUpdate(g.id, {
      home_score: homeScore === "" ? null : Number(homeScore),
      away_score: awayScore === "" ? null : Number(awayScore),
      status,
      stage: stage || null,
    });
    if (saved) setEditing(false);
  }

  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography fontWeight={700}>{g.home_name} נגד {g.away_name}</Typography>
        <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "text.secondary" }}>
          {formatGameDateTime(g.game_date)}
        </Typography>
      </Stack>
      {editing ? <Stack direction="row" spacing={2} alignItems="flex-end" flexWrap="wrap" useFlexGap>
        <TextField
          label={g.home_name}
          type="number"
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
          sx={{ width: 100 }}
        />
        <TextField
          label={g.away_name}
          type="number"
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
          sx={{ width: 100 }}
        />
        <TextField
          select
          label="סטטוס"
          value={status}
          onChange={(e) => setStatus(e.target.value as GameStatus)}
          sx={{ width: 150 }}
        >
          <MenuItem value="scheduled">מתוכנן</MenuItem>
          <MenuItem value="live">חי</MenuItem>
          <MenuItem value="final">סופי</MenuItem>
        </TextField>
        <TextField select label="שלב המשחק" value={stage} onChange={(e) => setStage(e.target.value as GameStage | "")} sx={{ width: 170 }}>
          <MenuItem value="">ללא תג</MenuItem>
          {GAME_STAGES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
        </TextField>
        <Button variant="contained" disabled={!hasChanges} onClick={save}>שמירה</Button>
        <Button onClick={cancel}>ביטול</Button>
        <Button color="error" onClick={() => onDelete(g.id)}>מחיקה</Button>
      </Stack> : <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography>{g.home_name}: {g.home_score ?? "—"}</Typography>
        <Typography>{g.away_name}: {g.away_score ?? "—"}</Typography>
        <Typography color="text.secondary">{STATUS_LABELS[g.status]}</Typography>
        {g.stage && <Chip size="small" label={GAME_STAGE_LABELS[g.stage]} sx={{ bgcolor: GAME_STAGE_COLORS[g.stage], color: "common.white", fontWeight: 700 }} />}
        <Button onClick={() => setEditing(true)}>עריכה</Button>
        <Button color="error" onClick={() => onDelete(g.id)}>מחיקה</Button>
      </Stack>}
    </Card>
  );
}
