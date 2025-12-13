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

// Manual TextLoader implementation since it's missing in @langchain/community
class TextLoader {
    constructor(public filePath: string) {}
    async load(): Promise<Document[]> {
        const text = await fs.readFile(this.filePath, 'utf-8');
        return [
            new Document({
                pageContent: text,
                metadata: { source: this.filePath },
            }),
        ];
    }
}

export const processDocumentAction = authenticatedAction
    .inputSchema(
        z.object({
            documentId: z.string(),
            filePath: z.string(),
            fileName: z.string(),
        }),
    )
    .action(async ({ parsedInput: { documentId, filePath, fileName } }) => {
        const supabase = await createClient();

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
                    `Failed to download file: ${downloadError?.message}`,
                );
            }

            // Save to temp file
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(
                tempDir,
                `processing_${documentId}_${fileName}`,
            );
            const buffer = Buffer.from(await fileData.arrayBuffer());
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
                    throw new Error(`Unsupported file type: ${fileExtension}`);
                }
            } finally {
                // Clean up temp file
                await fs.unlink(tempFilePath).catch(console.error);
            }

            // 3. Split text into chunks
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const chunks = await splitter.splitDocuments(docs);

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

            await PineconeStore.fromDocuments(chunksWithMetadata, embeddings, {
                pineconeIndex,
                namespace: documentId, // Use documentId as namespace for easy deletion/filtering
            });

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

            // Update status to error
            await supabase
                .from('processed_documents')
                .update({
                    status: 'error',
                    metadata: {
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Unknown processing error',
                        processedAt: new Date().toISOString(),
                    },
                })
                .eq('id', documentId);

            throw error;
        }
    });
