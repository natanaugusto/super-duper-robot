import { z } from "zod"

const RoleEnum = z.enum(["admin", "client"])

export const userSchema = z.object({
  name: z.string().min(4, "Name is too short").max(100, "Name is too long"),
  email: z.string().email("The email is invalid"),
  password: z.string().min(6, "The password must have at least 6 characters"),
  role: RoleEnum.default("client"),
})

export const partialUserSchema = userSchema.partial()

export type User = z.infer<typeof userSchema>
export type PartialUser = z.infer<typeof partialUserSchema>
