import { cookies } from "next/headers";
import { Box, Typography } from "@mui/material";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Team } from "@/lib/types";
import ManagerRoster from "./ManagerRoster";

export default async function ManagerPage() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    return (
      <Box sx={{ py: 7 }}>
        <Typography variant="h3">אין גישה</Typography>
      </Box>
    );
  }

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

  return (
    <Box>
      <Box sx={{ py: 7 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>ניהול קבוצה</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>{team ? team.name : "הקבוצה שלי"}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          הוספה והסרה של שחקנים בקבוצה שלך. לא ניתן לערוך משחקים או קבוצות אחרות מכאן.
        </Typography>
      </Box>
      <ManagerRoster teamId={user.team_id} />
    </Box>
  );
}
