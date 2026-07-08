"use client";
import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import theme from "@/lib/theme";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "muirtl", stylisPlugins: [prefixer, rtlPlugin] }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
