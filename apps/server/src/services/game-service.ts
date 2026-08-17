import { eq } from "drizzle-orm";
import { games, players } from "../db/schema";
import { PLAYER_COLORS } from "@hotseat/shared";
import type { db as DbInstance } from "../db";

const MAX_CODE_GENERATION_ATTEMPTS = 10;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createGameService(db: typeof DbInstance) {
  async function createGame() {
    let attempts = 0;

    while (attempts < MAX_CODE_GENERATION_ATTEMPTS) {
      const code = generateCode();
      try {
        const [game] = await db.insert(games).values({ code }).returning();
        if (!game) {
          throw new Error("Failed to insert game");
        }
        return game;
      } catch (err: unknown) {
        // Catch unique constraint violation and retry
        const error = err as { code?: string };
        if (error.code === "23505") {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    throw new Error("Failed to generate unique game code");
  }

  async function findGameByCode(code: string) {
    return db.query.games.findFirst({
      where: eq(games.code, code.toUpperCase()),
    });
  }

  async function addPlayer(gameId: string, nickname: string, socketId: string, isHost: number = 0) {
    const existingPlayers = await db.query.players.findMany({
      where: eq(players.gameId, gameId),
    });

    // Colors wrap around if more players than colors (guarded by MAX_PLAYERS check in handler)
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

  async function getPlayersInGame(gameId: string) {
    return db.query.players.findMany({
      where: eq(players.gameId, gameId),
    });
  }

  async function updatePlayerSocket(playerId: string, socketId: string) {
    await db.update(players).set({ socketId, connected: 1 }).where(eq(players.id, playerId));
  }

  async function disconnectPlayer(socketId: string) {
    await db
      .update(players)
      .set({ connected: 0, socketId: null })
      .where(eq(players.socketId, socketId));
  }

  async function updateGameState(
    gameId: string,
    state: "lobby" | "prompt" | "play" | "read" | "vote" | "tiebreaker" | "reveal" | "results",
  ) {
    await db.update(games).set({ state }).where(eq(games.id, gameId));
  }

  return {
    createGame,
    findGameByCode,
    addPlayer,
    getPlayersInGame,
    updatePlayerSocket,
    disconnectPlayer,
    updateGameState,
  };
}

export type GameService = ReturnType<typeof createGameService>;
