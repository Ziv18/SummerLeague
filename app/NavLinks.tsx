"use client";

import { Stack, Button } from "@mui/material";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLinks({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "משחקים" },
    { href: "/teams", label: "קבוצות" },
    ...(role === "admin" || role === "creator" ? [{ href: "/admin", label: "ניהול" }] : []),
    ...(role === "manager" || role === "admin" ? [{ href: "/manager", label: "ניהול קבוצה" }] : []),
    ...(role === "creator" ? [{ href: "/creator", label: "ניהול משתמשים" }] : []),
  ];

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Button key={link.href} component="a" href={link.href} color={active ? "primary" : "inherit"}
            variant={active ? "contained" : "text"} aria-current={active ? "page" : undefined}>
            {link.label}
          </Button>
        );
      })}
    </Stack>
  );
}
