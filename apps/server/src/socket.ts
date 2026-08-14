import { Server, Socket } from "socket.io";
import type { FastifyBaseLogger } from "fastify";

export function registerSocketHandlers(io: Server, log: FastifyBaseLogger) {
  io.on("connection", (socket: Socket) => {
    log.info({ socketId: socket.id }, "Client connected");

    socket.on("disconnect", (reason) => {
      log.info({ socketId: socket.id, reason }, "Client disconnected");
    });
  });
}
