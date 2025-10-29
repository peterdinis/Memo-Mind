import z from "zod"

export const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})

export const signOutSchema = z.object({})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const verifyEmailSchema = z.object({})

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})