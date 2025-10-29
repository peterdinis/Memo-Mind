"use server"

import { action, authenticatedAction } from "@/lib/next-safe-action"
import { 
  signInSchema, 
  signOutSchema, 
  signUpSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  verifyEmailSchema,
  updateProfileSchema
} from "@/schemas/authSchemas"
import { createClient } from "@/supabase/server"
import { InsertTables, UpdateTables } from "@/types/supabase"
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

    // User registration with email confirmation
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
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
        throw new Error('Failed to create user profile')
      }
    }

    return { 
      success: true, 
      user: data.user,
      needsEmailVerification: !data.session // If no session, email needs verification
    }
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
            throw new Error('User not found')
        }

        // Load user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        return { user, profile }
    })

// Email verification action
export const verifyEmailAction = action
    .inputSchema(verifyEmailSchema)
    .action(async () => {
        const supabase = await createClient()

        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: '', // Will use current user's email
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          }
        })

        if (error) {
            throw new Error(error.message)
        }

        return { success: true, message: 'Verification email sent' }
    })

// Forgot password action
export const forgotPasswordAction = action
    .inputSchema(forgotPasswordSchema)
    .action(async ({ parsedInput: { email } }) => {
        const supabase = await createClient()

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
        })

        if (error) {
            throw new Error(error.message)
        }

        return { success: true, message: 'Password reset instructions sent to your email' }
    })

// Reset password action
export const resetPasswordAction = action
    .inputSchema(resetPasswordSchema)
    .action(async ({ parsedInput: { password } }) => {
        const supabase = await createClient()

        const { error } = await supabase.auth.updateUser({
          password: password
        })

        if (error) {
            throw new Error(error.message)
        }

        return { success: true, message: 'Password updated successfully' }
    })

// Update profile action
export const updateProfileAction = authenticatedAction
    .inputSchema(updateProfileSchema)
    .action(async ({ parsedInput: { fullName } }) => {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            throw new Error('User not found')
        }

        const profileData: UpdateTables<'profiles'> = {
          full_name: fullName,
          updated_at: new Date().toISOString(),
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', user.id)

        if (profileError) {
            throw new Error(profileError.message)
        }

        return { success: true, message: 'Profile updated successfully' }
    })

// Check email verification status
export const checkEmailVerificationAction = authenticatedAction
    .inputSchema(z.object({}))
    .action(async () => {
        const supabase = await createClient()

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            throw new Error(error.message)
        }

        if (!user) {
            throw new Error('User not found')
        }

        return { 
            isEmailConfirmed: user.email_confirmed_at !== null,
            email: user.email
        }
    })