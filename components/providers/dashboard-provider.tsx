'use client';

import React from 'react';
import { SidebarProvider } from '../ui/sidebar';

interface DashboardContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
}

const DashboardContext = React.createContext<DashboardContextType | undefined>(
    undefined,
);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <DashboardContext.Provider
            value={{ isSidebarOpen, toggleSidebar, closeSidebar }}
        >
            <SidebarProvider>{children}</SidebarProvider>
        </DashboardContext.Provider>
    );
}

export const useDashboard = () => {
    const context = React.useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
