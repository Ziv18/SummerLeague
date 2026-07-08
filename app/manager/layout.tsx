import type { ReactNode } from "react";
import { Container } from "@mui/material";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return <Container maxWidth="md" sx={{ pb: 8 }}>{children}</Container>;
}
