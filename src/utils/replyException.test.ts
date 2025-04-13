import { Prisma } from "@db"
import { ZodError } from "zod"
import { FastifyReply } from "fastify"
import { StatusCodes } from "http-status-codes"
import { replyException } from "./replyException"

const mockReply = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
} as unknown as FastifyReply

describe("replyException", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should receive Prisma P2025 error (Not Found)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      meta: { cause: "Record not found" },
      clientVersion: "0.0.0",
    })

    const result = replyException(error, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
    expect(mockReply.send).toHaveBeenCalledWith({ cause: "Record not found" })
    expect(result).toBe(mockReply)
  })

  it("should receive Prisma P2002 error (Unique Constraint Violation)", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        meta: { target: ["email"] },
        clientVersion: "0.0.0",
      },
    )

    const result = replyException(error, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(
      StatusCodes.UNPROCESSABLE_ENTITY,
    )
    expect(mockReply.send).toHaveBeenCalledWith({ target: ["email"] })
    expect(result).toBe(mockReply)
  })

  it("should receive ZodError", () => {
    const error = new ZodError([
      {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["email"],
        message: "Expected string, received number",
      },
      {
        code: "too_small",
        minimum: 1,
        type: "string",
        inclusive: true,
        path: ["name"],
        message: "Name is required",
      },
    ])

    const result = replyException(error, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(
      StatusCodes.UNPROCESSABLE_ENTITY,
    )
    expect(mockReply.send).toHaveBeenCalledWith([
      { message: "Expected string, received number", path: ["email"] },
      { message: "Name is required", path: ["name"] },
    ])
    expect(result).toBe(mockReply)
  })

  it("should receive generic errors", () => {
    const error = new Error("Something went wrong")

    const result = replyException(error, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(
      StatusCodes.INTERNAL_SERVER_ERROR,
    )
    expect(mockReply.send).toHaveBeenCalledWith(error)
    expect(result).toBe(mockReply)
  })
})
