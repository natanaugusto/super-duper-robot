import Fastify, { FastifyInstance } from "fastify"
import { StatusCodes, getReasonPhrase } from "http-status-codes"
import usersRoute from "./users.route"
import * as userService from "./users.service"

jest.mock("./users.service", () => ({
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
      ;(userService.createUser as jest.Mock).mockResolvedValue(mockUser)

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: mockUserInput,
      })

      expect(response.statusCode).toBe(StatusCodes.CREATED)
      expect(response.json()).toEqual(mockUser)
      expect(userService.createUser).toHaveBeenCalledWith(mockUserInput)
    })

    it("should receive an error user creation", async () => {
      const error = new Error("Database error")
      ;(userService.createUser as jest.Mock).mockRejectedValue(error)

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: mockUserInput,
      })

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.json()).toEqual({
        error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        message: error.message,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    })
  })

  describe("READ - GET", () => {
    it("should get all users", async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 2, name: "Jane Doe" }]
      ;(userService.getUsers as jest.Mock).mockResolvedValue(mockUsers)

      const response = await app.inject({
        method: "GET",
        url: "/users",
      })

      expect(response.statusCode).toBe(StatusCodes.OK)
      expect(response.json()).toEqual(mockUsers)
      expect(userService.getUsers).toHaveBeenCalled()
    })

    it("should get a user by ID", async () => {
      const userId = 1
      ;(userService.getUserById as jest.Mock).mockResolvedValue(mockUser)

      const response = await app.inject({
        method: "GET",
        url: `/users/${userId}`,
      })

      expect(response.statusCode).toBe(StatusCodes.OK)
      expect(response.json()).toEqual(mockUser)
      expect(userService.getUserById).toHaveBeenCalledWith(userId)
    })

    it("should receive an error on get all users", async () => {
      const error = new Error("Internal Error")
      ;(userService.getUsers as jest.Mock).mockRejectedValue(error)

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
      const error = new Error("User not found")
      ;(userService.getUserById as jest.Mock).mockRejectedValue(error)

      const response = await app.inject({
        method: "GET",
        url: `/users/${userId}`,
      })

      expect(response.json()).toEqual({
        error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        message: error.message,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    })
  })

  describe("UPDATE - UPDATE", () => {
    it("should update an user", async () => {
      const userId = 1
      const updateData = { name: "John Updated" }
      const updatedUser = { ...mockUser, name: "John Updated" }
      ;(userService.updateUser as jest.Mock).mockResolvedValue(undefined)
      ;(userService.getUserById as jest.Mock).mockResolvedValue(updatedUser)

      const response = await app.inject({
        method: "PUT",
        url: `/users/${userId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(StatusCodes.CREATED)
      expect(response.json()).toEqual(updatedUser)
      expect(userService.updateUser).toHaveBeenCalledWith(userId, updateData)
      expect(userService.getUserById).toHaveBeenCalledWith(userId)
    })

    it("should receive an error on update an user", async () => {
      const userId = 1
      const updateData = { name: "John Updated" }
      const error = new Error("Error on update")
      ;(userService.updateUser as jest.Mock).mockRejectedValue(error)

      const response = await app.inject({
        method: "PUT",
        url: `/users/${userId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.json()).toEqual({
        error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        message: error.message,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    })
  })

  describe("DELETE - DELETE", () => {
    it("should delete an user", async () => {
      const userId = 1
      ;(userService.deleteUser as jest.Mock).mockResolvedValue(mockUser)

      const response = await app.inject({
        method: "DELETE",
        url: `/users/${userId}`,
      })

      expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
      expect(response.body).toBe("")
      expect(userService.deleteUser).toHaveBeenCalledWith(userId)
    })

    it("should receive user not found", async () => {
      const userId = 999
      ;(userService.deleteUser as jest.Mock).mockResolvedValue(null)

      const response = await app.inject({
        method: "DELETE",
        url: `/users/${userId}`,
      })

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it("should receive a an error on user delete", async () => {
      const userId = 999
      const error = new Error("Error on delete")
      ;(userService.deleteUser as jest.Mock).mockRejectedValue(error)

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
