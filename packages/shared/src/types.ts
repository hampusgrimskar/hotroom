export interface Player {
  id: string;
  nickname: string;
  color: string;
  connected: number;
  isHost: number;
  gameId: string;
  socketId: string | null;
  points: number;
  winStreak: number;
}

export type GameState =
  "lobby" | "prompt" | "play" | "read" | "vote" | "tiebreaker" | "reveal" | "results";

export interface Game {
  id: string;
  code: string;
  state: GameState;
}
