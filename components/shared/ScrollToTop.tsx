'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollToTopProps {
  threshold?: number;
  className?: string;
  showProgress?: boolean;
}

export function ScrollToTop({
  threshold = 300,
  className,
  showProgress = true,
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const calculateScrollProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      
      setScrollProgress(progress);
      
      if (scrollTop > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', calculateScrollProgress);

    return () => {
      window.removeEventListener('scroll', calculateScrollProgress);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out',
      isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-10 pointer-events-none',
      className
    )}>
      <div className="relative">
        {showProgress && (
          <div className="absolute -inset-2">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-border/30"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (scrollProgress * 251.2) / 100}
                className="text-primary transition-all duration-150"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
        <Button
          variant="default"
          size="icon"
          onClick={scrollToTop}
          className={cn(
            'h-12 w-12 rounded-full shadow-lg hover:shadow-xl relative',
            'bg-background border border-border',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-all duration-200'
          )}
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}