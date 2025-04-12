import fastify from "fastify"
import { config as env } from "dotenv"
import { StatusCodes } from "http-status-codes"

env()

const app = fastify()

app.get("/health", async (_req, reply) => reply.status(StatusCodes.OK).send())

app.listen({
  port: Number(process.env.APP_PORT) || 3000,
  host: process.env.APP_HOST || "localhost",
})
