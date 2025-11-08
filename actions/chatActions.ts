'use server';

import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { createClient } from '@/supabase/server';

export async function chatWithDocument(
    documentId: string,
    userMessage: string,
) {
    const supabase = await createClient();

    try {
        console.log('🔍 Searching for document with ID:', documentId);

        // 0️⃣ Kontrola vstupu
        if (!documentId) {
            throw new Error('No document ID provided');
        }

        // 1️⃣ Overenie autentifikácie používateľa
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('❌ Authentication error:', authError);
            throw new Error('User not authenticated');
        }

        console.log('👤 User authenticated:', user.id);

        // 2️⃣ Načítanie dokumentu z processed_documents s RLS
        const { data: document, error: docError } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('id', documentId)
            .eq('user_id', user.id)
            .maybeSingle(); // ✅ bezpečné, nehodí PGRST116 ak dokument neexistuje

        console.log('📄 Document query result:', {
            documentFound: !!document,
            error: docError,
            documentId,
        });

        if (docError) {
            console.error('❌ Database error:', docError);
            throw new Error(`Database error: ${docError.message}`);
        }

        if (!document) {
            console.error('❌ Document not found or access denied');
            throw new Error(
                `Document with ID ${documentId} not found or you don't have access to it`,
            );
        }

        if (document.status !== 'processed') {
            throw new Error(
                `Document is still ${document.status}. Please wait until processing is complete.`,
            );
        }

        console.log('✅ Document found:', document.name);

        // 3️⃣ Načítanie chat histórie pre kontext
        const { data: chatHistory, error: historyError } = await supabase
            .from('document_chats')
            .select('user_message, assistant_response, created_at')
            .eq('document_id', documentId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(6);

        if (historyError) {
            console.error('⚠️ Error loading chat history:', historyError);
        }

        console.log(
            '💬 Chat history loaded:',
            chatHistory?.length || 0,
            'messages',
        );

        // 4️⃣ Načítanie obsahu dokumentu pre RAG
        const documentContent = await getDocumentContent(document, supabase);

        // 5️⃣ Vytvorenie LangChain reťazca
        const llm = new ChatOpenAI({
            modelName: 'gpt-3.5-turbo',
            temperature: 0.1,
        });

        const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that analyzes documents. Use the following document context to answer the user's question accurately and helpfully.

DOCUMENT CONTEXT:
{documentContext}

DOCUMENT METADATA:
- Title: {documentTitle}
- Status: {documentStatus}
- Chunks: {chunksCount}
- Processed: {processedDate}

CONVERSATION HISTORY:
{conversationHistory}

USER QUESTION: {userQuestion}

INSTRUCTIONS:
- Answer based on the document context when possible
- If the context doesn't contain relevant information, say so clearly
- Be concise but informative
- Maintain conversation context from previous messages
- Always be truthful about the limitations of your knowledge
- Provide specific references to the document content when possible

ANSWER:
`);

        const chain = RunnableSequence.from([
            {
                documentContext: () => documentContent,
                documentTitle: () => document.name,
                documentStatus: () => document.status,
                chunksCount: () => document.chunks_count || 0,
                processedDate: () =>
                    new Date(document.processed_at).toLocaleDateString(),
                conversationHistory: () => formatChatHistory(chatHistory || []),
                userQuestion: () => userMessage,
            },
            prompt,
            llm,
            new StringOutputParser(),
        ]);

        // 6️⃣ Spustenie reťazca a získanie odpovede
        console.log('🤖 Generating AI response...');
        const response = await chain.invoke({});
        console.log('✅ AI response generated');

        // 7️⃣ Uloženie chatu do databázy
        await saveChatToDatabase(
            documentId,
            userMessage,
            response,
            supabase,
            user.id,
        );

        return { response };
    } catch (error) {
        console.error('❌ Chat error:', error);
        throw new Error(
            error instanceof Error
                ? error.message
                : 'Failed to process chat message',
        );
    }
}

/* ---------------------------------------------------------
 * 🧩 Pomocné funkcie
 * --------------------------------------------------------- */

async function getDocumentContent(
    document: any,
    supabase: any,
): Promise<string> {
    try {
        console.log('📁 Downloading document:', document.name);

        const storagePath =
            document.storage_path || document.path || document.name;

        console.log('📂 Using storage path:', storagePath);

        const { data: fileData, error: fileError } = await supabase.storage
            .from('documents')
            .download(storagePath);

        if (fileError) {
            console.error('⚠️ Error downloading file:', fileError);
            return `Document: ${document.name}\nType: ${document.type}\nStatus: ${document.status}\n\nDocument content is currently unavailable for analysis.`;
        }

        const content = await extractTextFromFile(fileData, document.name);
        console.log('📝 Extracted content length:', content.length);
        return content.length > 4000
            ? content.substring(0, 4000) + '...'
            : content;
    } catch (error) {
        console.error('❌ Error getting document content:', error);
        return 'Unable to retrieve document content. Please try again later.';
    }
}

function formatChatHistory(chatHistory: any[]): string {
    if (!chatHistory || chatHistory.length === 0) {
        return 'No previous conversation.';
    }

    return chatHistory
        .map(
            (chat) =>
                `User: ${chat.user_message}\nAssistant: ${chat.assistant_response}`,
        )
        .join('\n\n');
}

async function saveChatToDatabase(
    documentId: string,
    userMessage: string,
    assistantResponse: string,
    supabase: any,
    userId: string,
) {
    try {
        const { error } = await supabase.from('document_chats').insert({
            document_id: documentId,
            user_id: userId,
            user_message: userMessage,
            assistant_response: assistantResponse,
            metadata: {
                response_length: assistantResponse.length,
                timestamp: new Date().toISOString(),
            },
        });

        if (error) {
            console.error('⚠️ Error saving chat:', error);
        } else {
            console.log('💾 Chat saved to database');
        }
    } catch (error) {
        console.error('❌ Error in saveChatToDatabase:', error);
    }
}

async function extractTextFromFile(
    fileData: Blob,
    fileName: string,
): Promise<string> {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    try {
        if (fileExtension === 'txt') {
            return await fileData.text();
        }

        // Pre ostatné typy len jednoduchá fallback správa
        return `This is a ${fileExtension?.toUpperCase()} document named "${fileName}". 
For detailed analysis, please ensure the document has been properly processed and text extraction is configured for ${fileExtension} files.`;
    } catch (error) {
        console.error('❌ Error extracting text from file:', error);
        return `Error extracting text from ${fileExtension} file.`;
    }
}
