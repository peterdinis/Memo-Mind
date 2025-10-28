'use client';

import { BookOpen, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import React from 'react';
import { ModeToggle } from './ModeToggle';

const Navigation: React.FC = () => {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className='container mx-auto px-6 py-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='bg-primary flex h-10 w-10 items-center justify-center rounded-xl'>
                        <BookOpen className='h-6 w-6 text-white' />
                    </div>
                    <span className='text-2xl font-bold'>Memo Mind</span>
                </div>

                {/* Desktop Controls */}
                <div className='hidden items-center gap-3 md:flex'>
                    <Button
                        onClick={() => router.push('/auth')}
                        variant={'default'}
                        className='border-primary/20'
                    >
                        Sign In
                    </Button>
                    <ModeToggle />
                </div>

                {/* Mobile Controls */}
                <div className='flex items-center gap-3 md:hidden'>
                    <ModeToggle />
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={toggleMenu}
                        className='relative h-10 w-10 transition-all duration-300'
                    >
                        <div className='relative h-5 w-5'>
                            <Menu
                                className={`absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                                    isMenuOpen
                                        ? 'scale-0 rotate-90 opacity-0'
                                        : 'scale-100 rotate-0 opacity-100'
                                }`}
                            />
                            <X
                                className={`absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                                    isMenuOpen
                                        ? 'scale-100 rotate-0 opacity-100'
                                        : 'scale-0 -rotate-90 opacity-0'
                                }`}
                            />
                        </div>
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`bg-background/95 fixed inset-0 z-50 backdrop-blur-sm transition-all duration-300 ease-in-out md:hidden ${
                    isMenuOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
                onClick={() => setIsMenuOpen(false)}
            >
                <div
                    className={`bg-card border-border absolute top-20 right-6 w-48 transform rounded-lg border p-4 shadow-lg transition-all duration-300 ${
                        isMenuOpen
                            ? 'translate-y-0 scale-100 opacity-100'
                            : '-translate-y-4 scale-95 opacity-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className='flex flex-col space-y-3'>
                        <Button
                            onClick={() => {
                                router.push('/auth');
                                setIsMenuOpen(false);
                            }}
                            variant='outline'
                            className='border-primary/20 hover:bg-primary/5 w-full justify-center'
                        >
                            Sign In
                        </Button>

                        {/* Môžete pridať ďalšie navigačné položky tu */}
                        <Button
                            variant='ghost'
                            className='w-full justify-start'
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Features
                        </Button>
                        <Button
                            variant='ghost'
                            className='w-full justify-start'
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Pricing
                        </Button>
                        <Button
                            variant='ghost'
                            className='w-full justify-start'
                            onClick={() => setIsMenuOpen(false)}
                        >
                            About
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navigation;
