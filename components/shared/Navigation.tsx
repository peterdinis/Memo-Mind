"use client"

import { BookOpen, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import React from "react";

const Navigation: React.FC = () => {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold">
                        Memo Mind
                    </span>
                </div>

                {/* Desktop Sign In Button */}
                <div className="hidden md:block">
                    <Button
                        onClick={() => router.push("/auth")}
                        variant="outline"
                        className="border-primary/20 hover:bg-primary/5"
                    >
                        Sign In
                    </Button>
                </div>

                {/* Mobile Hamburger Menu */}
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMenu}
                        className="relative h-10 w-10 transition-all duration-300"
                    >
                        <div className="relative h-5 w-5">
                            <Menu 
                                className={`absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                                    isMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                                }`}
                            />
                            <X 
                                className={`absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                                    isMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                                }`}
                            />
                        </div>
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div 
                className={`fixed inset-0 bg-background/95 backdrop-blur-sm z-50 md:hidden transition-all duration-300 ease-in-out ${
                    isMenuOpen 
                        ? 'opacity-100 pointer-events-auto' 
                        : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsMenuOpen(false)}
            >
                <div 
                    className={`absolute top-20 right-6 w-48 bg-card border border-border rounded-lg shadow-lg p-4 transition-all duration-300 transform ${
                        isMenuOpen 
                            ? 'opacity-100 translate-y-0 scale-100' 
                            : 'opacity-0 -translate-y-4 scale-95'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col space-y-3">
                        <Button
                            onClick={() => {
                                router.push("/auth");
                                setIsMenuOpen(false);
                            }}
                            variant="outline"
                            className="w-full justify-center border-primary/20 hover:bg-primary/5"
                        >
                            Sign In
                        </Button>
                        
                        {/* Môžete pridať ďalšie navigačné položky tu */}
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Features
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Pricing
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
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