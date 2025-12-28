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

export const chatWithDocument = authenticatedAction
    .inputSchema(
        z.object({
            documentId: z.string(),
            question: z.string().min(1, 'Question cannot be empty'),
        }),
    )
    .action(async ({ parsedInput: { documentId, question } }) => {
        const supabase = await createClient();

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data: document, error: docError } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (docError || !document) {
            throw new Error('Document not found');
        }

        if (document.status !== 'processed') {
            throw new Error(
                'Document is still processing. Please wait until processing is complete.',
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

            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('Pinecone')) {
                    throw new Error(
                        'Failed to retrieve document content. The document may not be properly indexed.',
                    );
                }
                if (error.message.includes('OpenAI')) {
                    throw new Error(
                        'Failed to generate AI response. Please try again.',
                    );
                }
                throw error;
            }

            throw new Error('Failed to generate response. Please try again.');
        }
    });
