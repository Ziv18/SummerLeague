"use client";
import { useState, useEffect, type FormEvent } from "react";
import {
  Box, Typography, Paper, Stack, TextField, Button, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, Snackbar,
} from "@mui/material";
import type { Player } from "@/lib/types";

export default function ManagerRoster({ teamId }: { teamId: number }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [active_league, setActiveLeague] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLeague, setEditingLeague] = useState("");
  const [editingNumber, setEditingNumber] = useState("");
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/players?team_id=${teamId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "לא ניתן לטעון את שחקני הקבוצה.");
        setPlayers([]);
        return;
      }
      setPlayers(data.players || []);
    } catch {
      setError("לא ניתן לטעון את שחקני הקבוצה.");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [teamId]);

  async function addPlayer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
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
    if (!confirm("להסיר את השחקן מהקבוצה?")) return;
    const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    setSuccess("השחקן הוסר בהצלחה");
    load();
  }

  function startEditing(player: Player) {
    setEditingId(player.id);
    setEditingLeague(player.active_league || "");
    setEditingNumber(player.number == null ? "" : String(player.number));
    setError("");
  }

  async function saveLeague(id: number) {
    setError("");
    const res = await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
    editingLeague !== (editingPlayer.active_league || "") ||
    editingNumber !== (editingPlayer.number == null ? "" : String(editingPlayer.number))
  ));
  const normalizedSearch = search.trim().toLowerCase();
  const visiblePlayers = normalizedSearch
    ? players.filter((player) => [player.name, player.active_league || "", String(player.number ?? "")]
      .some((value) => value.toLowerCase().includes(normalizedSearch)))
    : players;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>הוספת שחקן</Typography>
      <Paper variant="outlined" sx={{ p: 3, mb: 5 }}>
        <Box component="form" onSubmit={addPlayer}>
          <Stack spacing={2.5} sx={{ maxWidth: 360 }}>
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
            <Button type="submit" variant="contained">הוספת שחקן</Button>
          </Stack>
        </Box>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>הסגל שלך</Typography>
      <TextField
        label="חיפוש שחקן"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, minWidth: 280 }}
      />
      {loading ? (
        <Typography color="text.secondary">טוען…</Typography>
      ) : players.length === 0 ? (
        <Typography color="text.secondary">עדיין לא נוספו שחקנים.</Typography>
      ) : (
        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>שם</TableCell>
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
                      <TextField size="small" value={editingLeague} onChange={(e) => setEditingLeague(e.target.value)} />
                    ) : p.active_league || "—"}
                  </TableCell>
                  <TableCell align="left">
                    {editingId === p.id ? <>
                      <Button size="small" onClick={() => saveLeague(p.id)} disabled={!hasPlayerChanges}>שמירה</Button>
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
