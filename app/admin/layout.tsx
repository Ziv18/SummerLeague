import type { ReactNode } from "react";
import { Container, Box, Typography } from "@mui/material";
import AdminTabs from "./AdminTabs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth="md" sx={{ pb: 8 }}>
      <Box sx={{ pt: 7, pb: 0 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>כלים למנהל</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>ניהול</Typography>
      </Box>
      <AdminTabs />
      {children}
    </Container>
  );
}
