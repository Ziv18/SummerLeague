"use client";
import { useState } from "react";
import { Box, Typography, Paper, Stack, Button, Alert } from "@mui/material";
import type { Team } from "@/lib/types";

// Lets a team's manager (or an admin browsing via the team switcher)
// change that team's two colors. Reuses the same PATCH /api/teams/:id route
// the admin teams page uses - the API route decides what's allowed
// (canManageTeam), this component doesn't need to know the caller's role.
export default function TeamColorEditor({ team, onSaved }: { team: Team; onSaved: () => void }) {
  const [color, setColor] = useState(team.color || "#F2A93B");
  const [color2, setColor2] = useState(team.color2 || "#0F1B2D");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const hasChanges = color !== (team.color || "#F2A93B") || color2 !== (team.color2 || "#0F1B2D");

  function cancel() {
    setColor(team.color || "#F2A93B");
    setColor2(team.color2 || "#0F1B2D");
    setEditing(false);
  }

  async function save() {
    setError("");
    setSaving(true);
    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color, color2 }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEditing(false);
    onSaved();
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>צבעי הקבוצה</Typography>
      <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>צבע ראשי</Typography>
          {editing ? <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 48, height: 40, border: "none", borderRadius: 8, padding: 0 }} /> : <Box sx={{ width: 48, height: 40, borderRadius: 1, bgcolor: color }} />}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>צבע משני</Typography>
          {editing ? <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} style={{ width: 48, height: 40, border: "none", borderRadius: 8, padding: 0 }} /> : <Box sx={{ width: 48, height: 40, borderRadius: 1, bgcolor: color2 }} />}
        </Box>
        {editing ? <>
          <Button variant="contained" disabled={saving || !hasChanges} onClick={save} sx={{ alignSelf: "flex-end" }}>שמירה</Button>
          <Button onClick={cancel} sx={{ alignSelf: "flex-end" }}>ביטול</Button>
        </> : <Button onClick={() => setEditing(true)} sx={{ alignSelf: "flex-end" }}>עריכה</Button>}
      </Stack>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Paper>
  );
}
