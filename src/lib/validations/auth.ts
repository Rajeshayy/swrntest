import * as z from "zod"

export const loginSchema = z.object({
  registrationNumber: z.string().min(4, {
    message: "Registration number must be at least 4 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

export const registerSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  registrationNumber: z.string().min(4, {
    message: "Registration number must be at least 4 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  role: z.enum(["admin", "student"]).default("student"),
})
