'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInSchema } from '@/schemas/authSchemas';
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
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type FormData = z.infer<typeof signInSchema>;

export const SignInForm = () => {
    const { signIn, signingIn } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = (data: FormData) => {
        signIn(data);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <AuthWrapper>
            <Card className='mx-auto max-w-sm'>
                <CardHeader>
                    <CardTitle className='text-2xl'>Sign In</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
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

                        <Field
                            className='group/field'
                            data-invalid={!!form.formState.errors.password}
                        >
                            <FieldLabel>Password</FieldLabel>
                            <div className='relative'>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    {...form.register('password')}
                                    className={
                                        form.formState.errors.password
                                            ? 'border-destructive pr-10'
                                            : 'pr-10'
                                    }
                                />
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? (
                                        <EyeOff className='h-4 w-4 text-muted-foreground' />
                                    ) : (
                                        <Eye className='h-4 w-4 text-muted-foreground' />
                                    )}
                                    <span className='sr-only'>
                                        {showPassword
                                            ? 'Hide password'
                                            : 'Show password'}
                                    </span>
                                </Button>
                            </div>
                            {form.formState.errors.password && (
                                <FieldError>
                                    {form.formState.errors.password.message}
                                </FieldError>
                            )}
                        </Field>

                        <Button
                            type='submit'
                            className='w-full'
                            disabled={signingIn}
                        >
                            {signingIn ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                    <div className='mt-4 text-center text-sm'>
                        Don&apos;t have an account?{' '}
                        <Link href='/sign-up' className='underline'>
                            Sign up
                        </Link>
                    </div>
                    <div className='mt-2 text-center text-sm'>
                        <Link
                            href='/forgot-password'
                            className='text-blue-600 underline'
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </AuthWrapper>
    );
};