'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    FileText,
    MoreVertical,
    MessageSquare,
    Calendar,
    Download,
    Trash2,
    Share,
    Copy,
    CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import UploadCard from '../documents/UploadCard';

// Mock data
const mockDocuments = [
    {
        id: '1',
        title: 'Project Requirements Document',
        type: 'PDF',
        uploadedAt: '2024-01-15',
        size: '2.4 MB',
        status: 'processed' as const,
    },
    {
        id: '2',
        title: 'Research Paper Analysis',
        type: 'DOCX',
        uploadedAt: '2024-01-14',
        size: '1.8 MB',
        status: 'processing' as const,
    },
    {
        id: '3',
        title: 'Meeting Notes Q1',
        type: 'TXT',
        uploadedAt: '2024-01-13',
        size: '0.8 MB',
        status: 'processed' as const,
    },
];

const statusVariants = {
    processing:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    processed:
        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const ITEMS_PER_PAGE = 3;

type SortOption =
    | 'newest'
    | 'oldest'
    | 'name-asc'
    | 'name-desc'
    | 'size-asc'
    | 'size-desc';

export function DocumentGrid() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<
        (typeof mockDocuments)[0] | null
    >(null);
    const [copied, setCopied] = useState(false);

    // Sort documents based on selected option
    const sortedDocuments = [...mockDocuments].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return (
                    new Date(b.uploadedAt).getTime() -
                    new Date(a.uploadedAt).getTime()
                );
            case 'oldest':
                return (
                    new Date(a.uploadedAt).getTime() -
                    new Date(b.uploadedAt).getTime()
                );
            case 'name-asc':
                return a.title.localeCompare(b.title);
            case 'name-desc':
                return b.title.localeCompare(a.title);
            case 'size-asc':
                return parseFloat(a.size) - parseFloat(b.size);
            case 'size-desc':
                return parseFloat(b.size) - parseFloat(a.size);
            default:
                return 0;
        }
    });

    // Calculate pagination
    const totalPages = Math.ceil(sortedDocuments.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentDocuments = sortedDocuments.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSortChange = (value: SortOption) => {
        setSortBy(value);
        setCurrentPage(1);
    };

    const handleDeleteClick = (
        doc: (typeof mockDocuments)[0],
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        setSelectedDoc(doc);
        setDeleteDialogOpen(true);
    };

    const handleShareClick = (
        doc: (typeof mockDocuments)[0],
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        setSelectedDoc(doc);
        setShareDialogOpen(true);
    };

    const handleDownloadClick = (
        doc: (typeof mockDocuments)[0],
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        setSelectedDoc(doc);
        setDownloadDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedDoc) {
            console.log('Deleting document:', selectedDoc.title);
            // Here you would typically call an API to delete the document
        }
        setDeleteDialogOpen(false);
        setSelectedDoc(null);
    };

    const handleShareConfirm = () => {
        if (selectedDoc) {
            const shareUrl = `${window.location.origin}/share/${selectedDoc.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
        setShareDialogOpen(false);
    };

    const handleDownloadConfirm = () => {
        if (selectedDoc) {
            console.log('Downloading document:', selectedDoc.title);
            // Here you would typically trigger the download
            // For demo purposes, we'll create a mock download
            const link = document.createElement('a');
            link.href = '#';
            link.download = `${selectedDoc.title}.${selectedDoc.type.toLowerCase()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setDownloadDialogOpen(false);
        setSelectedDoc(null);
    };

    const copyShareLink = () => {
        if (selectedDoc) {
            const shareUrl = `${window.location.origin}/share/${selectedDoc.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const renderPaginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => handlePageChange(i)}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>,
                );
            }
        } else {
            let startPage = Math.max(1, currentPage - 1);
            let endPage = Math.min(totalPages, currentPage + 1);

            if (currentPage <= 2) {
                endPage = 3;
            } else if (currentPage >= totalPages - 1) {
                startPage = totalPages - 2;
            }

            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        isActive={currentPage === 1}
                        onClick={() => handlePageChange(1)}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>,
            );

            if (startPage > 2) {
                items.push(
                    <PaginationItem key='ellipsis-start'>
                        <PaginationEllipsis />
                    </PaginationItem>,
                );
            }

            for (let i = startPage; i <= endPage; i++) {
                if (i > 1 && i < totalPages) {
                    items.push(
                        <PaginationItem key={i}>
                            <PaginationLink
                                isActive={currentPage === i}
                                onClick={() => handlePageChange(i)}
                            >
                                {i}
                            </PaginationLink>
                        </PaginationItem>,
                    );
                }
            }

            if (endPage < totalPages - 1) {
                items.push(
                    <PaginationItem key='ellipsis-end'>
                        <PaginationEllipsis />
                    </PaginationItem>,
                );
            }

            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        isActive={currentPage === totalPages}
                        onClick={() => handlePageChange(totalPages)}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        return items;
    };

    return (
        <div className='min-h-screen'>
            {/* Documents Grid */}
            <div>
                <div className='mb-6 flex items-center justify-between'>
                    <h2 className='text-2xl font-bold'>Your Documents</h2>
                    <div className='flex gap-2'>
                        <Select value={sortBy} onValueChange={handleSortChange}>
                            <SelectTrigger className='w-[180px]'>
                                <SelectValue placeholder='Sort by...' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='newest'>
                                    Newest first
                                </SelectItem>
                                <SelectItem value='oldest'>
                                    Oldest first
                                </SelectItem>
                                <SelectItem value='name-asc'>
                                    Name A-Z
                                </SelectItem>
                                <SelectItem value='name-desc'>
                                    Name Z-A
                                </SelectItem>
                                <SelectItem value='size-asc'>
                                    Size: Small to Large
                                </SelectItem>
                                <SelectItem value='size-desc'>
                                    Size: Large to Small
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant='outline' size='sm'>
                            Filter
                        </Button>
                    </div>
                </div>

                <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    {/* Upload New Card */}
                    <UploadCard />

                    {/* Document Cards */}
                    {currentDocuments.map((doc) => (
                        <Card
                            key={doc.id}
                            className='group hover:border-primary/20 flex h-full min-h-[280px] cursor-pointer flex-col border-2 border-transparent transition-all duration-200 hover:shadow-lg'
                            onClick={() =>
                                router.push(`/dashboard/documents/${doc.id}`)
                            }
                        >
                            <CardHeader className='flex-1 pb-3'>
                                <div className='flex items-start justify-between'>
                                    <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20'>
                                        <FileText className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100'
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <MoreVertical className='h-4 w-4' />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='end'>
                                            <DropdownMenuItem
                                                onClick={(e) =>
                                                    handleDownloadClick(doc, e)
                                                }
                                            >
                                                <Download className='mr-2 h-4 w-4' />
                                                Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) =>
                                                    handleShareClick(doc, e)
                                                }
                                            >
                                                <Share className='mr-2 h-4 w-4' />
                                                Share
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className='text-red-600 focus:text-red-600'
                                                onClick={(e) =>
                                                    handleDeleteClick(doc, e)
                                                }
                                            >
                                                <Trash2 className='mr-2 h-4 w-4' />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className='mt-4 line-clamp-3 text-lg leading-tight font-semibold'>
                                    {doc.title}
                                </CardTitle>
                                <div className='mt-4 flex items-center justify-between'>
                                    <Badge
                                        variant='secondary'
                                        className='text-xs'
                                    >
                                        {doc.type}
                                    </Badge>
                                    <Badge
                                        className={`text-xs ${statusVariants[doc.status]}`}
                                        variant='outline'
                                    >
                                        {doc.status === 'processing'
                                            ? 'Processing...'
                                            : doc.status === 'error'
                                              ? 'Error'
                                              : 'Ready'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className='pt-0'>
                                <div className='mb-4 space-y-3 text-sm'>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-muted-foreground'>
                                            Size
                                        </span>
                                        <span className='font-medium'>
                                            {doc.size}
                                        </span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-muted-foreground'>
                                            Uploaded
                                        </span>
                                        <div className='flex items-center gap-1'>
                                            <Calendar className='h-3 w-3' />
                                            <span>{doc.uploadedAt}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className='w-full gap-2'
                                    variant='default'
                                    size='sm'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                            `/dashboard/chat/${doc.id}`,
                                        );
                                    }}
                                    disabled={
                                        doc.status === 'processing' ||
                                        doc.status === 'error'
                                    }
                                >
                                    <MessageSquare className='h-4 w-4' />
                                    Chat with AI
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className='flex justify-center'>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            handlePageChange(
                                                Math.max(1, currentPage - 1),
                                            )
                                        }
                                        className={
                                            currentPage === 1
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                        }
                                    />
                                </PaginationItem>

                                {renderPaginationItems()}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() =>
                                            handlePageChange(
                                                Math.min(
                                                    totalPages,
                                                    currentPage + 1,
                                                ),
                                            )
                                        }
                                        className={
                                            currentPage === totalPages
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "
                            {selectedDoc?.title}"? This action cannot be undone
                            and the document will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className='bg-red-600 text-white hover:bg-red-700'
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Share Dialog */}
            <AlertDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Share Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Share "{selectedDoc?.title}" with others. Anyone
                            with the link will be able to view this document.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className='flex items-center space-x-2'>
                        <div className='grid flex-1 gap-2'>
                            <div className='flex items-center space-x-2'>
                                <div className='bg-muted flex-1 overflow-hidden rounded-md border px-3 py-2 text-sm'>
                                    <span className='truncate'>
                                        {selectedDoc
                                            ? `${window.location.origin}/share/${selectedDoc.id}`
                                            : ''}
                                    </span>
                                </div>
                                <Button
                                    size='sm'
                                    className='px-3'
                                    onClick={copyShareLink}
                                >
                                    {copied ? (
                                        <CheckCircle2 className='h-4 w-4' />
                                    ) : (
                                        <Copy className='h-4 w-4' />
                                    )}
                                    <span className='sr-only'>Copy</span>
                                </Button>
                            </div>
                            {copied && (
                                <p className='text-xs text-green-600'>
                                    Link copied to clipboard!
                                </p>
                            )}
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Download Confirmation Dialog */}
            <AlertDialog
                open={downloadDialogOpen}
                onOpenChange={setDownloadDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Download Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to download "
                            {selectedDoc?.title}"? The file will be saved to
                            your device.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDownloadConfirm}>
                            Download
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
