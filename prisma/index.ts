import { PrismaClient } from "./client"

export const db = new PrismaClient()

export { Role, User } from "./client"
