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
  const [color2, setColor2] = useState("#0F1B2D");
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
      body: JSON.stringify({ name, color, color2 }),
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
            <Stack direction="row" spacing={2}>
              <TextField
                label="צבע ראשי"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                sx={{ width: 100 }}
              />
              <TextField
                label="צבע משני"
                type="color"
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                sx={{ width: 100 }}
              />
            </Stack>
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
                <TableCell>צבעים</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((t) => (
                <TeamRow key={t.id} team={t} onSaved={load} onDelete={removeTeam} />
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

// One editable row: two color swatches with their own <input type="color">
// underneath, plus a save button. Local draft state, only sent to the API
// when "שמירה" is clicked - same pattern as the score editor on the games page.
function TeamRow({
  team,
  onSaved,
  onDelete,
}: {
  team: Team;
  onSaved: () => void;
  onDelete: (id: number) => void;
}) {
  const [color, setColor] = useState(team.color || "#F2A93B");
  const [color2, setColor2] = useState(team.color2 || "#0F1B2D");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const hasChanges = color !== (team.color || "#F2A93B") || color2 !== (team.color2 || "#0F1B2D");

  function cancel() {
    setColor(team.color || "#F2A93B");
    setColor2(team.color2 || "#0F1B2D");
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color, color2 }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    setEditing(false);
    onSaved();
  }

  return (
    <TableRow>
      <TableCell>{team.name}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {editing ? <>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 32, height: 32, border: "none", borderRadius: 6, padding: 0 }} />
            <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} style={{ width: 32, height: 32, border: "none", borderRadius: 6, padding: 0 }} />
          </> : <>
            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: color }} />
            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: color2 }} />
          </>}
        </Stack>
      </TableCell>
      <TableCell align="left">
        <Stack direction="row" spacing={1}>
          {editing ? <>
            <Button size="small" variant="contained" disabled={saving || !hasChanges} onClick={save}>שמירה</Button>
            <Button size="small" onClick={cancel}>ביטול</Button>
          </> : <Button size="small" onClick={() => setEditing(true)}>עריכה</Button>}
          <Button size="small" color="error" onClick={() => onDelete(team.id)}>מחיקה</Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
