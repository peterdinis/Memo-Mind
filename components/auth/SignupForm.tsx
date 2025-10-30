'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUpSchema } from '@/schemas/authSchemas';
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

type FormData = z.infer<typeof signUpSchema>;

export const SignUpForm = () => {
    const { signUp, signingUp } = useAuth();

    const form = useForm<FormData>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: '',
            password: '',
            fullName: '',
        },
    });

    const onSubmit = (data: FormData) => {
        signUp(data);
    };

    return (
        <AuthWrapper>
            <Card className='mx-auto max-w-sm'>
                <CardHeader>
                    <CardTitle className='text-2xl'>Sign Up</CardTitle>
                    <CardDescription>
                        Enter your information to create an account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className='space-y-6'
                    >
                        <Field
                            className='group/field'
                            data-invalid={!!form.formState.errors.fullName}
                        >
                            <FieldLabel>Full Name</FieldLabel>
                            <Input
                                placeholder='John Doe'
                                {...form.register('fullName')}
                                className={
                                    form.formState.errors.fullName
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {form.formState.errors.fullName && (
                                <FieldError>
                                    {form.formState.errors.fullName.message}
                                </FieldError>
                            )}
                        </Field>

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
                            <Input
                                type='password'
                                {...form.register('password')}
                                className={
                                    form.formState.errors.password
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {form.formState.errors.password && (
                                <FieldError>
                                    {form.formState.errors.password.message}
                                </FieldError>
                            )}
                        </Field>

                        <Button
                            type='submit'
                            className='w-full'
                            disabled={signingUp}
                        >
                            {signingUp
                                ? 'Creating account...'
                                : 'Create Account'}
                        </Button>
                    </form>
                    <div className='mt-4 text-center text-sm'>
                        Already have an account?{' '}
                        <Link href='/sign-in' className='underline'>
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </AuthWrapper>
    );
};
