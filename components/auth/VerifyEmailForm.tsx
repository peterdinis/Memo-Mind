'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { verifyEmailAction } from '@/actions/authActions';
import AuthWrapper from './AuthWrapper';

export const VerifyEmailForm = () => {
    const { execute: verifyEmail, isExecuting: verifying } = useAction(
        verifyEmailAction,
        {
            onSuccess: (data) => {
                toast.success(data.data.message);
            },
            onError: (error) => {
                toast.error(error.error.serverError);
            },
        },
    );

    return (
        <AuthWrapper>
            <Card>
                <CardHeader>
                    <CardTitle>Verify Your Email</CardTitle>
                    <CardDescription>
                        Please verify your email address to access all features
                    </CardDescription>
                </CardHeader>
                <CardContent className='text-center'>
                    <p className='text-muted-foreground mb-4 text-sm'>
                        We've sent a verification link to your email address.
                        Click the link in the email to verify your account.
                    </p>
                    <Button
                        onClick={() => verifyEmail({})}
                        disabled={verifying}
                    >
                        {verifying ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                </CardContent>
            </Card>
        </AuthWrapper>
    );
};
