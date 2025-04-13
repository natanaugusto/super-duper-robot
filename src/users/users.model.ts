import db, { type User } from "@db"

export type UserInput = Omit<User, "id" | "createdAt" | "updatedAt">

const select = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  role: true,
}

export const createUser = (user: UserInput) =>
  db.user.create({
    data: user,
    select
  })

export const getUsers = () => db.user.findMany({ select })

export const getUserById = (id: number) =>
  db.user.findUniqueOrThrow({ where: { id }, select })

export const updateUser = (id: number, user: Partial<UserInput>) =>
  db.user.update({
    where: { id },
    data: user
  })

export const deleteUser = (id: number) => db.user.delete({ where: { id } })
