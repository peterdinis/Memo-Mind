'use client'

import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPasswordSchema } from '@/schemas/authSchemas'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { forgotPasswordAction } from '@/actions/authActions'

type FormData = z.infer<typeof forgotPasswordSchema>

export const ForgotPasswordForm = () => {
  const { execute: forgotPassword, isExecuting: loading } = useAction(forgotPasswordAction, {
    onSuccess: (data) => {
      toast.success("Email sent", {
        description: data.data.message
      })
    },
    onError: (error) => {
      toast.error(error.error.serverError)
    }
  })

  const form = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = (data: FormData) => {
    forgotPassword(data)
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          Enter your email to receive reset instructions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Field
            className="group/field"
            data-invalid={!!form.formState.errors.email}
          >
            <FieldLabel>Email</FieldLabel>
            <Input 
              placeholder="m@example.com" 
              {...form.register('email')}
              className={form.formState.errors.email ? "border-destructive" : ""}
            />
            {form.formState.errors.email && (
              <FieldError>{form.formState.errors.email.message}</FieldError>
            )}
          </Field>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}