import { StatusCodes } from "http-status-codes"
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import * as bcrypt from "bcrypt"
import authRoute from "./auth.route"
import * as authMiddleware from "./auth.middleware"
import { getUserByEmail } from "../users/users.service"

jest.mock("bcrypt")
jest.mock("./auth.middleware")
jest.mock("../users/users.service", () => ({
  getUserByEmail: jest.fn(),
}))

describe("Auth - Route", () => {
  let app: FastifyInstance
  let mockAuthMiddleware

  const mockAuthInput = {
    email: "john.doe@example.com",
    password: "secret",
  }

  const mockUser = {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    password: "hashed-password",
    role: "client",
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  }

  const mockUserWithoutPassword = {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
    role: mockUser.role,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  }

  beforeEach(async () => {
    app = Fastify()
    // @ts-ignore
    app.decorate("jwt", { sign: jest.fn() })
    // @ts-ignore
    app.decorateRequest("user", null)
    await app.register(authRoute)
    jest
      .spyOn(bcrypt, "compare")
      .mockImplementation(
        async (input, hash) => input === "secret" && hash === "hashed-password",
      )
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await app.close()
  })

  describe("Login - POST", () => {
    it("should login successfully with valid credentials", async () => {
      ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
      const mockToken = "jwt-token"
      ;(app.jwt.sign as jest.Mock).mockReturnValue(mockToken)

      const response = await app.inject({
        method: "POST",
        url: "/login",
        payload: mockAuthInput,
      })

      expect(response.statusCode).toBe(StatusCodes.OK)
      expect(response.json()).toEqual({
        ...mockUserWithoutPassword,
        token: mockToken,
      })
      expect(getUserByEmail).toHaveBeenCalledWith(mockAuthInput.email)
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockAuthInput.password,
        mockUser.password,
      )
      expect(app.jwt.sign).toHaveBeenCalledWith(mockUserWithoutPassword)
    })

    it("should receive 404 for invalid email", async () => {
      ;(getUserByEmail as jest.Mock).mockResolvedValue(null)

      const response = await app.inject({
        method: "POST",
        url: "/login",
        payload: mockAuthInput,
      })

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
      expect(getUserByEmail).toHaveBeenCalledWith(mockAuthInput.email)
    })

    it("should receive 401 for invalid password", async () => {
      ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const response = await app.inject({
        method: "POST",
        url: "/login",
        payload: mockAuthInput,
      })

      expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
      expect(getUserByEmail).toHaveBeenCalledWith(mockAuthInput.email)
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockAuthInput.password,
        mockUser.password,
      )
    })

    it("should receive ZodError via replyException", async () => {
      const invalidInput = { email: "invalid", password: "" }
      const response = await app.inject({
        method: "POST",
        url: "/login",
        payload: invalidInput,
      })

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(response.json()).toEqual([
        { message: "The email is invalid", path: ["email"] },
        {
          message: "The password must have at least 6 characters",
          path: ["password"],
        },
      ])
      expect(getUserByEmail).not.toHaveBeenCalled()
      expect(bcrypt.compare).not.toHaveBeenCalled()
      expect(app.jwt.sign).not.toHaveBeenCalled()
    })
  })

  describe("Logged - GET", () => {
    it("should return authenticated user with valid JWT", async () => {
      jest
        .spyOn(authMiddleware, "auth")
        .mockImplementationOnce(
          async (req: FastifyRequest, _reply: FastifyReply) => {
            req.user = mockUser
          },
        )

      const response = await app.inject({
        method: "GET",
        url: "/logged",
      })

      expect(response.statusCode).toBe(StatusCodes.OK)
      expect(response.json()).toEqual(mockUser)
    })

    it("should return 401 for invalid JWT", async () => {
      jest
        .spyOn(authMiddleware, "auth")
        .mockImplementationOnce(
          async (_req: FastifyRequest, reply: FastifyReply) => {
            return reply.status(StatusCodes.UNAUTHORIZED).send()
          },
        )

      const response = await app.inject({
        method: "GET",
        url: "/logged",
      })

      expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    })

    it("should return an error", async () => {
      jest
        .spyOn(authMiddleware, "auth")
        .mockImplementationOnce(
          async (req: FastifyRequest, _reply: FastifyReply) => {
            req.user = ""
          },
        )

      const response = await app.inject({
        method: "GET",
        url: "/logged",
      })

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })
  })
})
