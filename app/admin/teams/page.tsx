"use client";
import { useState, useEffect, type FormEvent } from "react";
import {
  Box, Typography, Paper, Stack, TextField, Button, Alert,
  Table, TableHead, TableBody, TableRow, TableCell,
} from "@mui/material";
import type { Team } from "@/lib/types";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#F2A93B");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(data.teams || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTeam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setName("");
    load();
  }

  async function removeTeam(id: number) {
    if (!confirm("למחוק את הקבוצה? לא ניתן לבטל פעולה זו.")) return;
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    load();
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>הוספת קבוצה</Typography>
      <Paper variant="outlined" sx={{ p: 3, mb: 5 }}>
        <Box component="form" onSubmit={addTeam}>
          <Stack spacing={2.5} sx={{ maxWidth: 360 }}>
            <TextField label="שם הקבוצה" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField
              label="צבע"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              sx={{ width: 100 }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained">הוספת קבוצה</Button>
          </Stack>
        </Box>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>כל הקבוצות</Typography>
      {loading ? (
        <Typography color="text.secondary">טוען…</Typography>
      ) : teams.length === 0 ? (
        <Typography color="text.secondary">אין קבוצות עדיין.</Typography>
      ) : (
        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם</TableCell>
                <TableCell>צבע</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>
                    <Box sx={{ width: 20, height: 20, borderRadius: "5px", bgcolor: t.color || "primary.main" }} />
                  </TableCell>
                  <TableCell align="left">
                    <Button color="error" size="small" onClick={() => removeTeam(t.id)}>מחיקה</Button>
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
