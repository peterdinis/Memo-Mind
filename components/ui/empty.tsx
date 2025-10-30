import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

function Empty({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot='empty'
            className={cn(
                'bg-muted/20 flex min-w-0 flex-1 flex-col items-center justify-center gap-8 rounded-xl border border-dashed p-12 text-center text-balance backdrop-blur-sm',
                className,
            )}
            {...props}
        />
    );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot='empty-header'
            className={cn(
                'flex max-w-2xl flex-col items-center gap-4 text-center',
                className,
            )}
            {...props}
        />
    );
}

const emptyMediaVariants = cva(
    'flex shrink-0 items-center justify-center mb-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 transition-all duration-300',
    {
        variants: {
            variant: {
                default: 'bg-transparent',
                icon: "bg-gradient-to-br from-primary/10 to-primary/5 text-foreground flex size-20 shrink-0 items-center justify-center rounded-2xl border [&_svg:not([class*='size-'])]:size-10",
                success:
                    "bg-gradient-to-br from-green-100 to-green-50 text-green-600 dark:from-green-900/20 dark:to-green-900/10 flex size-20 shrink-0 items-center justify-center rounded-2xl border border-green-200 dark:border-green-800 [&_svg:not([class*='size-'])]:size-10",
                warning:
                    "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 dark:from-amber-900/20 dark:to-amber-900/10 flex size-20 shrink-0 items-center justify-center rounded-2xl border border-amber-200 dark:border-amber-800 [&_svg:not([class*='size-'])]:size-10",
                error: "bg-gradient-to-br from-red-100 to-red-50 text-red-600 dark:from-red-900/20 dark:to-red-900/10 flex size-20 shrink-0 items-center justify-center rounded-2xl border border-red-200 dark:border-red-800 [&_svg:not([class*='size-'])]:size-10",
            },
            size: {
                sm: "size-16 [&_svg:not([class*='size-'])]:size-8",
                md: "size-20 [&_svg:not([class*='size-'])]:size-10",
                lg: "size-24 [&_svg:not([class*='size-'])]:size-12",
            },
        },
        defaultVariants: {
            variant: 'icon',
            size: 'md',
        },
    },
);

function EmptyMedia({
    className,
    variant = 'icon',
    size = 'md',
    ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
    return (
        <div
            data-slot='empty-icon'
            data-variant={variant}
            className={cn(emptyMediaVariants({ variant, size, className }))}
            {...props}
        />
    );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot='empty-title'
            className={cn(
                'text-foreground text-2xl font-bold tracking-tight',
                className,
            )}
            {...props}
        />
    );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
    return (
        <div
            data-slot='empty-description'
            className={cn(
                'text-muted-foreground [&>a:hover]:text-primary text-lg/relaxed [&>a]:font-medium [&>a]:underline [&>a]:underline-offset-4',
                className,
            )}
            {...props}
        />
    );
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot='empty-content'
            className={cn(
                'flex w-full max-w-lg min-w-0 flex-col items-center gap-6 text-lg text-balance',
                className,
            )}
            {...props}
        />
    );
}

function EmptyActions({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot='empty-actions'
            className={cn(
                'mt-2 flex flex-wrap items-center justify-center gap-4',
                className,
            )}
            {...props}
        />
    );
}

function EmptyFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot='empty-footer'
            className={cn('text-muted-foreground/80 mt-6 text-base', className)}
            {...props}
        />
    );
}

export {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
    EmptyMedia,
    EmptyActions,
    EmptyFooter,
};
