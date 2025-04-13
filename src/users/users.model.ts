import db, { type User } from "@db"

export type UserInput = Omit<User, "id" | "createdAt" | "updatedAt">

export const createUser = (user: UserInput) =>
  db.user.create({
    data: user,
  })

export const getUsers = () => db.user.findMany()

export const getUserById = (id: number) =>
  db.user.findUniqueOrThrow({ where: { id } })

export const updateUser = (id: number, user: Partial<UserInput>) =>
  db.user.update({
    where: { id },
    data: user,
  })

export const deleteUser = (id: number) => db.user.delete({ where: { id } })
