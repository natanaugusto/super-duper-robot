import { compare } from "bcrypt"
import { FastifyInstance } from "fastify"
import { authSchema } from "./auth.schema"
import { getUserByEmail } from "../users/users.service"
import { StatusCodes } from "http-status-codes"
import { replyException } from "../utils/replyException"

export default async function authRoute(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    try {
      const authData = authSchema.parse(req.body)
      const search = await getUserByEmail(authData.email)

      if (!search) {
        return reply.status(StatusCodes.NOT_FOUND).send()
      }

      const { password, ...user } = search

      if (!user || !(await compare(authData.password, password))) {
        return reply.status(StatusCodes.UNAUTHORIZED).send()
      }

      const token = app.jwt.sign(user)

      return reply.status(StatusCodes.OK).send({ ...user, token })
    } catch (err) {
      return replyException(err, reply)
    }
  })
}
