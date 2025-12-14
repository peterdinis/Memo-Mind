'use client';

import { createClient } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import {
    signInAction,
    signUpAction,
    signOutAction,
    verifyEmailAction,
    forgotPasswordAction,
    updateProfileAction,
} from '@/actions/authActions';

export const useAuth = () => {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<User | null>(null);

    // Server actions with hooks
    const { execute: signIn, isExecuting: signingIn } = useAction(
        signInAction,
        {
            onSuccess: (data) => {
                toast.success('Successfully signed in');
                router.push('/dashboard'); // Presmerovanie na dashboard po prihlásení
                router.refresh();
            },
            onError: (error) => {
                toast.error(error.error.serverError);
            },
        },
    );

    const { execute: signUp, isExecuting: signingUp } = useAction(
        signUpAction,
        {
            onSuccess: (data) => {
                if (data.data.needsEmailVerification) {
                    toast.success('Check your email', {
                        description: "We've sent you a verification link",
                    });
                    router.push('/sign-in'); // Presmerovanie na prihlásenie po registrácii
                } else {
                    toast.success('Account created successfully');
                    router.push('/dashboard'); // Ak nepotrebuje verifikáciu, presmeruj na dashboard
                }
                router.refresh();
            },
            onError: (error) => {
                toast.error(error.error.serverError);
            },
        },
    );

    const { execute: signOut } = useAction(signOutAction, {
        onSuccess: () => {
            setUser(null);
            setProfile(null);
            toast.success('You have been signed out');
            router.push('/sign-in'); // Presmerovanie na prihlásenie po odhlásení
            router.refresh();
        },
        onError: (error) => {
            toast.error(error.error.serverError);
        },
    });

    const { execute: verifyEmail, isExecuting: verifyingEmail } = useAction(
        verifyEmailAction,
        {
            onSuccess: (data) => {
                toast.success('Email sent', {
                    description: data.data.message,
                });
                router.push('/sign-in'); // Presmerovanie na prihlásenie po odoslaní verifikačného emailu
            },
            onError: (error) => {
                toast.error(error.error.serverError);
            },
        },
    );

    const { execute: forgotPassword, isExecuting: resettingPassword } =
        useAction(forgotPasswordAction, {
            onSuccess: (data) => {
                toast.success('Email sent', {
                    description: data.data.message,
                });
                router.push('/sign-in'); // Presmerovanie na prihlásenie po odoslaní emailu pre reset hesla
            },
            onError: (error) => {
                toast.error(error.error.serverError);
            },
        });

    const { execute: updateProfile, isExecuting: updatingProfile } = useAction(
        updateProfileAction,
        {
            onSuccess: (data) => {
                toast.success('Profile updated successfully');
                router.refresh();
                // Pre update profilu nemusí byť potrebné presmerovanie, alebo môžeš pridať podľa potreby
                // router.push('/profile'); // Napríklad presmerovanie späť na profil
            },
            onError: (error) => {
                toast.error(error.error.serverError);
            },
        },
    );

    // Realtime subscription for auth state changes
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);

            if (session?.user) {
                // Fetch user profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setProfile(profileData);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    return {
        user,
        profile,
        loading,
        signIn,
        signingIn,
        signUp,
        signingUp,
        signOut,
        verifyEmail,
        verifyingEmail,
        forgotPassword,
        resettingPassword,
        updateProfile,
        updatingProfile,
    };
};
