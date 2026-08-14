import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket";

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

  registerSocketHandlers(io, fastify.log);

  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  return { fastify, io };
}
