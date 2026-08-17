import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket";
import { createGameService } from "./services/game-service";
import { db } from "./db";

export async function buildServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: process.env.WEB_URL || "http://localhost:3000",
  });

  const io = new Server(fastify.server, {
    cors: {
      origin: process.env.WEB_URL || "http://localhost:3000",
    },
  });

  const gameService = createGameService(db);
  registerSocketHandlers(io, fastify.log, gameService);

  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  return { fastify, io };
}
