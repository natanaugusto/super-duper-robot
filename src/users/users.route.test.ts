import Fastify, { FastifyInstance } from "fastify"
import { StatusCodes, getReasonPhrase } from "http-status-codes"
import usersRoute from "./users.route"
import * as userModel from "./users.model"
import { Prisma } from "@db"
import z from "zod"

jest.mock("./users.model", () => ({
  createUser: jest.fn(),
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}))

describe("Users - Route", () => {
  let app: FastifyInstance

  const mockUserInput = {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "secret",
    role: "client",
  }

  const mockUser = {
    id: 1,
    ...mockUserInput,
    createdAt: new Date().toDateString(),
    updatedAt: new Date().toDateString(),
  }

  beforeEach(async () => {
    app = Fastify()
    app.register(usersRoute)
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await app.close()
  })

  describe("CREATE - POST", () => {
    it("should create an user", async () => {
      ;(userModel.createUser as jest.Mock).mockResolvedValue(mockUser)

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: mockUserInput,
      })

      expect(response.statusCode).toBe(StatusCodes.CREATED)
      expect(response.json()).toEqual(mockUser)
      expect(userModel.createUser).toHaveBeenCalledWith(mockUserInput)
    })

    it("should receive an error user creation", async () => {
      const error = new Prisma.PrismaClientKnownRequestError("User not found", {
        code: "P2002",
        meta: {
          moduleName: "User",
          target: ["email"],
        },
        clientVersion: "1",
      })
      ;(userModel.createUser as jest.Mock).mockRejectedValue(error)

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: mockUserInput,
      })

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(response.json()).toEqual(error.meta)
    })
  })

  describe("READ - GET", () => {
    it("should get all users", async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 2, name: "Jane Doe" }]
      ;(userModel.getUsers as jest.Mock).mockResolvedValue(mockUsers)

      const response = await app.inject({
        method: "GET",
        url: "/users",
      })

      expect(response.statusCode).toBe(StatusCodes.OK)
      expect(response.json()).toEqual(mockUsers)
      expect(userModel.getUsers).toHaveBeenCalled()
    })

    it("should get a user by ID", async () => {
      const userId = 1
      ;(userModel.getUserById as jest.Mock).mockResolvedValue(mockUser)

      const response = await app.inject({
        method: "GET",
        url: `/users/${userId}`,
      })

      expect(response.statusCode).toBe(StatusCodes.OK)
      expect(response.json()).toEqual(mockUser)
      expect(userModel.getUserById).toHaveBeenCalledWith(userId)
    })

    it("should receive an error on get all users", async () => {
      const error = new Error("Internal Error")
      ;(userModel.getUsers as jest.Mock).mockRejectedValue(error)

      const response = await app.inject({
        method: "GET",
        url: "/users",
      })

      expect(response.json()).toEqual({
        error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        message: error.message,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    })

    it("should receive an error on get user by ID", async () => {
      const userId = 999
      const error = new Prisma.PrismaClientKnownRequestError("User not found", {
        code: "P2025",
        meta: {
          moduleName: "User",
          cause: "Expected a record, found none.",
        },
        clientVersion: "1",
      })
      ;(userModel.getUserById as jest.Mock).mockRejectedValue(error)

      const response = await app.inject({
        method: "GET",
        url: `/users/${userId}`,
      })

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
      expect(response.json()).toEqual(error.meta)
    })
  })

  describe("UPDATE - UPDATE", () => {
    it("should update an user", async () => {
      const userId = 1
      const updateData = { name: "John Updated" }
      const updatedUser = { ...mockUser, name: "John Updated" }
      ;(userModel.updateUser as jest.Mock).mockResolvedValue(undefined)
      ;(userModel.getUserById as jest.Mock).mockResolvedValue(updatedUser)

      const response = await app.inject({
        method: "PUT",
        url: `/users/${userId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(StatusCodes.CREATED)
      expect(response.json()).toEqual(updatedUser)
      expect(userModel.updateUser).toHaveBeenCalledWith(userId, updateData)
      expect(userModel.getUserById).toHaveBeenCalledWith(userId)
    })

    it("should receive an error on update an user", async () => {
      const userId = 1
      const updateData = { name: "Jo" }
      const error = new z.ZodError([
        {
          code: "too_small",
          minimum: 4,
          type: "string",
          inclusive: true,
          exact: false,
          message: "Name is too short",
          path: ["name"],
        },
      ])
      ;(userModel.updateUser as jest.Mock).mockRejectedValue(error)

      const response = await app.inject({
        method: "PUT",
        url: `/users/${userId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(response.json()).toEqual([
        {
          message: "Name is too short",
          path: ["name"],
        },
      ])
    })
  })

  describe("DELETE - DELETE", () => {
    it("should delete an user", async () => {
      const userId = 1
      ;(userModel.deleteUser as jest.Mock).mockResolvedValue(mockUser)

      const response = await app.inject({
        method: "DELETE",
        url: `/users/${userId}`,
      })

      expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
      expect(response.body).toBe("")
      expect(userModel.deleteUser).toHaveBeenCalledWith(userId)
    })

    it("should receive user not found", async () => {
      const userId = 999
      ;(userModel.deleteUser as jest.Mock).mockResolvedValue(null)

      const response = await app.inject({
        method: "DELETE",
        url: `/users/${userId}`,
      })

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it("should receive a an error on user delete", async () => {
      const userId = 999
      const error = new Error("Error on delete")
      ;(userModel.deleteUser as jest.Mock).mockRejectedValue(error)

      const response = await app.inject({
        method: "DELETE",
        url: `/users/${userId}`,
      })

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.json()).toEqual({
        error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        message: error.message,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    })
  })
})
