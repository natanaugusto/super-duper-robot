import { hash } from "bcrypt"
import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "./users.service"
import { partialUserSchema, userSchema } from "./user.schema"
import { replyException } from "../utils/replyException"
import { auth } from "../auth/auth.middleware"

export default function usersRoute(app: FastifyInstance) {
  app.post("/users", async (req, reply) => {
    try {
      const userData = userSchema.parse(req.body)

      const user = await createUser({
        ...userData,
        password: await hash(userData.password, 10),
      })

      return reply.status(StatusCodes.CREATED).send(user)
    } catch (err) {
      return replyException(err, reply)
    }
  })

  app.get("/users", { preHandler: auth }, async (_req, reply) => {
    try {
      const users = await getUsers()

      return reply.status(StatusCodes.OK).send(users)
    } catch (err) {
      return replyException(err, reply)
    }
  })

  app.get("/users/:id", { preHandler: auth }, async (req, reply) => {
    try {
      const { id } = req.params as { id: number }

      const user = await getUserById(Number(id))

      return reply.status(StatusCodes.OK).send(user)
    } catch (err) {
      return replyException(err, reply)
    }
  })

  app.put("/users/:id", { preHandler: auth }, async (req, reply) => {
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

  app.delete("/users/:id", { preHandler: auth }, async (req, reply) => {
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
