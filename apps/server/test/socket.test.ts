import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../src/server";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { AddressInfo } from "net";

describe("socket.io", () => {
  let fastify: FastifyInstance;
  let io: Server;
  let port: number;

  beforeAll(async () => {
    const server = await buildServer();
    fastify = server.fastify;
    io = server.io;
    await fastify.listen({ port: 0 });
    port = (fastify.server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    io.close();
    await fastify.close();
  });

  function createClient(): ClientSocket {
    return ioClient(`http://localhost:${port}`, {
      transports: ["websocket"],
    });
  }

  it("accepts a client connection", async () => {
    const client = createClient();

    await new Promise<void>((resolve) => {
      client.on("connect", () => {
        expect(client.connected).toBe(true);
        resolve();
      });
    });

    client.disconnect();
  });

  it("handles multiple simultaneous connections", async () => {
    const client1 = createClient();
    const client2 = createClient();
    const client3 = createClient();

    await Promise.all([
      new Promise<void>((resolve) => client1.on("connect", resolve)),
      new Promise<void>((resolve) => client2.on("connect", resolve)),
      new Promise<void>((resolve) => client3.on("connect", resolve)),
    ]);

    expect(client1.connected).toBe(true);
    expect(client2.connected).toBe(true);
    expect(client3.connected).toBe(true);

    client1.disconnect();
    client2.disconnect();
    client3.disconnect();
  });
});
