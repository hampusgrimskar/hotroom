import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildServer } from "../../src/server";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { AddressInfo } from "net";
import { db } from "../../src/db";
import { games, players } from "../../src/db/schema";

describe("lobby-handlers", () => {
  let fastify: FastifyInstance;
  let io: Server;
  let port: number;
  let clients: ClientSocket[] = [];

  beforeAll(async () => {
    const server = await buildServer();
    fastify = server.fastify;
    io = server.io;
    await fastify.listen({ port: 0 });
    port = (fastify.server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    clients.forEach((c) => c.disconnect());
    io.close();
    await fastify.close();
  });

  beforeEach(async () => {
    // Clean up DB
    await db.delete(players);
    await db.delete(games);
    // Disconnect any leftover clients
    clients.forEach((c) => c.disconnect());
    clients = [];
  });

  function createClient(): ClientSocket {
    const client = ioClient(`http://localhost:${port}`, {
      transports: ["websocket"],
    });
    clients.push(client);
    return client;
  }

  async function waitForConnect(client: ClientSocket): Promise<void> {
    return new Promise((resolve) => {
      client.on("connect", resolve);
    });
  }

  it("host:create returns a game with a 4-letter code and the host as a player", async () => {
    const client = createClient();
    await waitForConnect(client);

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      client.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });

    expect(result.success).toBe(true);
    const game = result.game as { code: string };
    expect(game.code).toMatch(/^[A-Z]{4}$/);
    const playersList = result.players as { nickname: string; isHost: number }[];
    expect(playersList).toHaveLength(1);
    expect(playersList[0].nickname).toBe("Host");
    expect(playersList[0].isHost).toBe(1);
  });

  it("player:join with valid code and nickname succeeds and broadcasts players:updated", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    const playerClient = createClient();
    await waitForConnect(playerClient);

    const broadcastPromise = new Promise<unknown[]>((resolve) => {
      hostClient.on("players:updated", (data: unknown[]) => {
        resolve(data);
      });
    });

    const joinResult = await new Promise<Record<string, unknown>>((resolve) => {
      playerClient.emit(
        "player:join",
        { code: game.code, nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    expect(joinResult.success).toBe(true);
    const joinedPlayers = joinResult.players as { nickname: string }[];
    expect(joinedPlayers).toHaveLength(2);

    const broadcast = await broadcastPromise;
    expect(broadcast).toHaveLength(2);
  });

  it("player:join with invalid code returns error 'Game not found'", async () => {
    const client = createClient();
    await waitForConnect(client);

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      client.emit(
        "player:join",
        { code: "ZZZZ", nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Game not found");
  });

  it("player:join with missing code/nickname returns error 'Invalid room code'", async () => {
    const client = createClient();
    await waitForConnect(client);

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      client.emit("player:join", { code: "", nickname: "" }, (res: Record<string, unknown>) => {
        resolve(res);
      });
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid room code");
  });

  it("player:join with null/invalid data returns error 'Invalid payload'", async () => {
    const client = createClient();
    await waitForConnect(client);

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      client.emit("player:join", null, (res: Record<string, unknown>) => {
        resolve(res);
      });
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid payload");
  });

  it("player:join with duplicate nickname returns error 'Nickname already taken'", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    const player1 = createClient();
    await waitForConnect(player1);

    await new Promise<Record<string, unknown>>((resolve) => {
      player1.emit(
        "player:join",
        { code: game.code, nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    const player2 = createClient();
    await waitForConnect(player2);

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      player2.emit(
        "player:join",
        { code: game.code, nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Nickname already taken");
  });

  it("player:join when game is full returns error 'Game is full'", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    // Join 7 more players to fill the game (host is 1, need 7 more for 8 total)
    for (let i = 0; i < 7; i++) {
      const client = createClient();
      await waitForConnect(client);
      await new Promise<Record<string, unknown>>((resolve) => {
        client.emit(
          "player:join",
          { code: game.code, nickname: `Player${i + 1}` },
          (res: Record<string, unknown>) => {
            resolve(res);
          },
        );
      });
    }

    // 9th player should be rejected
    const extraClient = createClient();
    await waitForConnect(extraClient);

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      extraClient.emit(
        "player:join",
        { code: game.code, nickname: "ExtraPlayer" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Game is full (max 8 players)");
  });

  it("host:start by host with 2+ players succeeds and emits game:started to all", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    const playerClient = createClient();
    await waitForConnect(playerClient);

    await new Promise<Record<string, unknown>>((resolve) => {
      playerClient.emit(
        "player:join",
        { code: game.code, nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    const gameStartedPromise = new Promise<void>((resolve) => {
      playerClient.on("game:started", () => {
        resolve();
      });
    });

    const startResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:start", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });

    expect(startResult.success).toBe(true);
    await gameStartedPromise;
  });

  it("host:start by non-host returns error 'Only the host can start the game'", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    const playerClient = createClient();
    await waitForConnect(playerClient);

    await new Promise<Record<string, unknown>>((resolve) => {
      playerClient.emit(
        "player:join",
        { code: game.code, nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      playerClient.emit("host:start", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Only the host can start the game");
  });

  it("host:start with less than 2 players returns error 'Need at least 2 players to start'", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:start", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Need at least 2 players to start");
  });

  it("player:join rejects when game already started", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    const playerClient = createClient();
    await waitForConnect(playerClient);

    await new Promise<Record<string, unknown>>((resolve) => {
      playerClient.emit(
        "player:join",
        { code: game.code, nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    // Start the game
    await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:start", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });

    // Try to join after game started
    const lateClient = createClient();
    await waitForConnect(lateClient);

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      lateClient.emit(
        "player:join",
        { code: game.code, nickname: "Bob" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Game already in progress");
  });

  it("player:join rejects nickname longer than 32 characters", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    const playerClient = createClient();
    await waitForConnect(playerClient);

    const longNickname = "A".repeat(33);
    const result = await new Promise<Record<string, unknown>>((resolve) => {
      playerClient.emit(
        "player:join",
        { code: game.code, nickname: longNickname },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Nickname too long (max 32 characters)");
  });

  it("player:join rejects duplicate nickname case-insensitively", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    const player1 = createClient();
    await waitForConnect(player1);

    await new Promise<Record<string, unknown>>((resolve) => {
      player1.emit(
        "player:join",
        { code: game.code, nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    const player2 = createClient();
    await waitForConnect(player2);

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      player2.emit(
        "player:join",
        { code: game.code, nickname: "aLiCe" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Nickname already taken");
  });

  it("disconnect broadcasts updated player list with connected=0", async () => {
    const hostClient = createClient();
    await waitForConnect(hostClient);

    const createResult = await new Promise<Record<string, unknown>>((resolve) => {
      hostClient.emit("host:create", (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
    const game = createResult.game as { code: string };

    const playerClient = createClient();
    await waitForConnect(playerClient);

    // Wait for the join broadcast first so we don't confuse it with the disconnect broadcast
    const joinBroadcastPromise = new Promise<void>((resolve) => {
      hostClient.once("players:updated", () => {
        resolve();
      });
    });

    await new Promise<Record<string, unknown>>((resolve) => {
      playerClient.emit(
        "player:join",
        { code: game.code, nickname: "Alice" },
        (res: Record<string, unknown>) => {
          resolve(res);
        },
      );
    });

    await joinBroadcastPromise;

    // Now listen for the disconnect broadcast
    const disconnectBroadcastPromise = new Promise<{ connected: number; nickname: string }[]>(
      (resolve) => {
        hostClient.once("players:updated", (data: { connected: number; nickname: string }[]) => {
          resolve(data);
        });
      },
    );

    playerClient.disconnect();

    const updatedPlayers = await disconnectBroadcastPromise;
    const alice = updatedPlayers.find((p) => p.nickname === "Alice");
    expect(alice).toBeDefined();
    expect(alice!.connected).toBe(0);
  });
});
