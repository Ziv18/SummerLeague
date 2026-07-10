import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "./auth";
import type { SessionPayload } from "./types";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Admin tools are also available to the creator (creator is a superset of admin).
export async function requireAdmin(): Promise<SessionPayload | null> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "creator")) return null;
  return user;
}

// Only the creator role can manage other users' accounts/roles.
export async function requireCreator(): Promise<SessionPayload | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "creator") return null;
  return user;
}

// Returns the current user if they're allowed to manage the given team's
// roster: a full admin/creator (any team), or a manager assigned to that specific team.
export async function canManageTeam(teamId: number | string): Promise<SessionPayload | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "admin" || user.role === "creator") return user;
  if (user.role === "manager" && user.team_id != null && String(user.team_id) === String(teamId)) {
    return user;
  }
  return null;
}
