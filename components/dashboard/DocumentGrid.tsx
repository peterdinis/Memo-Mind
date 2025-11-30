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
    Copy,
    CheckCircle2,
    RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import UploadCard from '../documents/UploadCard';
import { useAction } from 'next-safe-action/hooks';
import { getUserFilesAction, deleteFileAction } from '@/actions/uploadActions';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

const statusVariants = {
    processing:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    processed:
        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const ITEMS_PER_PAGE = 8;

type SortOption =
    | 'newest'
    | 'oldest'
    | 'name-asc'
    | 'name-desc'
    | 'size-asc'
    | 'size-desc';

interface Document {
    id: string;
    name: string;
    originalName: string;
    publicUrl: string;
    size: number;
    created_at: string;
    filePath?: string;
    type?: string;
    status?: 'processing' | 'processed' | 'error';
}

interface FileFromAPI {
    id: string;
    name: string;
    originalName: string;
    created_at: string;
    updated_at?: string;
    last_accessed_at?: string;
    metadata?: any;
    size: number;
    publicUrl?: string;
    filePath?: string;
    status?: string;
}

export function DocumentGrid() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [copied, setCopied] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);

    const { execute: fetchFiles, isPending: isLoading } = useAction(
        getUserFilesAction,
        {
            onSuccess: (result) => {
                if (result.data?.files) {
                    const transformedDocs = transformFilesData(
                        result.data.files,
                    );
                    setDocuments(transformedDocs);
                }
            },
            onError: (error) => {
                toast.error('Failed to load files');
                console.error('Error loading files:', error);
            },
        },
    );

    const { execute: deleteFile, isPending: isDeleting } = useAction(
        deleteFileAction,
        {
            onSuccess: (result) => {
                toast.success(
                    result.data?.message || 'File deleted successfully',
                );
                fetchFiles({});
            },
            onError: (error) => {
                toast.error('Failed to delete file');
            },
        },
    );

    const transformFilesData = (files: FileFromAPI[]): Document[] => {
        return files.map((file, index) => ({
            id: file.id || `file-${index}`,
            name: file.name,
            originalName: file.originalName || file.name,
            publicUrl: file.publicUrl || '',
            size: file.size || 0,
            created_at: file.created_at || new Date().toISOString(),
            filePath: file.filePath || file.metadata?.filePath || file.originalName || file.name,
            type: getFileType(file.name),
            status: getStatusFromAPI(file.status),
        }));
    };

    function getStatusFromAPI(status: string | undefined): 'processing' | 'processed' | 'error' {
        switch (status) {
            case 'processing':
            case 'uploading':
                return 'processing';
            case 'processed':
            case 'completed':
                return 'processed';
            case 'error':
            case 'failed':
                return 'error';
            default:
                return 'processed';
        }
    }

    useEffect(() => {
        fetchFiles({});
    }, [fetchFiles]);

    function getFileType(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return 'PDF';
            case 'docx':
                return 'DOCX';
            case 'txt':
                return 'TXT';
            case 'doc':
                return 'DOC';
            default:
                return extension?.toUpperCase() || 'FILE';
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    const handleChatClick = (doc: Document, e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/dashboard/chat/${doc.id}`);
    };

    const handleDocumentClick = (doc: Document) => {
        router.push(`/dashboard/chat/${doc.id}`);
    };

    const handleQuickDownload = (doc: Document, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!doc.publicUrl) {
            toast.error('Download URL not available');
            return;
        }

        const link = document.createElement('a');
        link.href = doc.publicUrl;
        link.download = doc.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Downloading ${doc.name}`);
    };

    const handleQuickShare = (doc: Document, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!doc.publicUrl) {
            toast.error('Share URL not available');
            return;
        }

        navigator.clipboard.writeText(doc.publicUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Link copied to clipboard');
        });
    };

    const sortedDocuments = [...documents].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return (
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                );
            case 'oldest':
                return (
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'size-asc':
                return a.size - b.size;
            case 'size-desc':
                return b.size - a.size;
            default:
                return 0;
        }
    });

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

    const handleDeleteClick = (doc: Document, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDoc(doc);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedDoc) {
            deleteFile({ 
                documentId: selectedDoc.id,
                filePath: selectedDoc.filePath as unknown as string 
            });
        }
        setDeleteDialogOpen(false);
        setSelectedDoc(null);
    };

    const handleShareClick = (doc: Document, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDoc(doc);
        setShareDialogOpen(true);
    };

    const handleDownloadClick = (doc: Document, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDoc(doc);
        setDownloadDialogOpen(true);
    };

    const handleShareConfirm = () => {
        if (selectedDoc) {
            const shareUrl = selectedDoc.publicUrl;
            navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
        setShareDialogOpen(false);
    };

    const handleDownloadConfirm = () => {
        if (selectedDoc && selectedDoc.publicUrl) {
            const link = document.createElement('a');
            link.href = selectedDoc.publicUrl;
            link.download = selectedDoc.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Downloading ${selectedDoc.name}`);
        } else {
            toast.error('Download URL not available');
        }
        setDownloadDialogOpen(false);
        setSelectedDoc(null);
    };

    const copyShareLink = () => {
        if (selectedDoc && selectedDoc.publicUrl) {
            const shareUrl = selectedDoc.publicUrl;
            navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast.success('Link copied to clipboard');
            });
        } else {
            toast.error('Share URL not available');
        }
    };

    const handleRefresh = () => {
        fetchFiles({});
        toast.info('Refreshing files...');
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
            <div>
                <div className='mb-6 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <h2 className='text-2xl font-bold'>Your Documents</h2>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleRefresh}
                            disabled={isLoading}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                    </div>
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

                <Suspense
                    fallback={<Spinner variant={'default'} size={'lg'} />}
                >
                    {isLoading ? (
                        <Spinner variant={'default'} size={'lg'} />
                    ) : (
                        <>
                            <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                                <UploadCard />

                                {currentDocuments.map((doc) => (
                                    <Card
                                        key={doc.id}
                                        className='group hover:border-primary/20 flex h-full min-h-[280px] cursor-pointer flex-col border-2 border-transparent transition-all duration-200 hover:shadow-lg'
                                        onClick={() => handleDocumentClick(doc)}
                                    >
                                        <CardHeader className='flex-1 pb-3'>
                                            <div className='flex items-start justify-between'>
                                                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20'>
                                                    <FileText className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
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
                                                                handleQuickDownload(
                                                                    doc,
                                                                    e,
                                                                )
                                                            }
                                                        >
                                                            <Download className='mr-2 h-4 w-4' />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) =>
                                                                handleQuickShare(
                                                                    doc,
                                                                    e,
                                                                )
                                                            }
                                                        >
                                                            <Copy className='mr-2 h-4 w-4' />
                                                            {copied
                                                                ? 'Copied!'
                                                                : 'Share'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) =>
                                                                handleChatClick(
                                                                    doc,
                                                                    e,
                                                                )
                                                            }
                                                        >
                                                            <MessageSquare className='mr-2 h-4 w-4' />
                                                            Chat with AI
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className='text-red-600 focus:text-red-600'
                                                            onClick={(e) =>
                                                                handleDeleteClick(
                                                                    doc,
                                                                    e,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className='mr-2 h-4 w-4' />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <CardTitle className='mt-4 line-clamp-3 text-lg leading-tight font-semibold'>
                                                {doc.name}
                                            </CardTitle>
                                            <div className='mt-4 flex items-center justify-between'>
                                                <Badge
                                                    variant='secondary'
                                                    className='text-xs'
                                                >
                                                    {doc.type}
                                                </Badge>
                                                <Badge
                                                    className={`text-xs ${statusVariants[doc.status || 'processed']}`}
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
                                                        {formatFileSize(
                                                            doc.size,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className='flex items-center justify-between'>
                                                    <span className='text-muted-foreground'>
                                                        Uploaded
                                                    </span>
                                                    <div className='flex items-center gap-1'>
                                                        <Calendar className='h-3 w-3' />
                                                        <span>
                                                            {formatDate(
                                                                doc.created_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                className='w-full gap-2'
                                                variant='default'
                                                size='sm'
                                                onClick={(e) =>
                                                    handleChatClick(doc, e)
                                                }
                                            >
                                                <MessageSquare className='h-4 w-4' />
                                                Chat with AI
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {documents.length === 0 && (
                                <div className='py-12 text-center'>
                                    <FileText className='text-muted-foreground mx-auto mb-4 h-16 w-16' />
                                    <h3 className='mb-2 text-lg font-semibold'>
                                        No documents yet
                                    </h3>
                                    <p className='text-muted-foreground mb-6'>
                                        Upload your first document to get
                                        started
                                    </p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className='flex justify-center'>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() =>
                                                        handlePageChange(
                                                            Math.max(
                                                                1,
                                                                currentPage - 1,
                                                            ),
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
                                                        currentPage ===
                                                        totalPages
                                                            ? 'pointer-events-none opacity-50'
                                                            : 'cursor-pointer'
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Suspense>
            </div>

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedDoc?.name}
                            "? This action cannot be undone and the document
                            will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className='bg-red-600 text-white hover:bg-red-700'
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Spinner size='sm' className='mr-2' />
                            ) : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Share Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Share "{selectedDoc?.name}" with others. Anyone with
                            the link will be able to view this document.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className='flex items-center space-x-2'>
                        <div className='grid flex-1 gap-2'>
                            <div className='flex items-center space-x-2'>
                                <div className='bg-muted flex-1 overflow-hidden rounded-md border px-3 py-2 text-sm'>
                                    <span className='truncate'>
                                        {selectedDoc?.publicUrl || 'URL not available'}
                                    </span>
                                </div>
                                <Button
                                    size='sm'
                                    className='px-3'
                                    onClick={copyShareLink}
                                    disabled={!selectedDoc?.publicUrl}
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

            <AlertDialog
                open={downloadDialogOpen}
                onOpenChange={setDownloadDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Download Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to download "
                            {selectedDoc?.name}"? The file will be saved to your
                            device.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDownloadConfirm}
                            disabled={!selectedDoc?.publicUrl}
                        >
                            Download
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}