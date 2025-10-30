import type { Metadata } from 'next';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardProvider } from '@/components/providers/dashboard-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TransitionProvider } from '@/components/providers/TransitionProvider';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
    title: 'Dashboard - MemoMind',
    description: 'Manage your documents and chat with AI',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardProvider>
            <SidebarProvider>
                <div className='bg-background flex h-screen w-full'>
                    <div className='shrink-0'>
                        <DashboardSidebar />
                    </div>

                    <main className='flex min-h-0 flex-1 flex-col overflow-auto'>
                        <TransitionProvider>
                            {children}
                            <Toaster />
                            <ScrollToTop />
                        </TransitionProvider>
                    </main>
                </div>
            </SidebarProvider>
        </DashboardProvider>
    );
}
