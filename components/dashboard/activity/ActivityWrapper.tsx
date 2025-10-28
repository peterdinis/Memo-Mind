'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { FileText, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const ActivityWrapper: React.FC = () => {
    const [page, setPage] = useState(1);

    const activities = [
        {
            iconColor: 'bg-green-500',
            icon: <FileText className='h-4 w-4 text-white' />,
            title: 'Project Requirements.pdf',
            desc: 'Upload completed',
            time: '2 hours ago',
        },
        {
            iconColor: 'bg-blue-500',
            icon: <MessageSquare className='h-4 w-4 text-white' />,
            title: 'Chat session started',
            desc: 'With Research Paper Analysis',
            time: '5 hours ago',
        },
        {
            iconColor: 'bg-yellow-500',
            icon: <FileText className='h-4 w-4 text-white' />,
            title: 'Research Paper Analysis.docx',
            desc: 'Processing started',
            time: '1 day ago',
        },
        {
            iconColor: 'bg-purple-500',
            icon: <MessageSquare className='h-4 w-4 text-white' />,
            title: 'AI Summary generated',
            desc: 'Document summary completed',
            time: '2 days ago',
        },
        {
            iconColor: 'bg-red-500',
            icon: <FileText className='h-4 w-4 text-white' />,
            title: 'Old Report.pdf',
            desc: 'Deleted from storage',
            time: '3 days ago',
        },
        {
            iconColor: 'bg-red-500',
            icon: <FileText className='h-4 w-4 text-white' />,
            title: 'Old Report.pdf',
            desc: 'Deleted from storage',
            time: '3 days ago',
        },
        {
            iconColor: 'bg-red-500',
            icon: <FileText className='h-4 w-4 text-white' />,
            title: 'Old Report.pdf',
            desc: 'Deleted from storage',
            time: '3 days ago',
        },
        {
            iconColor: 'bg-red-500',
            icon: <FileText className='h-4 w-4 text-white' />,
            title: 'Old Report.pdf',
            desc: 'Deleted from storage',
            time: '3 days ago',
        },
    ];

    const itemsPerPage = 5;
    const totalPages = Math.ceil(activities.length / itemsPerPage);

    const paginatedActivities = activities.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
    };

    return (
        <>
            {/* Top Stats */}
            <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card className='border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-950/20 dark:to-blue-900/20'>
                    <CardContent className='p-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                                    Total Documents
                                </p>
                                <p className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
                                    24
                                </p>
                            </div>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-500'>
                                <FileText className='h-5 w-5 text-white' />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-green-200 bg-linear-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-950/20 dark:to-green-900/20'>
                    <CardContent className='p-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-green-600 dark:text-green-400'>
                                    Ready to Chat
                                </p>
                                <p className='text-2xl font-bold text-green-900 dark:text-green-100'>
                                    22
                                </p>
                            </div>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-500'>
                                <MessageSquare className='h-5 w-5 text-white' />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-yellow-200 bg-linear-to-br from-yellow-50 to-yellow-100 dark:border-yellow-800 dark:from-yellow-950/20 dark:to-yellow-900/20'>
                    <CardContent className='p-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-yellow-600 dark:text-yellow-400'>
                                    Processing
                                </p>
                                <p className='text-2xl font-bold text-yellow-900 dark:text-yellow-100'>
                                    2
                                </p>
                            </div>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500'>
                                <div className='h-2 w-2 animate-pulse rounded-full bg-white' />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-purple-200 bg-linear-to-br from-purple-50 to-purple-100 dark:border-purple-800 dark:from-purple-950/20 dark:to-purple-900/20'>
                    <CardContent className='p-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-purple-600 dark:text-purple-400'>
                                    Storage Used
                                </p>
                                <p className='text-2xl font-bold text-purple-900 dark:text-purple-100'>
                                    45.2 MB
                                </p>
                            </div>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-500'>
                                <FileText className='h-5 w-5 text-white' />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        {paginatedActivities.map((a, i) => (
                            <div
                                key={i}
                                className='bg-muted/50 flex items-center justify-between rounded-lg p-3'
                            >
                                <div className='flex items-center gap-3'>
                                    <div
                                        className={`h-8 w-8 rounded-full ${a.iconColor} flex items-center justify-center`}
                                    >
                                        {a.icon}
                                    </div>
                                    <div>
                                        <p className='font-medium'>{a.title}</p>
                                        <p className='text-muted-foreground text-sm'>
                                            {a.desc}
                                        </p>
                                    </div>
                                </div>
                                <span className='text-muted-foreground text-sm'>
                                    {a.time}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className='mt-6 flex justify-center'>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            handlePageChange(page - 1)
                                        }
                                        className={
                                            page === 1
                                                ? 'pointer-events-none opacity-50'
                                                : ''
                                        }
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }).map(
                                    (_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                onClick={() =>
                                                    handlePageChange(i + 1)
                                                }
                                                isActive={page === i + 1}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ),
                                )}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() =>
                                            handlePageChange(page + 1)
                                        }
                                        className={
                                            page === totalPages
                                                ? 'pointer-events-none opacity-50'
                                                : ''
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default ActivityWrapper;
