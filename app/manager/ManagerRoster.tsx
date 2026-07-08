"use client";
import { useState, useEffect, type FormEvent } from "react";
import {
  Box, Typography, Paper, Stack, TextField, Button, Alert,
  Table, TableHead, TableBody, TableRow, TableCell,
} from "@mui/material";
import type { Player } from "@/lib/types";

export default function ManagerRoster({ teamId }: { teamId: number }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/players?team_id=${teamId}`);
    const data = await res.json();
    setPlayers(data.players || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addPlayer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, name, number: number ? Number(number) : null, position }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setName("");
    setNumber("");
    setPosition("");
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
    load();
  }

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
              label="עמדה"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="לדוגמה: גארד"
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained">הוספת שחקן</Button>
          </Stack>
        </Box>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>הסגל שלך</Typography>
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
                <TableCell>עמדה</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.number ?? "—"}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.position || "—"}</TableCell>
                  <TableCell align="left">
                    <Button color="error" size="small" onClick={() => removePlayer(p.id)}>הסרה</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
