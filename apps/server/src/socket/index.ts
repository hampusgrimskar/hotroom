import { Server, Socket } from "socket.io";
import type { FastifyBaseLogger } from "fastify";
import type { GameService } from "../services/game-service";
import { registerLobbyHandlers } from "./lobby-handlers";

export function registerSocketHandlers(
  io: Server,
  log: FastifyBaseLogger,
  gameService: GameService,
) {
  io.on("connection", (socket: Socket) => {
    log.info({ socketId: socket.id }, "Client connected");
    registerLobbyHandlers(socket, log, gameService);
  });
}
