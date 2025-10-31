import { z } from 'zod';

export const documentMetadataSchema = z.object({
  size: z.number().optional(),
  mimetype: z.string().optional(),
  lastModified: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(['draft', 'review', 'approved', 'archived']).optional(),
}).catchall(z.any());

export const searchDocumentsSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  folder: z.string().optional().default('documents'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const searchByMetadataSchema = z.object({
  metadata: documentMetadataSchema.partial(),
  folder: z.string().optional().default('documents'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const getRecentDocumentsSchema = z.object({
  days: z.number().min(1).max(365).optional().default(7),
  limit: z.number().min(1).max(100).optional().default(10),
});

export const advancedSearchSchema = z.object({
  query: z.string().optional(),
  fileType: z.string().optional(),
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'approved', 'archived']).optional(),
  folder: z.string().optional().default('documents'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// Types
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>;
export type SearchByMetadataInput = z.infer<typeof searchByMetadataSchema>;
export type GetRecentDocumentsInput = z.infer<typeof getRecentDocumentsSchema>;
export type AdvancedSearchInput = z.infer<typeof advancedSearchSchema>;

export type SearchResult = {
  id: string;
  name: string;
  originalName: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: DocumentMetadata;
  size: number;
  publicUrl: string;
  relevance?: number;
};