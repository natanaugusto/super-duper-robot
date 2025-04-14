import fastify from "fastify"
import jwt from "@fastify/jwt"
import { config as env } from "dotenv"
import { StatusCodes } from "http-status-codes"
import usersRoute from "./users/users.route"
import authRoute from "./auth/auth.route"

env()

const app = fastify()

app.get("/health", async (_req, reply) => reply.status(StatusCodes.OK).send())
app.register(jwt, { secret: process.env.JWT_SECRET || "secret" })
app.register(authRoute)
app.register(usersRoute)

app.listen({
  port: Number(process.env.APP_PORT) || 3000,
  host: process.env.APP_HOST || "localhost",
})
