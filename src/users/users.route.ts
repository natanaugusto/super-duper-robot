import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import {
  type UserInput,
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "./users.service"

export default function usersRoute(app: FastifyInstance) {
  app.post("/users", async (req, reply) => {
    try {
      const userData = req.body as UserInput

      const user = await createUser(userData)

      return reply.status(StatusCodes.CREATED).send(user)
    } catch (err) {
      return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err)
    }
  })

  app.get("/users", async (_req, reply) => {
    try {
      const users = await getUsers()

      return reply.status(StatusCodes.OK).send(users)
    } catch (err) {
      return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err)
    }
  })

  app.get("/users/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: number }

      const user = await getUserById(Number(id))

      return reply.status(StatusCodes.OK).send(user)
    } catch (err) {
      return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err)
    }
  })

  app.put("/users/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: number }

      const userData = req.body as UserInput
      await updateUser(Number(id), userData)

      const user = await getUserById(Number(id))
      return reply.status(StatusCodes.CREATED).send(user)
    } catch (err) {
      return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err)
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
      return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err)
    }
  })
}
