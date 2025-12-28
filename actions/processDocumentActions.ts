'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import { createClient } from '@/supabase/server';
import { z } from 'zod';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { getPineconeIndex } from '@/lib/pinecone';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { TextLoader } from '@/lib/text-loader';

// Validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['pdf', 'docx', 'txt'];
const MIN_CONTENT_LENGTH = 10; // Minimum 10 characters
const PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Validate file type
function validateFileType(fileName: string): void {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!fileExtension || !ALLOWED_FILE_TYPES.includes(fileExtension)) {
        throw new Error(
            `Unsupported file type: ${fileExtension || 'unknown'}. Supported types: ${ALLOWED_FILE_TYPES.join(', ')}`,
        );
    }
}

// Validate file size
function validateFileSize(size: number): void {
    if (size > MAX_FILE_SIZE) {
        const sizeMB = (size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        throw new Error(
            `File is too large (${sizeMB}MB). Maximum file size is ${maxSizeMB}MB.`,
        );
    }

    if (size === 0) {
        throw new Error('File is empty. Please upload a file with content.');
    }
}

export const processDocumentAction = authenticatedAction
    .inputSchema(
        z.object({
            documentId: z.string().uuid('Invalid document ID'),
            filePath: z.string().min(1, 'File path is required'),
            fileName: z.string().min(1, 'File name is required'),
        }),
    )
    .action(async ({ parsedInput: { documentId, filePath, fileName } }) => {
        const supabase = await createClient();

        // Validate file type early
        validateFileType(fileName);

        try {
            // Update status to processing
            await supabase
                .from('processed_documents')
                .update({
                    status: 'processing',
                    metadata: {
                        processingStartedAt: new Date().toISOString(),
                    },
                })
                .eq('id', documentId);

            // 1. Download file from Supabase Storage
            const { data: fileData, error: downloadError } =
                await supabase.storage.from('documents').download(filePath);

            if (downloadError || !fileData) {
                throw new Error(
                    `Failed to download file from storage: ${downloadError?.message || 'Unknown error'}. Please try uploading again.`,
                );
            }

            // Validate file size
            const buffer = Buffer.from(await fileData.arrayBuffer());
            validateFileSize(buffer.length);

            // Save to temp file
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(
                tempDir,
                `processing_${documentId}_${fileName}`,
            );
            await fs.writeFile(tempFilePath, buffer);

            // 2. Load document using LangChain loaders
            let docs;
            const fileExtension = fileName.split('.').pop()?.toLowerCase();

            try {
                if (fileExtension === 'pdf') {
                    const loader = new PDFLoader(tempFilePath);
                    docs = await loader.load();
                } else if (fileExtension === 'docx') {
                    const loader = new DocxLoader(tempFilePath);
                    docs = await loader.load();
                } else if (fileExtension === 'txt') {
                    const loader = new TextLoader(tempFilePath);
                    docs = await loader.load();
                } else {
                    throw new Error(
                        `Unsupported file type: ${fileExtension}. Supported types: ${ALLOWED_FILE_TYPES.join(', ')}`,
                    );
                }

                // Validate document has content
                if (!docs || docs.length === 0) {
                    throw new Error(
                        'No content could be extracted from the document. The file may be corrupted or empty.',
                    );
                }

                // Validate minimum content length
                const totalContent = docs
                    .map((doc) => doc.pageContent)
                    .join('')
                    .trim();

                if (totalContent.length < MIN_CONTENT_LENGTH) {
                    throw new Error(
                        `Document content is too short (${totalContent.length} characters). Minimum required: ${MIN_CONTENT_LENGTH} characters.`,
                    );
                }
            } catch (error) {
                // Clean up temp file before re-throwing
                await fs.unlink(tempFilePath).catch(console.error);

                if (error instanceof Error) {
                    // Re-throw our custom errors
                    if (
                        error.message.includes('Unsupported file type') ||
                        error.message.includes('No content') ||
                        error.message.includes('too short')
                    ) {
                        throw error;
                    }
                    // Wrap loader errors with user-friendly message
                    throw new Error(
                        `Failed to read ${fileExtension?.toUpperCase()} file: ${error.message}. The file may be corrupted or password-protected.`,
                    );
                }
                throw error;
            }

            // Clean up temp file after successful load
            await fs.unlink(tempFilePath).catch(console.error);

            // 3. Split text into chunks
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const chunks = await splitter.splitDocuments(docs);

            // Validate we have chunks
            if (!chunks || chunks.length === 0) {
                throw new Error(
                    'Failed to process document into chunks. The document may be too short or have formatting issues.',
                );
            }

            // Add metadata to chunks
            const chunksWithMetadata = chunks.map((chunk: Document) => ({
                ...chunk,
                metadata: {
                    ...chunk.metadata,
                    documentId,
                    fileName,
                },
            }));

            // 4. Generate embeddings and store in Pinecone
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY,
            });

            const pineconeIndex = await getPineconeIndex();

            try {
                await PineconeStore.fromDocuments(
                    chunksWithMetadata,
                    embeddings,
                    {
                        pineconeIndex,
                        namespace: documentId,
                    },
                );
            } catch (error) {
                throw new Error(
                    `Failed to index document: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                );
            }

            // 5. Update status to processed
            await supabase
                .from('processed_documents')
                .update({
                    status: 'processed',
                    chunks_count: chunks.length,
                    metadata: {
                        processedAt: new Date().toISOString(),
                        processingTime: 'Done', // You could calculate actual time
                        pageCount: docs.length,
                    },
                })
                .eq('id', documentId);

            return {
                success: true,
                message: 'Document processed successfully',
            };
        } catch (error) {
            console.error('Processing error:', error);

            // Categorize errors for better user feedback
            let errorMessage = 'Unknown processing error';

            if (error instanceof Error) {
                const msg = error.message.toLowerCase();

                // Use our custom error messages as-is
                if (
                    error.message.includes('File is too large') ||
                    error.message.includes('Unsupported file type') ||
                    error.message.includes('File is empty') ||
                    error.message.includes('No content') ||
                    error.message.includes('too short') ||
                    error.message.includes('Failed to read') ||
                    error.message.includes('Failed to process') ||
                    error.message.includes('Failed to index')
                ) {
                    errorMessage = error.message;
                } else if (msg.includes('timeout')) {
                    errorMessage =
                        'Processing timed out. Please try a smaller file or contact support.';
                } else if (msg.includes('openai') || msg.includes('embedding')) {
                    errorMessage =
                        'AI service error while processing. Please try again in a moment.';
                } else if (msg.includes('pinecone') || msg.includes('vector')) {
                    errorMessage =
                        'Vector database error. Please try again or contact support.';
                } else if (msg.includes('storage') || msg.includes('download')) {
                    errorMessage =
                        'Failed to access file storage. Please try uploading again.';
                } else {
                    errorMessage = `Processing failed: ${error.message}`;
                }
            }

            // Update status to error
            await supabase
                .from('processed_documents')
                .update({
                    status: 'error',
                    metadata: {
                        error: errorMessage,
                        processedAt: new Date().toISOString(),
                    },
                })
                .eq('id', documentId);

            throw new Error(errorMessage);
        }
    });
