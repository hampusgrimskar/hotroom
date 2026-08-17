export interface Player {
  id: string;
  nickname: string;
  color: string;
  /** Integer boolean (0=false, 1=true) — maps to Drizzle integer column */
  connected: number;
  /** Integer boolean (0=false, 1=true) — maps to Drizzle integer column */
  isHost: number;
  gameId: string;
  socketId: string | null;
  points: number;
  winStreak: number;
}

/** Game phase lifecycle: lobby → prompt → play → read → vote → [tiebreaker] → reveal → results */
export type GameState =
  "lobby" | "prompt" | "play" | "read" | "vote" | "tiebreaker" | "reveal" | "results";

export interface Game {
  id: string;
  code: string;
  state: GameState;
}
