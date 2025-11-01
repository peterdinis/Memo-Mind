'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import { z } from 'zod';
import { createClient } from '@/supabase/server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { TextLoader } from '@langchain/community/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { processDocumentSchema, chatWithDocumentSchema } from '@/schemas/chatSchemas';
import { pinecone } from '@/lib/pinecone';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const getPineconeIndex = () => {
    return pinecone.index(process.env.PINECONE_INDEX_NAME || 'documents');
};

// Cache for document metadata (not the vectors)
const documentMetadataCache = new Map();

export const processDocumentAction = authenticatedAction
    .inputSchema(processDocumentSchema)
    .action(async ({ parsedInput: { documentId } }) => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        // Check if document is already processed in Supabase
        const { data: existingDoc, error: docError } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('id', documentId)
            .eq('user_id', user.id)
            .single();

        if (existingDoc && existingDoc.status === 'processed') {
            return {
                success: true,
                message: 'Document already processed',
                documentId,
                chunksCount: existingDoc.chunks_count,
            };
        }

        // Get document from Supabase Storage
        const { data: files, error } = await supabase.storage
            .from('documents')
            .list(`${user.id}`);

        if (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }

        const document = files?.find((file) => file.id === documentId);
        if (!document) {
            throw new Error('Document not found');
        }

        // Download document
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(`${user.id}/${document.name}`);

        if (downloadError) {
            throw new Error(
                `Failed to download document: ${downloadError.message}`,
            );
        }

        try {
            // Update document status to processing
            await supabase
                .from('processed_documents')
                .upsert({
                    id: documentId,
                    user_id: user.id,
                    name: document.name,
                    status: 'processing',
                    chunks_count: 0,
                    processed_at: new Date().toISOString(),
                });

            // Convert Blob to Buffer for file processing
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Process document based on type
            let textContent = '';
            const fileExtension = document.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'pdf') {
                const loader = new PDFLoader(new Blob([buffer]));
                const docs = await loader.load();
                textContent = docs.map((doc) => doc.pageContent).join('\n\n');
            } else if (fileExtension === 'txt') {
                const loader = new TextLoader(new Blob([buffer]));
                const docs = await loader.load();
                textContent = docs.map((doc) => doc.pageContent).join('\n\n');
            } else if (['doc', 'docx'].includes(fileExtension!)) {
                const loader = new DocxLoader(new Blob([buffer]));
                const docs = await loader.load();
                textContent = docs.map((doc) => doc.pageContent).join('\n\n');
            } else {
                // For other file types, use simple text extraction
                textContent = `Document: ${document.name}\nType: ${fileExtension}\nSize: ${document.metadata?.size} bytes\n\nThis document type is not fully supported for text extraction.`;
            }

            // Split text into chunks
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const chunks = await textSplitter.splitText(textContent);

            // Create embeddings
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY!,
            });

            const embeddingsArray = await embeddings.embedDocuments(chunks);

            // Store vectors in Pinecone
            const pineconeIndex = getPineconeIndex();
            
            const vectors = chunks.map((chunk, index) => ({
                id: `${documentId}_${index}`,
                values: embeddingsArray[index],
                metadata: {
                    documentId,
                    userId: user.id,
                    chunkIndex: index,
                    documentName: document.name,
                    contentType: fileExtension,
                    text: chunk.substring(0, 500), // Store first 500 chars for context
                },
            }));

            // Upsert vectors to Pinecone in batches
            const batchSize = 100;
            for (let i = 0; i < vectors.length; i += batchSize) {
                const batch = vectors.slice(i, i + batchSize);
                await pineconeIndex.upsert(batch);
            }

            // Cache document metadata
            documentMetadataCache.set(documentId, {
                name: document.name,
                type: fileExtension,
                size: document.metadata?.size,
                processedAt: new Date().toISOString(),
                chunksCount: chunks.length,
            });

            // Update document status in Supabase
            await supabase
                .from('processed_documents')
                .update({
                    status: 'processed',
                    chunks_count: chunks.length,
                    processed_at: new Date().toISOString(),
                    metadata: {
                        name: document.name,
                        type: fileExtension,
                        size: document.metadata?.size,
                        chunks: chunks.length,
                    },
                })
                .eq('id', documentId)
                .eq('user_id', user.id);

            return {
                success: true,
                message: 'Document processed successfully',
                documentId,
                chunksCount: chunks.length,
            };
        } catch (error) {
            // Update document status to failed
            await supabase
                .from('processed_documents')
                .update({
                    status: 'failed',
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                })
                .eq('id', documentId)
                .eq('user_id', user.id);

            console.error('Document processing error:', error);
            throw new Error(
                `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    });

export const chatWithDocumentAction = authenticatedAction
    .inputSchema(chatWithDocumentSchema)
    .action(async ({ parsedInput: { documentId, message, chatHistory } }) => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        // Check if document is processed in Supabase
        const { data: documentData, error: docError } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('id', documentId)
            .eq('user_id', user.id)
            .eq('status', 'processed')
            .single();

        if (!documentData) {
            throw new Error(
                'Document not processed. Please process the document first.',
            );
        }

        try {
            // Initialize embeddings and chat model
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY!,
            });

            const chatModel = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY!,
                modelName: 'gpt-3.5-turbo',
                temperature: 0.7,
            });

            // Create query embedding
            const queryEmbedding = await embeddings.embedQuery(message);

            // Search in Pinecone
            const pineconeIndex = getPineconeIndex();
            const searchResults = await pineconeIndex.query({
                vector: queryEmbedding,
                filter: {
                    documentId: { $eq: documentId },
                    userId: { $eq: user.id },
                },
                topK: 4,
                includeMetadata: true,
            });

            const relevantDocs = searchResults.matches || [];
            const context = relevantDocs
                .map((match) => match.metadata?.text || '')
                .join('\n\n');

            // Prepare system prompt
            const systemPrompt = `You are an AI assistant helping a user analyze their document.
            
Document Information:
- Name: ${documentData.name}
- Type: ${documentData.metadata?.type}
- Size: ${documentData.metadata?.size}

Context from the document:
${context}

Instructions:
1. Answer questions based ONLY on the provided document context
2. If the answer cannot be found in the document, say so politely
3. Be concise and helpful
4. Reference specific parts of the document when possible
5. If asked to summarize, provide a comprehensive but concise summary
6. Always maintain a professional and helpful tone

Current conversation history:
${chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n')}

User's question: ${message}

Please provide a helpful response based on the document:`;

            // Generate response
            const response = await chatModel.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(message),
            ]);

            const aiResponse = response.content.toString();

            // Save chat history to Supabase
            const { error: chatError } = await supabase
                .from('document_chats')
                .insert({
                    document_id: documentId,
                    user_id: user.id,
                    user_message: message,
                    assistant_response: aiResponse,
                    metadata: {
                        relevant_chunks: relevantDocs.length,
                        model: 'gpt-3.5-turbo',
                    },
                });

            if (chatError) {
                console.error('Failed to save chat history:', chatError);
            }

            // Update chat history
            const updatedChatHistory = [
                ...chatHistory,
                { role: 'user' as const, content: message },
                { role: 'assistant' as const, content: aiResponse },
            ];

            return {
                success: true,
                response: aiResponse,
                chatHistory: updatedChatHistory,
                relevantChunks: relevantDocs.length,
                documentContext: context.substring(0, 500) + '...',
            };
        } catch (error) {
            console.error('Chat error:', error);

            // Fallback to simple OpenAI response
            try {
                const fallbackResponse = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are helping analyze a document called "${documentData.name}". The user asked: "${message}". Provide a helpful response.`,
                        },
                        {
                            role: 'user',
                            content: message,
                        },
                    ],
                    max_tokens: 500,
                });

                const fallbackMessage =
                    fallbackResponse.choices[0]?.message?.content ||
                    'I apologize, but I encountered an error processing your request.';

                return {
                    success: true,
                    response: fallbackMessage,
                    chatHistory: [
                        ...chatHistory,
                        { role: 'user', content: message },
                        { role: 'assistant', content: fallbackMessage },
                    ],
                    relevantChunks: 0,
                    isFallback: true,
                };
            } catch (fallbackError) {
                throw new Error(
                    `Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`,
                );
            }
        }
    });

// Action to get user's processed documents
export const getProcessedDocumentsAction = authenticatedAction
    .action(async () => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const { data: documents, error } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('user_id', user.id)
            .order('processed_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }

        return {
            success: true,
            documents: documents || [],
        };
    });

// Action to clear document data
export const clearDocumentDataAction = authenticatedAction
    .inputSchema(z.object({ documentId: z.string() }))
    .action(async ({ parsedInput: { documentId } }) => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        try {
            // Delete vectors from Pinecone
            const pineconeIndex = getPineconeIndex();
            await pineconeIndex.deleteMany({
                filter: {
                    documentId: { $eq: documentId },
                    userId: { $eq: user.id },
                },
            });

            // Delete from Supabase
            await supabase
                .from('processed_documents')
                .delete()
                .eq('id', documentId)
                .eq('user_id', user.id);

            // Clear chat history
            await supabase
                .from('document_chats')
                .delete()
                .eq('document_id', documentId)
                .eq('user_id', user.id);

            // Clear cache
            documentMetadataCache.delete(documentId);

            return {
                success: true,
                message: 'Document data cleared successfully',
            };
        } catch (error) {
            throw new Error(
                `Failed to clear document data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    });