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

export interface Game {
  id: string;
  code: string;
  state: string;
}
