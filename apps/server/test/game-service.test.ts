import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "../src/db";
import { games, players } from "../src/db/schema";
import {
  createGame,
  findGameByCode,
  addPlayer,
  getPlayersInGame,
  disconnectPlayer,
  updateGameState,
} from "../src/services/game-service";
import { eq } from "drizzle-orm";

describe("game-service", () => {
  beforeEach(async () => {
    await db.delete(players);
    await db.delete(games);
  });

  afterAll(async () => {
    await db.delete(players);
    await db.delete(games);
  });

  describe("createGame", () => {
    it("creates a game with a 4-letter code", async () => {
      const game = await createGame();

      expect(game.id).toBeDefined();
      expect(game.code).toHaveLength(4);
      expect(game.code).toMatch(/^[A-Z]{4}$/);
      expect(game.state).toBe("lobby");
    });

    it("creates games with unique codes", async () => {
      const game1 = await createGame();
      const game2 = await createGame();

      expect(game1.code).not.toBe(game2.code);
    });
  });

  describe("findGameByCode", () => {
    it("finds a game by its code", async () => {
      const created = await createGame();
      const found = await findGameByCode(created.code);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
    });

    it("is case-insensitive", async () => {
      const created = await createGame();
      const found = await findGameByCode(created.code.toLowerCase());

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
    });

    it("returns undefined for non-existent code", async () => {
      const found = await findGameByCode("ZZZZ");
      expect(found).toBeUndefined();
    });
  });

  describe("addPlayer", () => {
    it("adds a player to a game", async () => {
      const game = await createGame();
      const player = await addPlayer(game.id, "Alice", "socket-1");

      expect(player.nickname).toBe("Alice");
      expect(player.gameId).toBe(game.id);
      expect(player.socketId).toBe("socket-1");
      expect(player.isHost).toBe(0);
      expect(player.color).toBeDefined();
    });

    it("sets isHost flag when specified", async () => {
      const game = await createGame();
      const player = await addPlayer(game.id, "Host", "socket-1", 1);

      expect(player.isHost).toBe(1);
    });

    it("assigns different colors to players", async () => {
      const game = await createGame();
      const player1 = await addPlayer(game.id, "Alice", "socket-1");
      const player2 = await addPlayer(game.id, "Bob", "socket-2");

      expect(player1.color).not.toBe(player2.color);
    });
  });

  describe("getPlayersInGame", () => {
    it("returns all players in a game", async () => {
      const game = await createGame();
      await addPlayer(game.id, "Alice", "socket-1");
      await addPlayer(game.id, "Bob", "socket-2");

      const playerList = await getPlayersInGame(game.id);

      expect(playerList).toHaveLength(2);
      expect(playerList.map((p) => p.nickname)).toContain("Alice");
      expect(playerList.map((p) => p.nickname)).toContain("Bob");
    });
  });

  describe("disconnectPlayer", () => {
    it("marks a player as disconnected", async () => {
      const game = await createGame();
      await addPlayer(game.id, "Alice", "socket-1");

      await disconnectPlayer("socket-1");

      const playerList = await getPlayersInGame(game.id);
      const alice = playerList.find((p) => p.nickname === "Alice");
      expect(alice!.connected).toBe(0);
      expect(alice!.socketId).toBeNull();
    });
  });

  describe("updateGameState", () => {
    it("updates the game state", async () => {
      const game = await createGame();

      await updateGameState(game.id, "prompt");

      const updated = await db.query.games.findFirst({
        where: eq(games.id, game.id),
      });
      expect(updated!.state).toBe("prompt");
    });
  });
});
