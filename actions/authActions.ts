"use server"

import { action, authenticatedAction } from "@/lib/next-safe-action"
import { signInSchema, signOutSchema, signUpSchema } from "@/schemas/authSchemas"
import { createClient } from "@/supabase/server"
import { InsertTables } from "@/types/supabase"
import { redirect } from "next/navigation"
import z from "zod"

export const signInAction = action
    .inputSchema(signInSchema)
    .action(async ({ parsedInput: { email, password } }) => {
        const supabase = await createClient()

        const { error, data } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            throw new Error(error.message)
        }

        return { success: true, user: data.user }
    })


export const signUpAction = action
  .inputSchema(signUpSchema)
  .action(async ({ parsedInput: { email, password, fullName } }) => {
    const supabase = await createClient()

    // Registrace uživatele
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      throw new Error(signUpError.message)
    }
    
    if (data.user) {
      const profileData: InsertTables<'profiles'> = {
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw new Error('Nepodařilo se vytvořit uživatelský profil')
      }
    }

    return { success: true, user: data.user }
  })

export const signOutAction = action
    .inputSchema(signOutSchema)
    .action(async () => {
        const supabase = await createClient()

        const { error } = await supabase.auth.signOut()

        if (error) {
            throw new Error(error.message)
        }

        redirect('/')
    })


export const getCurrentUser = authenticatedAction
    .inputSchema(z.object({}))
    .action(async () => {
        const supabase = await createClient()

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            throw new Error(error.message)
        }

        if (!user) {
            throw new Error('Uživatel nebyl nalezen')
        }

        // Načtení profilu uživatele
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        return { user, profile }
    })