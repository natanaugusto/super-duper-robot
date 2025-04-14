import { Role } from "../../prisma"
import {
  createUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  getUsers,
  updateUser,
} from "./users.service"

jest.mock("../../prisma", () => {
  const mockPrisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  return {
    __esModule: true,
    default: mockPrisma,
    Role: {
      admin: "admin",
      client: "client",
    } as const,
    User: {},
  }
})

describe("Users - Service", () => {
  const user = {
    name: "John Doe",
    email: "john.doe@mail.com",
    password: "secret",
    role: "client" as Role,
  }

  const mockedUser = {
    ...user,
    id: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const select = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    updatedAt: true,
    role: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should create an user", async () => {
    const db = jest.requireMock("../../prisma").default
    db.user.create.mockResolvedValue(mockedUser)

    const result = await createUser(user)

    expect(db.user.create).toHaveBeenCalledWith({
      data: user,
      select,
    })
    expect(result).toEqual(mockedUser)
  })

  it("should get all users", async () => {
    const db = jest.requireMock("../../prisma").default
    const mockUsers = [mockedUser, { ...mockedUser, id: 2, name: "Jane Doe" }]
    db.user.findMany.mockResolvedValue(mockUsers)

    const result = await getUsers()

    expect(db.user.findMany).toHaveBeenCalled()
    expect(result).toEqual(mockUsers)
  })

  it("should get a user by ID", async () => {
    const db = jest.requireMock("../../prisma").default
    const userId = 1
    db.user.findUniqueOrThrow.mockResolvedValue(mockedUser)

    const result = await getUserById(userId)

    expect(db.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: userId },
      select,
    })
    expect(result).toEqual(mockedUser)
  })

  it("should get a user by email", async () => {
    const db = jest.requireMock("../../prisma").default
    const userEmail = "john.doe@mail.com"
    db.user.findUniqueOrThrow.mockResolvedValue(mockedUser)

    const result = await getUserByEmail(userEmail)

    expect(db.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { email: userEmail },
    })
    expect(result).toEqual(mockedUser)
  })

  it("should update a user", async () => {
    const db = jest.requireMock("../../prisma").default
    const userId = 1
    const updateData = { name: "John Updated" }
    const updatedUser = { ...mockedUser, name: "John Updated" }
    db.user.update.mockResolvedValue(updatedUser)

    const result = await updateUser(userId, updateData)

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: updateData,
    })
    expect(result).toEqual(updatedUser)
  })

  it("should delete a user", async () => {
    const db = jest.requireMock("../../prisma").default
    const userId = 1
    db.user.delete.mockResolvedValue(mockedUser)

    await deleteUser(userId)

    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: userId } })
  })
})
