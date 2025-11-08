'use server';

import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { createClient } from '@/supabase/server';

export async function chatWithDocument(documentId: string, userMessage: string) {
  const supabase = await createClient();

  try {
    // 1. Načítanie dokumentu z processed_documents
    const { data: document, error: docError } = await supabase
      .from('processed_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    if (document.status !== 'processed') {
      throw new Error(`Document is still ${document.status}. Please wait until processing is complete.`);
    }

    // 2. Načítanie chat histórie pre kontext
    const { data: chatHistory, error: historyError } = await supabase
      .from('document_chats')
      .select('user_message, assistant_response')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
      .limit(6);

    // 3. Načítanie obsahu dokumentu pre RAG
    const documentContent = await getDocumentContent(documentId, userMessage, supabase);

    // 4. Vytvorenie LangChain reťazca
    const llm = new ChatOpenAI({
      modelName: 'gpt-4',
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
        processedDate: () => new Date(document.processed_at).toLocaleDateString(),
        conversationHistory: () => formatChatHistory(chatHistory || []),
        userQuestion: () => userMessage,
      },
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    // 5. Spustenie reťazca a získanie odpovede
    const response = await chain.invoke({});

    // 6. Uloženie chatu do databázy
    await saveChatToDatabase(documentId, userMessage, response, supabase);

    return { response };

  } catch (error) {
    console.error('Chat error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to process chat message');
  }
}

// Pomocné funkcie
async function getDocumentContent(documentId: string, query: string, supabase: any): Promise<string> {
  try {
    // Pokus o načítanie dokumentu z storage
    const { data: document } = await supabase
      .from('processed_documents')
      .select('name')
      .eq('id', documentId)
      .single();

    if (!document) {
      return 'Document content not available.';
    }

    // Načítanie súboru z storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('documents')
      .download(document.name);

    if (fileError) {
      console.error('Error downloading file:', fileError);
      return 'Document content not available for analysis.';
    }

    // Extrakcia textu podľa typu súboru
    const content = await extractTextFromFile(fileData, document.name);
    
    // Ak je obsah príliš dlhý, zredukujeme ho
    return content.length > 4000 ? content.substring(0, 4000) + '...' : content;
    
  } catch (error) {
    console.error('Error getting document content:', error);
    return 'Unable to retrieve document content.';
  }
}

function formatChatHistory(chatHistory: any[]): string {
  if (!chatHistory || chatHistory.length === 0) {
    return 'No previous conversation.';
  }

  return chatHistory
    .map(chat => `User: ${chat.user_message}\nAssistant: ${chat.assistant_response}`)
    .join('\n\n');
}

async function saveChatToDatabase(documentId: string, userMessage: string, assistantResponse: string, supabase: any) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('document_chats')
    .insert({
      document_id: documentId,
      user_id: userData.user.id,
      user_message: userMessage,
      assistant_response: assistantResponse,
      metadata: {
        response_length: assistantResponse.length,
        timestamp: new Date().toISOString()
      }
    });

  if (error) {
    console.error('Error saving chat:', error);
  }
}

async function extractTextFromFile(fileData: Blob, fileName: string): Promise<string> {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  
  try {
    // Pre textové súbory
    if (fileExtension === 'txt') {
      return await fileData.text();
    }
    
    // Pre PDF - potrebuje pdf-parse
    if (fileExtension === 'pdf') {
      // const pdf = await import('pdf-parse');
      // const pdfData = await pdf.default(fileData);
      // return pdfData.text;
      return 'PDF content extraction requires pdf-parse package.';
    }
    
    // Pre DOCX - potrebuje mammoth
    if (fileExtension === 'docx') {
      // const mammoth = await import('mammoth');
      // const result = await mammoth.extractRawText({ arrayBuffer: await fileData.arrayBuffer() });
      // return result.value;
      return 'DOCX content extraction requires mammoth package.';
    }
    
    return `Content extraction for .${fileExtension} files not implemented.`;
    
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return 'Error extracting document content.';
  }
}