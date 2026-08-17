import { Server, Socket } from "socket.io";
import type { FastifyBaseLogger } from "fastify";
import {
  createGame,
  findGameByCode,
  addPlayer,
  getPlayersInGame,
  disconnectPlayer,
  updateGameState,
} from "./services/game-service";

export function registerSocketHandlers(io: Server, log: FastifyBaseLogger) {
  io.on("connection", (socket: Socket) => {
    log.info({ socketId: socket.id }, "Client connected");

    socket.on("host:create", async (callback) => {
      try {
        const game = await createGame();
        if (!game) {
          callback({ success: false, error: "Failed to create game" });
          return;
        }

        const player = await addPlayer(game.id, "Host", socket.id, 1);
        if (!player) {
          callback({ success: false, error: "Failed to create host player" });
          return;
        }

        socket.join(game.id);
        socket.data = { gameId: game.id, playerId: player.id };

        const playerList = await getPlayersInGame(game.id);
        callback({ success: true, game, player, players: playerList });

        log.info({ gameId: game.id, code: game.code }, "Game created");
      } catch (err) {
        log.error(err, "Failed to create game");
        callback({ success: false, error: "Failed to create game" });
      }
    });

    socket.on("player:join", async (data, callback) => {
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

        const game = await findGameByCode(code);
        if (!game) {
          callback({ success: false, error: "Game not found" });
          return;
        }

        if (game.state !== "lobby") {
          callback({ success: false, error: "Game already in progress" });
          return;
        }

        const player = await addPlayer(game.id, nickname, socket.id);
        if (!player) {
          callback({ success: false, error: "Failed to create player" });
          return;
        }

        socket.join(game.id);
        socket.data = { gameId: game.id, playerId: player.id };

        const playerList = await getPlayersInGame(game.id);
        callback({ success: true, game, player, players: playerList });

        socket.to(game.id).emit("players:updated", playerList);

        log.info({ gameId: game.id, nickname }, "Player joined");
      } catch (err) {
        log.error(err, "Failed to join game");
        callback({ success: false, error: "Failed to join game" });
      }
    });

    socket.on("host:start", async (callback) => {
      try {
        const { gameId, playerId } = socket.data || {};
        if (!gameId || !playerId) {
          callback({ success: false, error: "Not in a game" });
          return;
        }

        const players = await getPlayersInGame(gameId);
        const host = players.find((p) => p.id === playerId);
        if (!host || !host.isHost) {
          callback({ success: false, error: "Only the host can start the game" });
          return;
        }

        if (players.length < 2) {
          callback({ success: false, error: "Need at least 2 players to start" });
          return;
        }

        await updateGameState(gameId, "prompt");
        callback({ success: true });

        io.to(gameId).emit("game:started");

        log.info({ gameId }, "Game started");
      } catch (err) {
        log.error(err, "Failed to start game");
        callback({ success: false, error: "Failed to start game" });
      }
    });

    socket.on("disconnect", async (reason) => {
      log.info({ socketId: socket.id, reason }, "Client disconnected");

      const { gameId } = socket.data || {};
      if (gameId) {
        await disconnectPlayer(socket.id);
        const players = await getPlayersInGame(gameId);
        socket.to(gameId).emit("players:updated", players);
      }
    });
  });
}
