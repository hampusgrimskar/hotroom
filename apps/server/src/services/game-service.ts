import { randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { games, players } from "../db/schema";
import { PLAYER_COLORS } from "@hotseat/shared";
import type { GameState } from "@hotseat/shared";
import type { db as DbInstance } from "../db";

const MAX_CODE_GENERATION_ATTEMPTS = 10;

/** PostgreSQL unique constraint violation error code */
const PG_UNIQUE_VIOLATION = "23505";

function generateCode(): string {
  // I, O, 0, 1 excluded to avoid ambiguity when reading codes aloud or on screen
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[randomInt(chars.length)];
  }
  return code;
}

/** Type guard for errors that include a `code` property (e.g. PostgreSQL errors) */
function isErrorWithCode(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
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
        if (isErrorWithCode(err) && err.code === PG_UNIQUE_VIOLATION) {
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

  async function getGameById(gameId: string) {
    return db.query.games.findFirst({
      where: eq(games.id, gameId),
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

  async function updateGameState(gameId: string, state: GameState) {
    await db.update(games).set({ state }).where(eq(games.id, gameId));
  }

  return {
    createGame,
    findGameByCode,
    getGameById,
    addPlayer,
    getPlayersInGame,
    updatePlayerSocket,
    disconnectPlayer,
    updateGameState,
  };
}

export type GameService = ReturnType<typeof createGameService>;
