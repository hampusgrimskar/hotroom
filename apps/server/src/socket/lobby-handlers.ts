import type { Socket } from "socket.io";
import type { FastifyBaseLogger } from "fastify";
import type { GameService } from "../services/game-service";
import { SocketEvents, MAX_PLAYERS } from "@hotseat/shared";

export interface SocketData {
  gameId: string;
  playerId: string;
}

/** Strip socketId from player data before sending to clients */
function sanitizePlayersForClient<T extends { socketId: unknown }>(
  players: T[],
): Omit<T, "socketId">[] {
  return players.map((player) => {
    const { socketId, ...rest } = player;
    void socketId;
    return rest as Omit<T, "socketId">;
  });
}

export function registerLobbyHandlers(
  socket: Socket,
  log: FastifyBaseLogger,
  gameService: GameService,
) {
  socket.on(SocketEvents.HOST_CREATE, async (callback) => {
    if (typeof callback !== "function") return;
    try {
      const game = await gameService.createGame();
      if (!game) {
        callback({ success: false, error: "Failed to create game" });
        return;
      }

      const player = await gameService.addPlayer(game.id, "Host", socket.id, 1);
      if (!player) {
        callback({ success: false, error: "Failed to create host player" });
        return;
      }

      socket.join(game.id);
      (socket.data as SocketData) = { gameId: game.id, playerId: player.id };

      const playerList = await gameService.getPlayersInGame(game.id);
      callback({ success: true, game, player, players: sanitizePlayersForClient(playerList) });

      log.info({ gameId: game.id, code: game.code }, "Game created");
    } catch (err) {
      log.error(err, "Failed to create game");
      callback({ success: false, error: "Failed to create game" });
    }
  });

  socket.on(SocketEvents.PLAYER_JOIN, async (data, callback) => {
    if (typeof callback !== "function") return;
    try {
      const { code, nickname } = data;

      if (!code || !nickname) {
        callback({ success: false, error: "Code and nickname are required" });
        return;
      }

      if (nickname.length > 32) {
        callback({ success: false, error: "Nickname too long (max 32 characters)" });
        return;
      }

      const game = await gameService.findGameByCode(code);
      if (!game) {
        callback({ success: false, error: "Game not found" });
        return;
      }

      if (game.state !== "lobby") {
        callback({ success: false, error: "Game already in progress" });
        return;
      }

      const existingPlayers = await gameService.getPlayersInGame(game.id);

      // Check max player limit (we only have 8 colors; wrapping would cause duplicates)
      if (existingPlayers.length >= MAX_PLAYERS) {
        callback({ success: false, error: "Game is full (max 8 players)" });
        return;
      }

      // Check for duplicate nickname (case-insensitive)
      const isDuplicate = existingPlayers.some(
        (p) => p.nickname.toLowerCase() === nickname.toLowerCase(),
      );
      if (isDuplicate) {
        callback({ success: false, error: "Nickname already taken" });
        return;
      }

      const player = await gameService.addPlayer(game.id, nickname, socket.id);
      if (!player) {
        callback({ success: false, error: "Failed to create player" });
        return;
      }

      socket.join(game.id);
      (socket.data as SocketData) = { gameId: game.id, playerId: player.id };

      const playerList = await gameService.getPlayersInGame(game.id);
      callback({ success: true, game, player, players: sanitizePlayersForClient(playerList) });

      socket.to(game.id).emit(SocketEvents.PLAYERS_UPDATED, sanitizePlayersForClient(playerList));

      log.info({ gameId: game.id, nickname }, "Player joined");
    } catch (err) {
      log.error(err, "Failed to join game");
      callback({ success: false, error: "Failed to join game" });
    }
  });

  socket.on(SocketEvents.HOST_START, async (callback) => {
    if (typeof callback !== "function") return;
    try {
      const { gameId, playerId } = (socket.data as SocketData) || {};
      if (!gameId || !playerId) {
        callback({ success: false, error: "Not in a game" });
        return;
      }

      const players = await gameService.getPlayersInGame(gameId);
      const host = players.find((p) => p.id === playerId);
      if (!host || !host.isHost) {
        callback({ success: false, error: "Only the host can start the game" });
        return;
      }

      if (players.length < 2) {
        callback({ success: false, error: "Need at least 2 players to start" });
        return;
      }

      await gameService.updateGameState(gameId, "prompt");
      callback({ success: true });

      socket.nsp.to(gameId).emit(SocketEvents.GAME_STARTED);

      log.info({ gameId }, "Game started");
    } catch (err) {
      log.error(err, "Failed to start game");
      callback({ success: false, error: "Failed to start game" });
    }
  });

  socket.on("disconnect", async (reason) => {
    try {
      log.info({ socketId: socket.id, reason }, "Client disconnected");

      const { gameId } = (socket.data as SocketData) || {};
      if (gameId) {
        await gameService.disconnectPlayer(socket.id);
        const players = await gameService.getPlayersInGame(gameId);
        socket.to(gameId).emit(SocketEvents.PLAYERS_UPDATED, sanitizePlayersForClient(players));
      }
    } catch (err) {
      log.error(err, "Error handling disconnect");
    }
  });
}
