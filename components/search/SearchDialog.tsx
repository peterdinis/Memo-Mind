'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Search,
    FileText,
    Download,
    Calendar,
    File,
    Filter,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { advancedSearchAction } from '@/actions/searchActions';
import type {
    SearchResult,
    AdvancedSearchInput,
} from '@/schemas/searchSchemas';

interface SearchDialogProps {
    onSelect?: (document: SearchResult) => void;
    placeholder?: string;
    folder?: string;
}

type SearchFilter = {
    fileType?: string;
    minSize?: number;
    maxSize?: number;
    category?: string;
    tags?: string[];
};

export function SearchDialog({
    onSelect,
    placeholder = 'Pokročilé vyhľadávanie dokumentov...',
    folder = 'documents',
}: SearchDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilter>({});
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim() && Object.keys(filters).length === 0) {
                setResults([]);
                setSearchError(null);
                return;
            }

            setIsLoading(true);
            setSearchError(null);

            try {
                const searchParams: AdvancedSearchInput = {
                    query: query.trim() || undefined,
                    folder,
                    limit: 20,
                    offset: 0,
                    ...filters,
                };

                const searchResults = await advancedSearchAction(searchParams);
                setResults(searchResults.data?.results!);
            } catch (error) {
                console.error('Advanced search error:', error);
                setSearchError(
                    error instanceof Error
                        ? error.message
                        : 'Chyba pri pokročilom vyhľadávaní',
                );
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 400);
        return () => clearTimeout(timeoutId);
    }, [query, filters, folder]);

    const updateActiveFilters = (newFilters: SearchFilter) => {
        const active: string[] = [];
        if (newFilters.fileType) active.push(`Typ: ${newFilters.fileType}`);
        if (newFilters.category)
            active.push(`Kategória: ${newFilters.category}`);
        if (newFilters.minSize)
            active.push(`Min. veľkosť: ${formatFileSize(newFilters.minSize)}`);
        if (newFilters.maxSize)
            active.push(`Max. veľkosť: ${formatFileSize(newFilters.maxSize)}`);
        if (newFilters.tags && newFilters.tags.length > 0) {
            active.push(`Tagy: ${newFilters.tags.join(', ')}`);
        }
        setActiveFilters(active);
    };

    const handleFilterChange = (key: keyof SearchFilter, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        updateActiveFilters(newFilters);
    };

    const removeFilter = (filterToRemove: string) => {
        const newFilters = { ...filters };

        if (filterToRemove.startsWith('Typ:')) {
            delete newFilters.fileType;
        } else if (filterToRemove.startsWith('Kategória:')) {
            delete newFilters.category;
        } else if (filterToRemove.startsWith('Min. veľkosť:')) {
            delete newFilters.minSize;
        } else if (filterToRemove.startsWith('Max. veľkosť:')) {
            delete newFilters.maxSize;
        } else if (filterToRemove.startsWith('Tagy:')) {
            delete newFilters.tags;
        }

        setFilters(newFilters);
        updateActiveFilters(newFilters);
    };

    const clearAllFilters = () => {
        setFilters({});
        setActiveFilters([]);
    };

    const handleSelect = (document: SearchResult) => {
        onSelect?.(document);
        setIsOpen(false);
        setQuery('');
        setResults([]);
        setSearchError(null);
        setFilters({});
        setActiveFilters([]);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setQuery('');
            setResults([]);
            setSearchError(null);
            setFilters({});
            setActiveFilters([]);
            setShowFilters(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('sk-SK', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return <FileText className='h-4 w-4 text-red-500' />;
            case 'doc':
            case 'docx':
                return <FileText className='h-4 w-4 text-blue-500' />;
            case 'xls':
            case 'xlsx':
                return <FileText className='h-4 w-4 text-green-500' />;
            case 'txt':
                return <FileText className='h-4 w-4 text-gray-500' />;
            default:
                return <File className='h-4 w-4 text-gray-400' />;
        }
    };

    return (
        <>
            <Button
                variant='outline'
                onClick={() => setIsOpen(true)}
                className='relative'
            >
                <Search className='h-4 w-4 xl:mr-2' />
                <span className='hidden xl:inline'>Pokročilé vyhľadávanie</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-2xl'>
                    {/* Search Header */}
                    <div className='mt-7 flex items-center gap-2 border-b px-4 py-3'>
                        <Search className='text-muted-foreground h-4 w-4' />
                        <Input
                            placeholder={placeholder}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className='flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
                            autoFocus
                        />
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? 'bg-accent' : ''}
                        >
                            <Filter className='h-4 w-4' />
                        </Button>
                    </div>

                    {/* Active Filters */}
                    {activeFilters.length > 0 && (
                        <div className='border-b p-3'>
                            <div className='flex flex-wrap gap-2'>
                                {activeFilters.map((filter, index) => (
                                    <Badge
                                        key={index}
                                        variant='secondary'
                                        className='flex items-center gap-1'
                                    >
                                        {filter}
                                        <X
                                            className='h-3 w-3 cursor-pointer'
                                            onClick={() => removeFilter(filter)}
                                        />
                                    </Badge>
                                ))}
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={clearAllFilters}
                                    className='h-6 text-xs'
                                >
                                    Vymazať všetky
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className='border-b p-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='text-sm font-medium'>
                                        Typ súboru
                                    </label>
                                    <Input
                                        placeholder='pdf, docx, ...'
                                        value={filters.fileType || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'fileType',
                                                e.target.value,
                                            )
                                        }
                                        className='mt-1'
                                    />
                                </div>
                                <div>
                                    <label className='text-sm font-medium'>
                                        Kategória
                                    </label>
                                    <Input
                                        placeholder='faktúry, zmluvy, ...'
                                        value={filters.category || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'category',
                                                e.target.value,
                                            )
                                        }
                                        className='mt-1'
                                    />
                                </div>
                                <div>
                                    <label className='text-sm font-medium'>
                                        Min. veľkosť (B)
                                    </label>
                                    <Input
                                        type='number'
                                        placeholder='0'
                                        value={filters.minSize || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'minSize',
                                                e.target.value
                                                    ? parseInt(e.target.value)
                                                    : undefined,
                                            )
                                        }
                                        className='mt-1'
                                    />
                                </div>
                                <div>
                                    <label className='text-sm font-medium'>
                                        Max. veľkosť (B)
                                    </label>
                                    <Input
                                        type='number'
                                        placeholder='1000000'
                                        value={filters.maxSize || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'maxSize',
                                                e.target.value
                                                    ? parseInt(e.target.value)
                                                    : undefined,
                                            )
                                        }
                                        className='mt-1'
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    <div className='max-h-[400px] overflow-y-auto'>
                        {searchError ? (
                            <div className='text-destructive px-4 py-8 text-center text-sm'>
                                {searchError}
                            </div>
                        ) : isLoading ? (
                            <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
                                Vyhľadávam dokumenty...
                            </div>
                        ) : results.length > 0 ? (
                            <div className='p-2'>
                                <div className='text-muted-foreground mb-2 px-2 text-xs'>
                                    Nájdených {results.length} dokumentov
                                </div>
                                {results.map((document) => (
                                    <button
                                        key={document.id}
                                        className='hover:bg-accent hover:text-accent-foreground flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors'
                                        onClick={() => handleSelect(document)}
                                    >
                                        <div className='mt-0.5'>
                                            {getFileIcon(document.name)}
                                        </div>
                                        <div className='min-w-0 flex-1'>
                                            <div className='truncate font-medium'>
                                                {document.name}
                                            </div>
                                            <div className='text-muted-foreground mt-1 flex items-center gap-4 text-xs'>
                                                <span className='flex items-center gap-1'>
                                                    <Calendar className='h-3 w-3' />
                                                    {formatDate(
                                                        document.created_at,
                                                    )}
                                                </span>
                                                <span>
                                                    {formatFileSize(
                                                        document.size,
                                                    )}
                                                </span>
                                                {document.metadata.mimetype && (
                                                    <span className='text-muted-foreground capitalize'>
                                                        {
                                                            document.metadata.mimetype.split(
                                                                '/',
                                                            )[1]
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                            {document.metadata.description && (
                                                <div className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
                                                    {
                                                        document.metadata
                                                            .description
                                                    }
                                                </div>
                                            )}
                                            {document.metadata.category && (
                                                <div className='mt-1'>
                                                    <Badge
                                                        variant='outline'
                                                        className='text-xs'
                                                    >
                                                        {
                                                            document.metadata
                                                                .category
                                                        }
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                        <div className='flex flex-col items-end gap-1'>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-6 w-6'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(
                                                        document.publicUrl,
                                                        '_blank',
                                                    );
                                                }}
                                            >
                                                <Download className='h-3 w-3' />
                                            </Button>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query || activeFilters.length > 0 ? (
                            <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
                                Nenašli sa žiadne dokumenty pre zadané kritériá
                            </div>
                        ) : (
                            <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
                                Zadajte vyhľadávací výraz alebo použite
                                filtre...
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
