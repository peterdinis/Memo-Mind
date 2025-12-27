'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import {
    searchDocumentsSchema,
    searchByMetadataSchema,
    getRecentDocumentsSchema,
    advancedSearchSchema,
    type DocumentMetadata,
    type SearchResult,
} from '@/schemas/searchSchemas';
import { createClient } from '@/supabase/server';

// Helper function to validate and parse metadata
const parseDocumentMetadata = (metadata: unknown): DocumentMetadata => {
    if (typeof metadata !== 'object' || metadata === null) {
        return {};
    }

    const safeMetadata: DocumentMetadata = {};
    const rawMetadata = metadata as Record<string, unknown>;

    if (typeof rawMetadata.size === 'number') {
        safeMetadata.size = rawMetadata.size;
    }

    if (typeof rawMetadata.mimetype === 'string') {
        safeMetadata.mimetype = rawMetadata.mimetype;
    }

    if (typeof rawMetadata.lastModified === 'string') {
        safeMetadata.lastModified = rawMetadata.lastModified;
    }

    if (typeof rawMetadata.category === 'string') {
        safeMetadata.category = rawMetadata.category;
    }

    if (
        Array.isArray(rawMetadata.tags) &&
        rawMetadata.tags.every((tag) => typeof tag === 'string')
    ) {
        safeMetadata.tags = rawMetadata.tags;
    }

    if (typeof rawMetadata.description === 'string') {
        safeMetadata.description = rawMetadata.description;
    }

    if (typeof rawMetadata.author === 'string') {
        safeMetadata.author = rawMetadata.author;
    }

    if (
        typeof rawMetadata.status === 'string' &&
        ['draft', 'review', 'approved', 'archived'].includes(rawMetadata.status)
    ) {
        safeMetadata.status = rawMetadata.status as DocumentMetadata['status'];
    }

    return safeMetadata;
};

// Helper function to create search result
const createSearchResult = (
    file: {
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
        last_accessed_at: string;
        metadata: unknown;
    },
    userId: string,
    folder: string,
): SearchResult => ({
    id: file.id,
    name: file.name.replace(/^\d+_/, ''),
    originalName: file.name,
    created_at: file.created_at,
    updated_at: file.updated_at,
    last_accessed_at: file.last_accessed_at,
    metadata: parseDocumentMetadata(file.metadata),
    size: (() => {
        const parsedMetadata = parseDocumentMetadata(file.metadata);
        return typeof parsedMetadata.size === 'number'
            ? parsedMetadata.size
            : 0;
    })(),
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${userId}/${folder}/${file.name}`,
});

// Define types for Supabase file objects
interface SupabaseFile {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    last_accessed_at: string;
    metadata: unknown;
}

export const searchDocumentsAction = authenticatedAction
    .inputSchema(searchDocumentsSchema)
    .action(async ({ parsedInput: { query, folder, limit, offset } }) => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;
        const searchPath = `${userId}/${folder}`;

        const { data: files, error } = await supabase.storage
            .from('documents')
            .list(searchPath, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            if (error.message.includes('not found')) {
                return { results: [], total: 0 };
            }
            throw new Error(`Failed to search files: ${error.message}`);
        }

        const filteredFiles = ((files as SupabaseFile[]) || []).filter(
            (file) =>
                file.name.toLowerCase().includes(query.toLowerCase()) ||
                file.name
                    .replace(/^\d+_/, '')
                    .toLowerCase()
                    .includes(query.toLowerCase()),
        );

        const searchResults = filteredFiles
            .slice(offset, offset + limit)
            .map((file, index) => ({
                ...createSearchResult(file, userId, folder),
                relevance: 100 - index,
            }));

        return {
            results: searchResults,
            total: filteredFiles.length,
            query,
            hasMore: filteredFiles.length > offset + limit,
        };
    });

export const searchByMetadataAction = authenticatedAction
    .inputSchema(searchByMetadataSchema)
    .action(async ({ parsedInput: { metadata, folder, limit, offset } }) => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;
        const searchPath = `${userId}/${folder}`;

        const { data: files, error } = await supabase.storage
            .from('documents')
            .list(searchPath, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            if (error.message.includes('not found')) {
                return { results: [], total: 0 };
            }
            throw new Error(
                `Failed to search files by metadata: ${error.message}`,
            );
        }

        const filteredFiles = ((files as SupabaseFile[]) || []).filter(
            (file) => {
                const fileMetadata = parseDocumentMetadata(file.metadata);

                return Object.entries(metadata).every(([key, value]) => {
                    const fileValue =
                        fileMetadata[key as keyof DocumentMetadata];

                    if (value === undefined || value === null) return true;
                    if (fileValue === undefined || fileValue === null)
                        return false;

                    // String search (case-insensitive)
                    if (
                        typeof value === 'string' &&
                        typeof fileValue === 'string'
                    ) {
                        return fileValue
                            .toLowerCase()
                            .includes(value.toLowerCase());
                    }

                    // Array search (for tags)
                    if (Array.isArray(value) && Array.isArray(fileValue)) {
                        return value.every((v) =>
                            fileValue.some(
                                (fv) =>
                                    typeof fv === 'string' &&
                                    fv.toLowerCase().includes(v.toLowerCase()),
                            ),
                        );
                    }

                    // Exact match for other types
                    return fileValue === value;
                });
            },
        );

        const searchResults = filteredFiles
            .slice(offset, offset + limit)
            .map((file) => createSearchResult(file, userId, folder));

        return {
            results: searchResults,
            total: filteredFiles.length,
            metadata,
            hasMore: filteredFiles.length > offset + limit,
        };
    });

export const getRecentDocumentsAction = authenticatedAction
    .inputSchema(getRecentDocumentsSchema)
    .action(async ({ parsedInput: { days, limit } }) => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { data: files, error } = await supabase.storage
            .from('documents')
            .list(`${userId}/documents`, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            if (error.message.includes('not found')) {
                return { results: [] };
            }
            throw new Error(
                `Failed to fetch recent documents: ${error.message}`,
            );
        }

        const recentFiles = ((files as SupabaseFile[]) || [])
            .filter((file) => {
                const fileDate = new Date(file.created_at);
                return fileDate >= cutoffDate;
            })
            .slice(0, limit)
            .map((file) => createSearchResult(file, userId, 'documents'));

        return {
            results: recentFiles,
            total: recentFiles.length,
            days,
        };
    });

export const advancedSearchAction = authenticatedAction
    .inputSchema(advancedSearchSchema)
    .action(async ({ parsedInput: filters }) => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;
        const searchPath = `${userId}/${filters.folder}`;

        const { data: files, error } = await supabase.storage
            .from('documents')
            .list(searchPath, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            if (error.message.includes('not found')) {
                return { results: [], total: 0 };
            }
            throw new Error(
                `Failed to perform advanced search: ${error.message}`,
            );
        }

        const filteredFiles = ((files as SupabaseFile[]) || []).filter(
            (file) => {
                const fileMetadata = parseDocumentMetadata(file.metadata);
                const fileName = file.name.toLowerCase();
                const fileDisplayName = file.name
                    .replace(/^\d+_/, '')
                    .toLowerCase();
                const fileDate = new Date(file.created_at);
                const fileSize = fileMetadata.size || 0;

                // Filter by search query
                if (
                    filters.query &&
                    !fileName.includes(filters.query.toLowerCase()) &&
                    !fileDisplayName.includes(filters.query.toLowerCase())
                ) {
                    return false;
                }

                // Filter by file type
                if (filters.fileType) {
                    const fileExtension = file.name
                        .split('.')
                        .pop()
                        ?.toLowerCase();
                    if (fileExtension !== filters.fileType.toLowerCase()) {
                        return false;
                    }
                }

                // Filter by size range
                if (filters.minSize && fileSize < filters.minSize) {
                    return false;
                }
                if (filters.maxSize && fileSize > filters.maxSize) {
                    return false;
                }

                // Filter by date range
                if (
                    filters.startDate &&
                    fileDate < new Date(filters.startDate)
                ) {
                    return false;
                }
                if (filters.endDate && fileDate > new Date(filters.endDate)) {
                    return false;
                }

                // Filter by category
                if (
                    filters.category &&
                    fileMetadata.category !== filters.category
                ) {
                    return false;
                }

                // Filter by tags
                if (filters.tags && filters.tags.length > 0) {
                    if (
                        !fileMetadata.tags ||
                        !Array.isArray(fileMetadata.tags)
                    ) {
                        return false;
                    }
                    const hasAllTags = filters.tags.every((tag) =>
                        fileMetadata.tags!.some((fileTag) =>
                            fileTag.toLowerCase().includes(tag.toLowerCase()),
                        ),
                    );
                    if (!hasAllTags) {
                        return false;
                    }
                }

                // Filter by status
                if (filters.status && fileMetadata.status !== filters.status) {
                    return false;
                }

                return true;
            },
        );

        const searchResults = filteredFiles
            .slice(filters.offset, filters.offset + filters.limit)
            .map((file) => createSearchResult(file, userId, filters.folder));

        return {
            results: searchResults,
            total: filteredFiles.length,
            filters,
            hasMore: filteredFiles.length > filters.offset + filters.limit,
        };
    });
