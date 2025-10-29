// components/search-dialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResult {
    id: string;
    title: string;
    description?: string;
    category?: string;
}

interface SearchDialogProps {
    data?: SearchResult[];
    onSearch?: (query: string) => SearchResult[] | Promise<SearchResult[]>;
    onSelect?: (item: SearchResult) => void;
    placeholder?: string;
}

export function SearchDialog({
    data = [],
    onSearch,
    onSelect,
    placeholder = 'Hľadať...',
}: SearchDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Otvorenie dialogu s klávesovou skratkou
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Vyhľadávanie
    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);

            try {
                if (onSearch) {
                    const searchResults = await onSearch(query);
                    setResults(searchResults);
                } else {
                    // Lokálne vyhľadávanie v dátach
                    const filtered = data.filter(
                        (item) =>
                            item.title
                                .toLowerCase()
                                .includes(query.toLowerCase()) ||
                            item.description
                                ?.toLowerCase()
                                .includes(query.toLowerCase()) ||
                            item.category
                                ?.toLowerCase()
                                .includes(query.toLowerCase()),
                    );
                    setResults(filtered);
                }
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [query, data, onSearch]);

    const handleSelect = (item: SearchResult) => {
        onSelect?.(item);
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setQuery('');
            setResults([]);
        }
    };

    return (
        <>
            {/* Search Button */}
            <Button variant='outline' onClick={() => setIsOpen(true)}>
                <Search className='h-4 w-4 xl:mr-2' />
            </Button>

            {/* Search Dialog */}
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-md'>
                    {/* Search Header */}
                    <div className='mt-7 flex items-center border-b px-4 py-3'>
                        <Search className='text-muted-foreground mr-2 h-4 w-4' />
                        <Input
                            placeholder={placeholder}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className='flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
                            autoFocus
                        />
                    </div>

                    {/* Search Results */}
                    <div className='max-h-[300px] overflow-y-auto'>
                        {isLoading ? (
                            <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
                                Vyhľadávam...
                            </div>
                        ) : results.length > 0 ? (
                            <div className='p-2'>
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        className='hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start rounded-lg p-3 text-left transition-colors'
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className='font-medium'>
                                            {item.title}
                                        </div>
                                        {item.description && (
                                            <div className='text-muted-foreground mt-1 text-sm'>
                                                {item.description}
                                            </div>
                                        )}
                                        {item.category && (
                                            <div className='text-muted-foreground mt-1 text-xs'>
                                                {item.category}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : query ? (
                            <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
                                Nenašli sa žiadne výsledky pre "{query}"
                            </div>
                        ) : (
                            <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
                                Zadajte hľadaný výraz...
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
