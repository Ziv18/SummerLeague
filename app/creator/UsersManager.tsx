"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  TextField, MenuItem, Button, Chip,
} from "@mui/material";
import type { Team, UserRole } from "@/lib/types";

interface UserRow {
  id: number;
  username: string;
  role: UserRole;
  team_id: number | null;
  team_name: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: "צופה/ה",
  manager: "מנהל/ת קבוצה",
  admin: "מנהל/ת ליגה",
  creator: "יוצר/ת",
};

export default function UsersManager({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [usersRes, teamsRes] = await Promise.all([fetch("/api/users"), fetch("/api/teams")]);
    const usersData = await usersRes.json();
    const teamsData = await teamsRes.json();
    setUsers(usersData.users || []);
    setTeams(teamsData.teams || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Typography color="text.secondary">טוען…</Typography>;
  if (users.length === 0) return <Typography color="text.secondary">אין משתמשים.</Typography>;

  return (
    <Paper variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>שם משתמש</TableCell>
            <TableCell>תפקיד</TableCell>
            <TableCell>קבוצה</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <UserRowItem
              key={u.id}
              user={u}
              teams={teams}
              isSelf={u.id === currentUserId}
              onSaved={load}
            />
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

function UserRowItem({
  user,
  teams,
  isSelf,
  onSaved,
}: {
  user: UserRow;
  teams: Team[];
  isSelf: boolean;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [teamId, setTeamId] = useState<string>(user.team_id ? String(user.team_id) : "");
  const [saving, setSaving] = useState(false);

  const isCreator = user.role === "creator";
  const locked = isSelf || isCreator;

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, team_id: role === "manager" ? Number(teamId) || null : null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      alert(data.error);
      return;
    }
    onSaved();
  }

  async function remove() {
    if (!confirm(`למחוק את המשתמש/ת "${user.username}"?`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    onSaved();
  }

  if (locked) {
    return (
      <TableRow>
        <TableCell>
          {user.username} {isSelf && <Chip label="את/ה" size="small" sx={{ ml: 1 }} />}
        </TableCell>
        <TableCell>{ROLE_LABELS[user.role]}</TableCell>
        <TableCell>{user.team_name || "—"}</TableCell>
        <TableCell align="left">
          <Typography variant="caption" color="text.secondary">
            {isCreator ? "ניתן לשנות רק דרך המסד" : "לא ניתן לערוך את עצמך"}
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{user.username}</TableCell>
      <TableCell>
        <TextField select size="small" value={role} onChange={(e) => setRole(e.target.value as UserRole)} sx={{ minWidth: 160 }}>
          <MenuItem value="user">צופה/ה</MenuItem>
          <MenuItem value="manager">מנהל/ת קבוצה</MenuItem>
          <MenuItem value="admin">מנהל/ת ליגה</MenuItem>
        </TextField>
      </TableCell>
      <TableCell>
        {role === "manager" ? (
          <TextField select size="small" value={teamId} onChange={(e) => setTeamId(e.target.value)} sx={{ minWidth: 150 }}>
            {teams.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell align="left">
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" variant="contained" disabled={saving} onClick={save}>שמירה</Button>
          <Button size="small" color="error" onClick={remove}>מחיקה</Button>
        </Box>
      </TableCell>
    </TableRow>
  );
}
