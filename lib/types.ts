export interface Team {
  id: number;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Player {
  id: number;
  team_id: number;
  name: string;
  number: number | null;
  position: string | null;
  created_at: string;
}

export type GameStatus = "scheduled" | "live" | "final";

export interface Game {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  game_date: string;
  status: GameStatus;
  created_at: string;
}

export type UserRole = "user" | "manager" | "admin" | "creator";

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  team_id: number | null;
  created_at: string;
}

export interface SessionPayload {
  id: number;
  username: string;
  role: UserRole;
  team_id: number | null;
}
