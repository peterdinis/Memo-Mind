'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '../shared/ModeToggle';
import { useAuth } from '@/hooks/auth/useAuth';
import type { SearchResult } from '@/schemas/searchSchemas';
import { SearchDialog } from '../search/SearchDialog';

export function DashboardNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, signOut } = useAuth();

    const getBreadcrumbItems = () => {
        const paths = pathname.split('/').filter((path) => path);
        if (paths[0] === 'dashboard') paths[0] = 'Dashboard';

        return paths.map((path, index) => {
            const href = '/' + paths.slice(0, index + 1).join('/');
            const isLast = index === paths.length - 1;
            const formattedName = path.charAt(0).toUpperCase() + path.slice(1);

            return {
                name: formattedName,
                href: isLast ? undefined : href,
                isLast,
            };
        });
    };

    const breadcrumbItems = getBreadcrumbItems();

    const getInitials = () => {
        if (profile?.full_name) {
            return profile.full_name
                .split(' ')
                .map((name: string) => name[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        if (user?.email) {
            return user.email.slice(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Funkcia pre získanie zobrazovaného mena
    const getDisplayName = () => {
        if (profile?.full_name) {
            return profile.full_name;
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return 'User';
    };

    const getDisplayEmail = () => {
        return user?.email || 'No email';
    };

    const handleLogout = async () => {
        signOut({});
    };

    const handleDocumentSelect = (document: SearchResult) => {
        window.open(document.publicUrl, '_blank');
    };

    const getCurrentFolder = () => {
        if (pathname.includes('/documents')) {
            return 'documents';
        }
        if (pathname.includes('/images')) {
            return 'images';
        }
        if (pathname.includes('/archives')) {
            return 'archives';
        }
        return 'documents'; // default
    };

    return (
        <header className='bg-background/95 border-border sticky top-0 z-30 border-b backdrop-blur-sm'>
            <div className='flex items-center justify-between p-4'>
                <div className='flex items-center gap-4'>
                    <SidebarTrigger className='h-9 w-9' />

                    {breadcrumbItems.length > 0 && (
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbItems.map((item, index) => (
                                    <div
                                        key={item.name}
                                        className='flex items-center'
                                    >
                                        {index > 0 && <BreadcrumbSeparator />}
                                        <BreadcrumbItem>
                                            {item.isLast ? (
                                                <BreadcrumbPage className='text-lg font-semibold'>
                                                    {item.name}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink
                                                    href={item.href}
                                                    className='text-lg'
                                                >
                                                    {item.name}
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </div>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    )}
                </div>

                <div className='flex items-center gap-4'>
                    <SearchDialog
                        onSelect={handleDocumentSelect}
                        placeholder='Hľadať dokumenty...'
                        folder={getCurrentFolder()}
                    />

                    <ModeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='ghost'
                                className='relative h-8 w-8 rounded-full'
                            >
                                <Avatar className='h-8 w-8'>
                                    <AvatarImage
                                        src={profile?.avatar_url}
                                        alt='Profile'
                                    />
                                    <AvatarFallback className='bg-primary text-primary-foreground'>
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className='sr-only'>
                                    Open profile menu
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className='w-56'
                            align='end'
                            forceMount
                        >
                            <DropdownMenuLabel className='font-normal'>
                                <div className='flex flex-col space-y-1'>
                                    <p className='text-sm leading-none font-medium'>
                                        {getDisplayName()}
                                    </p>
                                    <p className='text-muted-foreground text-xs leading-none'>
                                        {getDisplayEmail()}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className='text-destructive focus:text-destructive cursor-pointer'
                            >
                                <LogOut className='mr-2 h-4 w-4' />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
