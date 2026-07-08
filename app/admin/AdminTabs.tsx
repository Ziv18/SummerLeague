"use client";
import { usePathname } from "next/navigation";
import { Tabs, Tab } from "@mui/material";

const TABS = [
  { label: "קבוצות", href: "/admin/teams" },
  { label: "שחקנים", href: "/admin/players" },
  { label: "משחקים ותוצאות", href: "/admin/games" },
];

export default function AdminTabs() {
  const pathname = usePathname();
  const current = TABS.find((t) => pathname?.startsWith(t.href))?.href || TABS[0].href;

  return (
    <Tabs
      value={current}
      sx={{ mt: 3, mb: 3, borderBottom: "1px solid", borderColor: "divider" }}
      textColor="primary"
      indicatorColor="primary"
    >
      {TABS.map((t) => (
        <Tab key={t.href} label={t.label} value={t.href} component="a" href={t.href} />
      ))}
    </Tabs>
  );
}
