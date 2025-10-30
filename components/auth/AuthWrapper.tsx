"use client"

import { FC, ReactNode } from "react";

type AuthWrapperProps = {
    children?: ReactNode
}

const AuthWrapper: FC<AuthWrapperProps> = ({
    children
}: AuthWrapperProps) => {
    return (
        <section className="flex justify-center items-center mt-10">
            {children}
        </section>
    )
}

export default AuthWrapper