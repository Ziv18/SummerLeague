import { Container, Box, Typography, Grid, Card, CardActionArea, CardContent } from "@mui/material";
import { query } from "@/lib/db";
import type { Team } from "@/lib/types";

interface TeamWithCount extends Team {
  player_count: number;
}

export default async function TeamsPage() {
  const { rows: teams } = await query<TeamWithCount>(
    `SELECT t.*, COUNT(p.id)::int AS player_count
     FROM teams t
     LEFT JOIN players p ON p.team_id = t.id
     GROUP BY t.id
     ORDER BY t.name ASC`
  );

  return (
    <Container maxWidth="md" sx={{ pb: 8 }}>
      <Box sx={{ py: 7 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>מועדונים</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>קבוצות הליגה</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>לחצו על קבוצה כדי לראות את הסגל המלא.</Typography>
      </Box>

      {teams.length === 0 ? (
        <Typography color="text.secondary" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>אין קבוצות עדיין.</Typography>
      ) : (
        <Grid container spacing={2}>
          {teams.map((t) => (
            <Grid item xs={12} sm={6} md={4} key={t.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderTop: "4px solid",
                  borderTopColor: "transparent",
                  borderImage: `linear-gradient(90deg, ${t.color || "#F2A93B"} 50%, ${t.color2 || "#0F1B2D"} 50%) 1`,
                }}
              >
                <CardActionArea component="a" href={`/teams/${t.id}`} sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6">{t.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'JetBrains Mono', monospace", mt: 0.5 }}>
                      {t.player_count} שחקנים
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
