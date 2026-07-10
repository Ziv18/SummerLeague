"use client";
import { useState, useEffect, type FormEvent } from "react";
import {
  Box, Typography, Paper, Stack, TextField, Button, Alert, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Snackbar,
} from "@mui/material";
import type { Team, Player } from "@/lib/types";

interface PlayerWithTeam extends Player {
  team_name: string;
}

export default function AdminPlayersPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [teamId, setTeamId] = useState("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [active_league, setActiveLeague] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTeamId, setEditingTeamId] = useState("");
  const [editingLeague, setEditingLeague] = useState("");
  const [editingNumber, setEditingNumber] = useState("");
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [teamsRes, playersRes] = await Promise.all([fetch("/api/teams"), fetch("/api/players")]);
    const teamsData = await teamsRes.json();
    const playersData = await playersRes.json();
    setTeams(teamsData.teams || []);
    setPlayers(playersData.players || []);
    if (!teamId && teamsData.teams?.length) setTeamId(String(teamsData.teams[0].id));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addPlayer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!teamId) {
      setError("יש להוסיף קבוצה קודם.");
      return;
    }
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, name, number: number ? Number(number) : null, active_league }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setName("");
    setNumber("");
    setActiveLeague("");
    setSuccess("השחקן נוסף בהצלחה");
    load();
  }

  async function removePlayer(id: number) {
    if (!confirm("להסיר את השחקן?")) return;
    const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setSuccess("השחקן הוסר בהצלחה");
    load();
  }

  function startEditing(player: PlayerWithTeam) {
    setEditingId(player.id);
    setEditingTeamId(String(player.team_id));
    setEditingLeague(player.active_league || "");
    setEditingNumber(player.number == null ? "" : String(player.number));
    setError("");
  }

  async function savePlayer(id: number) {
    setError("");
    const res = await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: Number(editingTeamId),
        active_league: editingLeague,
        number: editingNumber === "" ? null : Number(editingNumber),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEditingId(null);
    setSuccess("השחקן עודכן בהצלחה");
    load();
  }

  const editingPlayer = players.find((player) => player.id === editingId);
  const hasPlayerChanges = Boolean(editingPlayer && (
    editingTeamId !== String(editingPlayer.team_id) ||
    editingLeague !== (editingPlayer.active_league || "") ||
    editingNumber !== (editingPlayer.number == null ? "" : String(editingPlayer.number))
  ));
  const normalizedSearch = search.trim().toLowerCase();
  const visiblePlayers = normalizedSearch
    ? players.filter((player) => [player.name, player.team_name, player.active_league || "", String(player.number ?? "")]
      .some((value) => value.toLowerCase().includes(normalizedSearch)))
    : players;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>הוספת שחקן</Typography>
      <Paper variant="outlined" sx={{ p: 3, mb: 5 }}>
        <Box component="form" onSubmit={addPlayer}>
          <Stack spacing={2.5} sx={{ maxWidth: 360 }}>
            <TextField select label="קבוצה" value={teamId} onChange={(e) => setTeamId(e.target.value)} required fullWidth>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="שם השחקן" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField
              label="מספר"
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              inputProps={{ min: 0, max: 99 }}
              fullWidth
            />
            <TextField
              label="שחקן פעיל"
              value={active_league}
              onChange={(e) => setActiveLeague(e.target.value)}
              placeholder="לדוגמה: ליגה א"
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={teams.length === 0}>הוספת שחקן</Button>
            {teams.length === 0 && (
              <Typography variant="body2" color="text.secondary">צרו קודם קבוצה, בלשונית הקבוצות.</Typography>
            )}
          </Stack>
        </Box>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>כל השחקנים</Typography>
      <TextField
        label="חיפוש שחקן"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, minWidth: 280 }}
      />
      {loading ? (
        <Typography color="text.secondary">טוען…</Typography>
      ) : players.length === 0 ? (
        <Typography color="text.secondary">אין שחקנים עדיין.</Typography>
      ) : (
        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>שם</TableCell>
                <TableCell>קבוצה</TableCell>
                <TableCell>שחקן פעיל</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {visiblePlayers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {editingId === p.id ? (
                      <TextField size="small" type="number" value={editingNumber} onChange={(e) => setEditingNumber(e.target.value)} inputProps={{ min: 0, max: 99 }} sx={{ width: 80 }} />
                    ) : p.number ?? "—"}
                  </TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    {editingId === p.id ? (
                      <TextField select size="small" value={editingTeamId} onChange={(e) => setEditingTeamId(e.target.value)} sx={{ minWidth: 140 }}>
                        {teams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
                      </TextField>
                    ) : p.team_name}
                  </TableCell>
                  <TableCell>
                    {editingId === p.id ? (
                      <TextField size="small" value={editingLeague} onChange={(e) => setEditingLeague(e.target.value)} />
                    ) : p.active_league || "—"}
                  </TableCell>
                  <TableCell align="left">
                    {editingId === p.id ? <>
                      <Button size="small" onClick={() => savePlayer(p.id)} disabled={!hasPlayerChanges}>שמירה</Button>
                      <Button size="small" onClick={() => setEditingId(null)}>ביטול</Button>
                    </> : <Button size="small" onClick={() => startEditing(p)}>עריכה</Button>}
                    <Button color="error" size="small" onClick={() => removePlayer(p.id)}>הסרה</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      <Snackbar open={Boolean(success)} autoHideDuration={3000} onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccess("")}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
