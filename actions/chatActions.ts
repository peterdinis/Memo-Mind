'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import { z } from 'zod';
import { createClient } from '@/supabase/server';
import { OpenAI } from 'openai';

// Správne LangChain importy
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";

// Schemas
export const chatWithDocumentSchema = z.object({
    documentId: z.string(),
    message: z.string().min(1, 'Message is required'),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })).optional().default([]),
});

export const processDocumentSchema = z.object({
    documentId: z.string(),
});

// Types
export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

// Cache for document processing
const documentCache = new Map();

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

        // Check if document is already processed
        if (documentCache.has(documentId)) {
            return { 
                success: true, 
                message: 'Document already processed',
                documentId 
            };
        }

        // Get document from Supabase Storage
        const { data: files, error } = await supabase.storage
            .from('documents')
            .list(`${user.id}/documents`);

        if (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }

        const document = files?.find(file => file.id === documentId);
        if (!document) {
            throw new Error('Document not found');
        }

        // Download document
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(`${user.id}/documents/${document.name}`);

        if (downloadError) {
            throw new Error(`Failed to download document: ${downloadError.message}`);
        }

        try {
            // Convert Blob to Buffer for file processing
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Process document based on type
            let textContent = '';
            const fileExtension = document.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'pdf') {
                const loader = new PDFLoader(new Blob([buffer]));
                const docs = await loader.load();
                textContent = docs.map(doc => doc.pageContent).join('\n\n');
            } else if (fileExtension === 'txt') {
                const loader = new TextLoader(new Blob([buffer]));
                const docs = await loader.load();
                textContent = docs.map(doc => doc.pageContent).join('\n\n');
            } else if (['doc', 'docx'].includes(fileExtension!)) {
                const loader = new DocxLoader(new Blob([buffer]));
                const docs = await loader.load();
                textContent = docs.map(doc => doc.pageContent).join('\n\n');
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

            // Create embeddings and vector store
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY!,
            });

            const vectorStore = await MemoryVectorStore.fromTexts(
                chunks,
                { documentId, documentName: document.name },
                embeddings
            );

            // Cache the processed document
            documentCache.set(documentId, {
                vectorStore,
                textContent,
                metadata: {
                    name: document.name,
                    size: document.metadata?.size,
                    type: fileExtension,
                    processedAt: new Date().toISOString(),
                }
            });

            return {
                success: true,
                message: 'Document processed successfully',
                documentId,
                chunksCount: chunks.length,
            };

        } catch (error) {
            console.error('Document processing error:', error);
            throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

        // Check if document is processed
        if (!documentCache.has(documentId)) {
            throw new Error('Document not processed. Please process the document first.');
        }

        const documentData = documentCache.get(documentId);
        const { vectorStore, textContent, metadata } = documentData;

        try {
            // Initialize chat model
            const chatModel = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY!,
                modelName: 'gpt-3.5-turbo',
                temperature: 0.7,
            });

            // Perform similarity search on the document
            const relevantDocs = await vectorStore.similaritySearch(message, 4);
            const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

            // Prepare system prompt
            const systemPrompt = `You are an AI assistant helping a user analyze their document.
            
Document Information:
- Name: ${metadata.name}
- Type: ${metadata.type}
- Size: ${metadata.size}

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
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's question: ${message}

Please provide a helpful response based on the document:`;

            // Generate response using the call method
            const response = await chatModel.call([
                new SystemMessage(systemPrompt),
                new HumanMessage(message),
            ]);

            const aiResponse = response.content.toString();

            // Update chat history
            const updatedChatHistory = [
                ...chatHistory,
                { role: 'user' as const, content: message },
                { role: 'assistant' as const, content: aiResponse }
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
            
            // Fallback to simple OpenAI response if LangChain fails
            try {
                const fallbackResponse = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are helping analyze a document called "${metadata.name}". The user asked: "${message}". Provide a helpful response.`
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    max_tokens: 500,
                });

                const fallbackMessage = fallbackResponse.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';

                return {
                    success: true,
                    response: fallbackMessage,
                    chatHistory: [
                        ...chatHistory,
                        { role: 'user', content: message },
                        { role: 'assistant', content: fallbackMessage }
                    ],
                    relevantChunks: 0,
                    isFallback: true,
                };

            } catch (fallbackError) {
                throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    });

// Action to clear document cache
export const clearDocumentCacheAction = authenticatedAction
    .inputSchema(z.object({ documentId: z.string().optional() }))
    .action(async ({ parsedInput: { documentId } }) => {
        if (documentId) {
            documentCache.delete(documentId);
        } else {
            documentCache.clear();
        }

        return {
            success: true,
            message: documentId ? 'Document cache cleared' : 'All document caches cleared',
        };
    });