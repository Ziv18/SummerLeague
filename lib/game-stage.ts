import type { GameStage } from "@/lib/types";

export const GAME_STAGES: Array<{ value: GameStage; label: string }> = [
  { value: "firstRound", label: "סיבוב ראשון" },
  { value: "secindRound", label: "סיבוב שני" },
  { value: "upperPlayoff", label: "פלייאוף עליון" },
  { value: "lowerPlayoff", label: "פלייאוף תחתון" },
  { value: "QuerterFinals", label: "רבע גמר" },
  { value: "semiFinals", label: "חצי גמר" },
  { value: "finals", label: "גמר" },
];

export const GAME_STAGE_LABELS: Record<GameStage, string> = Object.fromEntries(
  GAME_STAGES.map(({ value, label }) => [value, label])
) as Record<GameStage, string>;

export const GAME_STAGE_COLORS: Record<GameStage, string> = {
  firstRound: "#1976D2",
  secindRound: "#7B1FA2",
  upperPlayoff: "#00897B",
  lowerPlayoff: "#EF6C00",
  QuerterFinals: "#C62828",
  semiFinals: "#6D4C41",
  finals: "#C9A227",
};
