'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import { createClient } from '@/supabase/server';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { getPineconeIndex } from '@/lib/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Document } from '@langchain/core/documents';

// Validation constants
const MAX_QUESTION_LENGTH = 1000;
const MIN_QUESTION_LENGTH = 1;
const MIN_CHUNKS_REQUIRED = 1;

// Validate environment variables
function validateEnvironment() {
    const errors: string[] = [];

    if (!process.env.OPENAI_API_KEY) {
        errors.push('OpenAI API key is not configured');
    }
    if (!process.env.PINECONE_API_KEY) {
        errors.push('Pinecone API key is not configured');
    }

    if (errors.length > 0) {
        throw new Error(
            `Configuration error: ${errors.join(', ')}. Please contact support.`,
        );
    }
}

export const chatWithDocument = authenticatedAction
    .inputSchema(
        z.object({
            documentId: z.string().uuid('Invalid document ID'),
            question: z
                .string()
                .min(MIN_QUESTION_LENGTH, 'Question cannot be empty')
                .max(
                    MAX_QUESTION_LENGTH,
                    `Question must be less than ${MAX_QUESTION_LENGTH} characters`,
                )
                .trim(),
        }),
    )
    .action(async ({ parsedInput: { documentId, question } }) => {
        // Validate environment first
        validateEnvironment();

        const supabase = await createClient();

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error(
                'Authentication required. Please sign in to continue.',
            );
        }

        const { data: document, error: docError } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (docError || !document) {
            throw new Error(
                'Document not found. It may have been deleted or you may not have permission to access it.',
            );
        }

        if (document.status !== 'processed') {
            const statusMessages = {
                processing:
                    'Document is still being processed. Please wait a moment and try again.',
                uploading:
                    'Document is being uploaded. Please wait for upload to complete.',
                error: 'Document processing failed. Please try re-uploading the document.',
                failed: 'Document processing failed. Please try re-uploading the document.',
            };
            throw new Error(
                statusMessages[
                    document.status as keyof typeof statusMessages
                ] || 'Document is not ready for chat.',
            );
        }

        // Validate document has chunks
        if (
            !document.chunks_count ||
            document.chunks_count < MIN_CHUNKS_REQUIRED
        ) {
            throw new Error(
                'This document has no processable content. The file may be empty or corrupted. Please try uploading a different document.',
            );
        }

        try {
            // 1. Initialize Vector Store
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY,
            });

            const pineconeIndex = await getPineconeIndex();

            const vectorStore = await PineconeStore.fromExistingIndex(
                embeddings,
                {
                    pineconeIndex,
                    namespace: documentId, // Search only within this document
                },
            );

            // 2. Create Retriever
            const retriever = vectorStore.asRetriever({
                k: 5, // Retrieve top 5 chunks
            });

            // 3. Create Chat Model
            const chatModel = new ChatOpenAI({
                modelName: 'gpt-3.5-turbo',
                temperature: 0.1,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });

            // 4. Create Prompt Template
            const prompt = ChatPromptTemplate.fromTemplate(`
        You are an AI assistant analyzing the document: "{document_title}"
        
        Answer the user's question based STRICTLY on the following context from the document:
        <context>
        {context}
        </context>

        User Question: {input}
        
        If the answer is not in the context, say so. Do not make up information.
      `);

            // 5. Create Chain
            const { StringOutputParser } =
                await import('@langchain/core/output_parsers');
            const { RunnableSequence } =
                await import('@langchain/core/runnables');

            // Helper to format documents
            const formatDocs = (docs: Document[]) => {
                return docs.map((doc) => doc.pageContent).join('\n\n');
            };

            type ChainInput = {
                question: string;
                document_title: string;
            };

            const chain = RunnableSequence.from([
                {
                    context: async (input: ChainInput) => {
                        const relevantDocs = await retriever.invoke(
                            input.question,
                        );
                        return formatDocs(relevantDocs);
                    },
                    question: (input: ChainInput) => input.question,
                    document_title: (input: ChainInput) => input.document_title,
                },
                prompt,
                chatModel,
                new StringOutputParser(),
            ]);

            // 6. Generate Response
            const response = await chain.invoke({
                question: question,
                document_title: document.name,
            });

            // Validate response
            if (!response || response.trim().length === 0) {
                throw new Error('AI generated an empty response');
            }

            // 7. Save to chat history with user_id
            const { error: chatError } = await supabase
                .from('document_chats')
                .insert({
                    document_id: documentId,
                    user_id: user.id,
                    user_message: question,
                    assistant_response: response,
                });

            if (chatError) {
                console.error('Failed to save chat history:', chatError);
                // Don't throw here - still return the response even if saving fails
                // This ensures the user gets their answer even if there's a DB issue
            }

            return { response };
        } catch (error) {
            console.error('Chat error:', error);

            // Categorize and provide specific error messages
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase();

                // Pinecone/Vector store errors
                if (
                    errorMessage.includes('pinecone') ||
                    errorMessage.includes('vector') ||
                    errorMessage.includes('index')
                ) {
                    throw new Error(
                        'Unable to search document content. The document may not be properly indexed. Please try re-processing the document.',
                    );
                }

                // OpenAI API errors
                if (
                    errorMessage.includes('openai') ||
                    errorMessage.includes('api key') ||
                    errorMessage.includes('rate limit')
                ) {
                    if (errorMessage.includes('rate limit')) {
                        throw new Error(
                            'AI service is temporarily busy. Please wait a moment and try again.',
                        );
                    }
                    throw new Error(
                        'AI service error. Please try again in a moment.',
                    );
                }

                // Network errors
                if (
                    errorMessage.includes('network') ||
                    errorMessage.includes('timeout') ||
                    errorMessage.includes('fetch')
                ) {
                    throw new Error(
                        'Network error. Please check your connection and try again.',
                    );
                }

                // Database errors
                if (
                    errorMessage.includes('database') ||
                    errorMessage.includes('supabase')
                ) {
                    throw new Error(
                        'Database error. Your message may not have been saved. Please try again.',
                    );
                }

                // Re-throw validation errors as-is
                if (
                    errorMessage.includes('authentication') ||
                    errorMessage.includes('document not found') ||
                    errorMessage.includes('no processable content') ||
                    errorMessage.includes('configuration error')
                ) {
                    throw error;
                }

                // Generic error with original message
                throw error;
            }

            throw new Error(
                'An unexpected error occurred. Please try again or contact support if the problem persists.',
            );
        }
    });
