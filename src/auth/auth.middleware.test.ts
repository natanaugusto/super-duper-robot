import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { StatusCodes } from "http-status-codes"
import { auth } from "./auth.middleware"

// Mock FastifyRequest and FastifyReply
const mockRequest = {
  jwtVerify: jest.fn(),
} as unknown as FastifyRequest

const mockReply = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
} as unknown as FastifyReply

describe("Authenticate Middleware", () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
    // Mock JWT plugin
    app.decorateRequest("jwtVerify", jest.fn())
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await app.close()
  })

  it("should allow request with valid JWT", async () => {
    ;(mockRequest.jwtVerify as jest.Mock).mockResolvedValue(undefined)

    const result = await auth(mockRequest, mockReply)

    expect(mockRequest.jwtVerify).toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it("should return 401 for invalid JWT", async () => {
    const error = new Error()
    ;(mockRequest.jwtVerify as jest.Mock).mockRejectedValue(error)

    const result = await auth(mockRequest, mockReply)

    expect(mockRequest.jwtVerify).toHaveBeenCalled()
    expect(mockReply.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED)
    expect(result).toBe(mockReply)
  })
})
