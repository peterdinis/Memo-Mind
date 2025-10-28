'use client';

import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TransitionProviderProps {
    children: ReactNode;
}

export const TransitionProvider: React.FC<TransitionProviderProps> = ({
    children,
}) => {
    return (
        <AnimatePresence mode='wait' initial={false}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className='h-full w-full'
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};
