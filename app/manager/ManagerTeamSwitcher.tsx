"use client";
import { useState } from "react";
import { Box, Typography, TextField, MenuItem } from "@mui/material";
import type { Team } from "@/lib/types";
import TeamColorEditor from "./TeamColorEditor";
import ManagerRoster from "./ManagerRoster";

// Used only by admins, who (unlike a team manager) aren't tied to
// one team_id - this lets them pick which team's colors/roster to manage.
export default function ManagerTeamSwitcher({ teams }: { teams: Team[] }) {
  const [teamId, setTeamId] = useState<number | null>(teams[0]?.id ?? null);
  const selected = teams.find((t) => t.id === teamId);

  if (teams.length === 0) {
    return <Typography color="text.secondary">אין קבוצות עדיין. יש ליצור קבוצה קודם בלוח הניהול.</Typography>;
  }

  return (
    <Box>
      <TextField
        select
        label="בחר/י קבוצה לניהול"
        value={teamId}
        onChange={(e) => setTeamId(Number(e.target.value))}
        sx={{ minWidth: 240, mb: 4 }}
      >
        {teams.map((t) => (
          <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
        ))}
      </TextField>

      {selected && (
        <Box key={selected.id}>
          <TeamColorEditor team={selected} onSaved={() => {}} />
          <ManagerRoster teamId={selected.id} />
        </Box>
      )}
    </Box>
  );
}
