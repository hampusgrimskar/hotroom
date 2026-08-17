import { eq } from "drizzle-orm";
import { db } from "../db";
import { games, players } from "../db/schema";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const PLAYER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

export async function createGame() {
  let code = generateCode();
  let attempts = 0;

  while (attempts < 10) {
    const existing = await db.query.games.findFirst({
      where: eq(games.code, code),
    });
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  if (attempts >= 10) {
    throw new Error("Failed to generate unique game code");
  }

  const [game] = await db.insert(games).values({ code }).returning();
  if (!game) {
    throw new Error("Failed to insert game");
  }
  return game;
}

export async function findGameByCode(code: string) {
  return db.query.games.findFirst({
    where: eq(games.code, code.toUpperCase()),
  });
}

export async function addPlayer(
  gameId: string,
  nickname: string,
  socketId: string,
  isHost: number = 0,
) {
  const existingPlayers = await db.query.players.findMany({
    where: eq(players.gameId, gameId),
  });

  const colorIndex = existingPlayers.length % PLAYER_COLORS.length;
  const color = PLAYER_COLORS[colorIndex];

  const [player] = await db
    .insert(players)
    .values({
      gameId,
      nickname,
      socketId,
      isHost,
      color,
    })
    .returning();

  if (!player) {
    throw new Error("Failed to insert player");
  }

  return player;
}

export async function getPlayersInGame(gameId: string) {
  return db.query.players.findMany({
    where: eq(players.gameId, gameId),
  });
}

export async function updatePlayerSocket(playerId: string, socketId: string) {
  await db.update(players).set({ socketId, connected: 1 }).where(eq(players.id, playerId));
}

export async function disconnectPlayer(socketId: string) {
  await db
    .update(players)
    .set({ connected: 0, socketId: null })
    .where(eq(players.socketId, socketId));
}

export async function updateGameState(
  gameId: string,
  state: "lobby" | "prompt" | "play" | "read" | "vote" | "tiebreaker" | "reveal" | "results",
) {
  await db.update(games).set({ state }).where(eq(games.id, gameId));
}
