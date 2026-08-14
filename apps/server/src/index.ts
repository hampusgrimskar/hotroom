import { buildServer } from "./server";

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  const { fastify } = await buildServer();

  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
