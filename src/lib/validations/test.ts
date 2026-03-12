import * as z from "zod"

export const testSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  start_time: z.string().min(1, {
    message: "Start time is required.",
  }),
  duration_minutes: z.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
})

export const questionSchema = z.object({
  question_text: z.string().min(1, {
    message: "Question text is required.",
  }),
  option_a: z.string().min(1, {
    message: "Option A is required.",
  }),
  option_b: z.string().min(1, {
    message: "Option B is required.",
  }),
  option_c: z.string().min(1, {
    message: "Option C is required.",
  }),
  option_d: z.string().min(1, {
    message: "Option D is required.",
  }),
  correct_answer: z.enum(["a", "b", "c", "d"]),
})
