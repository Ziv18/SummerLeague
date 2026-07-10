import { cookies } from "next/headers";
import { Box, Typography } from "@mui/material";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Team } from "@/lib/types";
import ManagerRoster from "./ManagerRoster";
import ManagerTeamSwitcher from "./ManagerTeamSwitcher";
import TeamColorEditor from "./TeamColorEditor";

export default async function ManagerPage() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  // Admins are also allowed on this screen (they already pass the
  // /manager middleware check) - only reject actual outsiders. Creators
  // manage teams/players through /admin instead, not this screen.
  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    return (
      <Box sx={{ py: 7 }}>
        <Typography variant="h3">אין גישה</Typography>
      </Box>
    );
  }

  // Admins aren't tied to a single team_id, so instead of the fixed
  // single-team view below, give them a picker that can manage any
  // team's colors and roster.
  if (user.role === "admin") {
    const { rows: teams } = await query<Team>(`SELECT * FROM teams ORDER BY name ASC`);
    return (
      <Box>
        <Box sx={{ py: 7 }}>
          <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>ניהול קבוצה</Typography>
          <Typography variant="h3" sx={{ mt: 1 }}>ניהול סגלים וצבעים</Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            כמנהל/ת ליגה, ניתן לבחור כל קבוצה ולנהל את הסגל והצבעים שלה.
          </Typography>
        </Box>
        <ManagerTeamSwitcher teams={teams} />
      </Box>
    );
  }

  // Regular team managers only ever see their own assigned team.
  if (!user.team_id) {
    return (
      <Box sx={{ py: 7 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>ניהול קבוצה</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>לא משויכת קבוצה לחשבון שלך</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>פנו למנהל הליגה כדי לשייך אתכם לקבוצה.</Typography>
      </Box>
    );
  }

  const { rows } = await query<Team>(`SELECT * FROM teams WHERE id = $1`, [user.team_id]);
  const team = rows[0];

  if (!team) {
    return (
      <Box sx={{ py: 7 }}>
        <Typography variant="h3">הקבוצה לא נמצאה</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ py: 7 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>ניהול קבוצה</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>{team.name}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          עריכת צבעי הקבוצה, והוספה/הסרה של שחקנים. לא ניתן לערוך משחקים או קבוצות אחרות מכאן.
        </Typography>
      </Box>
      <TeamColorEditor team={team} onSaved={() => {}} />
      <ManagerRoster teamId={team.id} />
    </Box>
  );
}
