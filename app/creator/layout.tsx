import type { ReactNode } from "react";
import { Container, Box, Typography } from "@mui/material";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth="md" sx={{ pb: 8 }}>
      <Box sx={{ py: 7 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>
          יוצר
        </Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>ניהול משתמשים</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          שינוי תפקיד עבור כל משתמש/ת בליגה. הענקת תפקיד יוצר/ת אפשרית רק ישירות במסד הנתונים.
        </Typography>
      </Box>
      {/* {children} is whatever app/creator/page.tsx renders */}
      {children}
    </Container>
  );
}