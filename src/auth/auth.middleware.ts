import type { FastifyReply, FastifyRequest } from "fastify"
import { StatusCodes } from "http-status-codes"

export const auth = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(StatusCodes.UNAUTHORIZED).send()
  }
}
