import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppBar, Toolbar, Box, Typography, Stack, Button, Avatar } from "@mui/material";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import Providers from "./providers";
import NavLinks from "./NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "ליגת הקיץ 2026 - חדרה",
  description: "משחקים, קבוצות ותוצאות של ליגת הקיץ.",
};

async function getUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <html lang="he" dir="rtl">
      <body>
        <Providers>
          <AppBar
            position="static"
            color="transparent"
            elevation={0}
            sx={{ borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Toolbar sx={{ maxWidth: 980, mx: "auto", width: "100%", py: 1 }}>
              <Box
                component="a"
                href="/"
                sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, textDecoration: "none", color: "inherit" }}
              >
                <Avatar src="/logo.jpeg" alt="ליגת הקיץ 2026" sx={{ width: 42, height: 42 }} />
                <Typography variant="h6" component="span">
                  ליגת הקיץ <Box component="span" sx={{ color: "primary.main" }}>2026</Box>
                </Typography>
              </Box>
              <NavLinks role={user?.role} />
              <Stack direction="row" spacing={1} alignItems="center">
                {user ? (
                  <Button component="a" href="/api/auth/logout" variant="outlined" size="small">
                    התנתקות ({user.username})
                  </Button>
                ) : (
                  <Button component="a" href="/login" variant="outlined" size="small">
                    התחברות
                  </Button>
                )}
              </Stack>
            </Toolbar>
          </AppBar>
          {children}
        </Providers>
      </body>
    </html>
  );
}
