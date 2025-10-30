'use client';

import { FC, ReactNode } from 'react';

type AuthWrapperProps = {
    children?: ReactNode;
};

const AuthWrapper: FC<AuthWrapperProps> = ({ children }: AuthWrapperProps) => {
    return (
        <section className='mt-10 flex items-center justify-center'>
            {children}
        </section>
    );
};

export default AuthWrapper;
