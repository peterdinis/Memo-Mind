'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { BookOpen, Home, MessageSquare } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
    },
    {
        title: 'Chat',
        url: '/dashboard/chat',
        icon: MessageSquare,
    },
];

export function DashboardSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarHeader>
                <div className='flex items-center gap-2 px-2 py-4'>
                    <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-lg'>
                        <BookOpen className='h-4 w-4 text-white' />
                    </div>
                    <div className='flex flex-col'>
                        <span className='text-sm font-semibold'>MemoMind</span>
                        <span className='text-muted-foreground text-xs'>
                            AI Document Chat
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.url;

                                return (
                                    <SidebarMenuItem key={item.url}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                        >
                                            <div
                                                onClick={() =>
                                                    router.push(item.url)
                                                }
                                                className='cursor-pointer'
                                            >
                                                <Icon className='h-4 w-4' />
                                                <span>{item.title}</span>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
