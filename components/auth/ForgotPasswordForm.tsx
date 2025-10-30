'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPasswordSchema } from '@/schemas/authSchemas';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth/useAuth';
import AuthWrapper from './AuthWrapper';

type FormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm = () => {
    const { forgotPassword, resettingPassword } = useAuth();

    const form = useForm<FormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = (data: FormData) => {
        forgotPassword(data);
    };

    return (
        <AuthWrapper>
            <Card className='mx-auto max-w-sm'>
                <CardHeader>
                    <CardTitle className='text-2xl'>Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive reset instructions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className='space-y-6'
                    >
                        <Field
                            className='group/field'
                            data-invalid={!!form.formState.errors.email}
                        >
                            <FieldLabel>Email</FieldLabel>
                            <Input
                                placeholder='m@example.com'
                                {...form.register('email')}
                                className={
                                    form.formState.errors.email
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {form.formState.errors.email && (
                                <FieldError>
                                    {form.formState.errors.email.message}
                                </FieldError>
                            )}
                        </Field>

                        <Button
                            type='submit'
                            className='w-full'
                            disabled={resettingPassword}
                        >
                            {resettingPassword
                                ? 'Sending...'
                                : 'Send Reset Instructions'}
                        </Button>
                    </form>
                    <div className='mt-4 text-center text-sm'>
                        Remember your password?{' '}
                        <Link href='/sign-in' className='underline'>
                            Sign in
                        </Link>
                    </div>
                    <div className='mt-2 text-center text-sm'>
                        Don&apos;t have an account?{' '}
                        <Link href='/sign-up' className='underline'>
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </AuthWrapper>
    );
};
