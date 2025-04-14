import { z } from "zod"

export const authSchema = z.object({
  email: z.string().email("The email is invalid"),
  password: z.string().min(6, "The password must have at least 6 characters"),
})

export type Auth = z.infer<typeof authSchema>
