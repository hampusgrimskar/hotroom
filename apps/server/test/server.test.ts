import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../src/server";
import type { FastifyInstance } from "fastify";

describe("server", () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    const server = await buildServer();
    fastify = server.fastify;
  });

  afterAll(async () => {
    await fastify.close();
  });

  it("responds to health check", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
