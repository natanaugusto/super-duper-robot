import { Prisma } from "@db"
import { ZodError } from "zod"
import { FastifyReply } from "fastify"
import { StatusCodes } from "http-status-codes"

export function replyException(
  err: unknown,
  reply: FastifyReply,
): FastifyReply {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return reply.status(StatusCodes.NOT_FOUND).send(err.meta)
      case "P2002":
        return reply.status(StatusCodes.UNPROCESSABLE_ENTITY).send(err.meta)
    }
  }

  if (err instanceof ZodError) {
    return reply.status(StatusCodes.UNPROCESSABLE_ENTITY).send(
      err.errors.map((issue) => ({
        message: issue.message,
        path: issue.path,
      })),
    )
  }

  return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err)
}
