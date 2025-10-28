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
import { usePathname } from 'next/navigation';
import { User, Settings, LogOut, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardNavbar() {
    const pathname = usePathname();

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

                {/* Profilový dropdown */}
                <div className='flex items-center gap-4'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='ghost'
                                className='relative h-8 w-8 rounded-full'
                            >
                                <Avatar className='h-8 w-8'>
                                    <AvatarImage
                                        src='/avatars/user.jpg'
                                        alt='Profil'
                                    />
                                    <AvatarFallback className='bg-primary text-primary-foreground'>
                                        JN
                                    </AvatarFallback>
                                </Avatar>
                                <span className='sr-only'>
                                    Otvoriť profilové menu
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
                                        Ján Novák
                                    </p>
                                    <p className='text-muted-foreground text-xs leading-none'>
                                        jan.novak@example.com
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className='mr-2 h-4 w-4' />
                                <span>Profil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CreditCard className='mr-2 h-4 w-4' />
                                <span>Fakturácia</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className='mr-2 h-4 w-4' />
                                <span>Nastavenia</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className='text-destructive focus:text-destructive'>
                                <LogOut className='mr-2 h-4 w-4' />
                                <span>Odhlásiť sa</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
