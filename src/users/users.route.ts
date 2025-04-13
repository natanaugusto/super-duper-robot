import { FastifyInstance, FastifyReply } from "fastify"
import { StatusCodes } from "http-status-codes"
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "./users.model"
import { partialUserSchema, userSchema } from "./user.schema"
import { Prisma } from "@db"
import { ZodError } from "zod"

export default function usersRoute(app: FastifyInstance) {
  app.post("/users", async (req, reply) => {
    try {
      const userData = userSchema.parse(req.body)

      const user = await createUser(userData)

      return reply.status(StatusCodes.CREATED).send(user)
    } catch (err) {
      return replyException(err, reply)
    }
  })

  app.get("/users", async (_req, reply) => {
    try {
      const users = await getUsers()

      return reply.status(StatusCodes.OK).send(users)
    } catch (err) {
      return replyException(err, reply)
    }
  })

  app.get("/users/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: number }

      const user = await getUserById(Number(id))

      return reply.status(StatusCodes.OK).send(user)
    } catch (err) {
      return replyException(err, reply)
    }
  })

  app.put("/users/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: number }

      const userData = partialUserSchema.parse(req.body)
      await updateUser(Number(id), userData)

      const user = await getUserById(Number(id))
      return reply.status(StatusCodes.CREATED).send(user)
    } catch (err) {
      return replyException(err, reply)
    }
  })

  app.delete("/users/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: number }

      const user = await deleteUser(Number(id))
      if (user) {
        return reply.status(StatusCodes.NO_CONTENT).send()
      }

      return reply.status(StatusCodes.NOT_FOUND).send()
    } catch (err) {
      return replyException(err, reply)
    }
  })
}

function replyException(err: unknown, reply: FastifyReply): FastifyReply {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return reply.status(StatusCodes.NOT_FOUND).send(err.meta)
      case "P2002":
        return reply.status(StatusCodes.UNPROCESSABLE_ENTITY).send(err.meta)
    }
  }

  if (err instanceof ZodError) {
    return reply
      .status(StatusCodes.UNPROCESSABLE_ENTITY)
      .send(
        err.errors.map((issue) => ({
          message: issue.message,
          path: issue.path,
        })),
      )
  }

  return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err)
}
