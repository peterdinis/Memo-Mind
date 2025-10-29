import {z} from "zod"

export const signInSchema = z.object({
  email: z.string().email('Neplatný email'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
})

export const signUpSchema = z.object({
  email: z.string().email('Neplatný email'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  fullName: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
})

export const signOutSchema = z.object({})