'use client';

import { Sparkles, FileText, MessageSquare, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

const HomeHero: React.FC = () => {
    const router = useRouter();
    return (
        <main className='container mx-auto flex-1 px-6 py-20'>
            <div className='mx-auto max-w-4xl space-y-12 text-center'>
                <div className='space-y-6'>
                    <div className='bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium'>
                        <Sparkles className='h-4 w-4' />
                        AI-Powered Document Intelligence
                    </div>

                    <h1 className='text-6xl leading-tight font-bold md:text-7xl'>
                        Transform your documents into
                        <span className='from-primary via-accent to-primary mt-2 block bg-linear-to-r bg-clip-text text-transparent'>
                            intelligent conversations
                        </span>
                    </h1>

                    <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>
                        Upload any document and chat with an AI that understands
                        your content. Get instant insights, summaries, and
                        answers.
                    </p>
                </div>

                <div className='flex flex-col justify-center gap-4 sm:flex-row'>
                    <Button
                        size='lg'
                        onClick={() => router.push('/auth')}
                        className='from-primary to-accent shadow-glow bg-linear-to-r px-8 py-6 text-lg transition-opacity hover:opacity-90'
                    >
                        Get Started Free
                    </Button>
                    <Button
                        size='lg'
                        variant='outline'
                        className='border-border/50 px-8 py-6 text-lg'
                    >
                        Watch Demo
                    </Button>
                </div>

                <div className='mt-20 grid gap-6 md:grid-cols-3'>
                    <div className='bg-card/50 border-border/50 hover:shadow-glow space-y-3 rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300'>
                        <div className='from-primary/10 to-accent/10 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br'>
                            <FileText className='text-primary h-6 w-6' />
                        </div>
                        <h3 className='text-lg font-semibold'>
                            Upload Documents
                        </h3>
                        <p className='text-muted-foreground text-sm'>
                            Support for PDF, Word, text files, and more. Your
                            documents stay secure.
                        </p>
                    </div>

                    <div className='bg-card/50 border-border/50 hover:shadow-glow space-y-3 rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300'>
                        <div className='from-primary/10 to-accent/10 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br'>
                            <MessageSquare className='text-primary h-6 w-6' />
                        </div>
                        <h3 className='text-lg font-semibold'>Chat with AI</h3>
                        <p className='text-muted-foreground text-sm'>
                            Ask questions and get accurate answers based on your
                            document content.
                        </p>
                    </div>

                    <div className='bg-card/50 border-border/50 hover:shadow-glow space-y-3 rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300'>
                        <div className='from-primary/10 to-accent/10 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br'>
                            <Zap className='text-primary h-6 w-6' />
                        </div>
                        <h3 className='text-lg font-semibold'>
                            Instant Insights
                        </h3>
                        <p className='text-muted-foreground text-sm'>
                            Get summaries, key points, and deep analysis in
                            seconds.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default HomeHero;
