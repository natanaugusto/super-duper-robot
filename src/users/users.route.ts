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
import { User } from "../../prisma"

type Column = keyof Omit<User, "password">
type Direction = "asc" | "desc"
type OrderBy = { [key in Column]?: Direction }
type Query = {
  search?: string
  order?: string
}

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

  app.get("/users", { preHandler: auth }, async (req, reply) => {
    try {
      const query = req.query as Query
      let where = {}
      let orderBy: OrderBy = {}

      if (query?.search && query.search.length > 3) {
        where = {
          ...where,
          OR: [
            {
              name: {
                contains: query.search.toLowerCase(),
              },
            },
            {
              email: {
                contains: query.search.toLowerCase(),
              },
            },
          ],
        }
      }

      if (query?.order && typeof query.order === "string") {
        if (query.order.indexOf(":") > -1) {
          const [column, direction] = query.order.split(":")
          orderBy[column as Column] = direction as Direction
        } else {
          orderBy[query.order as Column] = "asc"
        }
      }

      const users = await getUsers({ where, orderBy })

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
