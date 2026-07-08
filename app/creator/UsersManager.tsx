"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  TextField, MenuItem, Button, Chip,
} from "@mui/material";
import type { Team, UserRole } from "@/lib/types";

// Shape of a row as returned by GET /api/users (see the SELECT list in
// app/api/users/route.ts — this type has to match those column names).
interface UserRow {
  id: number;
  username: string;
  role: UserRole;
  team_id: number | null;
  team_name: string | null;
  created_at: string;
}

// Hebrew display labels, keyed by the raw role string stored in the DB.
const ROLE_LABELS: Record<UserRole, string> = {
  user: "צופה",
  manager: "מנהל קבוצה",
  admin: "מנהל ליגה",
  creator: "יוצר",
};

// PARENT component: fetches the data, renders one <UserRowItem> per row.
// This mirrors the parent/child split used in app/admin/games/page.tsx
// (AdminGamesPage + GameEditor) — the parent owns the list and the
// "refresh everything" function; each row owns its own draft edit state.
export default function UsersManager({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetches both the user list and the team list in parallel (Promise.all,
  // same pattern as app/admin/players/page.tsx). We need teams too, because
  // when someone's role is set to "manager" the row needs a team picker.
  async function load() {
    const [usersRes, teamsRes] = await Promise.all([fetch("/api/users"), fetch("/api/teams")]);
    const usersData = await usersRes.json();
    const teamsData = await teamsRes.json();
    setUsers(usersData.users || []);
    setTeams(teamsData.teams || []);
    setLoading(false);
  }

  // Load once on mount.
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
              // Passing `load` down as onSaved means: after a successful
              // save/delete, re-fetch the whole list from the server
              // rather than trying to patch local state by hand. Simpler
              // and less error-prone than manually mutating the array.
              onSaved={load}
            />
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

// CHILD component: one editable row. Holds its own local "draft" state
// (role, teamId) that's separate from the parent's data until "Save" is
// clicked — exactly like GameEditor's homeScore/awayScore/status state in
// app/admin/games/page.tsx.
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
  // "locked" rows render as read-only text instead of editable controls.
  // This is the client-side mirror of the two guards in the PATCH route
  // handler (self-edit block, creator-edit block) — but note this check
  // alone is NOT the security boundary. It just avoids showing controls
  // that would fail anyway; the API route is what actually enforces it.
  const locked = isSelf || isCreator;

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // Only send a team_id if the chosen role is "manager" — for any
      // other role, send null so the API's own team_id-clearing logic
      // (see nextTeamId in the PATCH handler) has a consistent input.
      body: JSON.stringify({ role, team_id: role === "manager" ? Number(teamId) || null : null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      // Surfaces server-side validation errors (e.g. "select a team for
      // a manager") directly — these come from the checks in the PATCH
      // route handler above.
      alert(data.error);
      return;
    }
    onSaved(); // tell the parent to reload the list
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

  // Locked-row rendering: plain text, no inputs, with an explanatory note
  // instead of action buttons.
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

  // Editable-row rendering.
  return (
    <TableRow>
      <TableCell>{user.username}</TableCell>
      <TableCell>
        {/* Note: no "creator" <MenuItem> here at all — the same whitelist
            idea as ASSIGNABLE_ROLES in the API route, just expressed as
            "don't render the option" instead of "reject the request."
            Both layers matter: this one is for UX, the API check is
            for security. */}
        <TextField select size="small" value={role} onChange={(e) => setRole(e.target.value as UserRole)} sx={{ minWidth: 160 }}>
          <MenuItem value="user">צופה/ה</MenuItem>
          <MenuItem value="manager">מנהל/ת קבוצה</MenuItem>
          <MenuItem value="admin">מנהל/ת ליגה</MenuItem>
        </TextField>
      </TableCell>
      <TableCell>
        {/* Team picker only shows up when the drafted role is "manager" -
            for any other role there's nothing to pick, so we just show
            a dash. */}
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