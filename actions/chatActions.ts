'use server';

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { createClient } from '@/supabase/server';
import { getPineconeClient, PINECONE_INDEX_NAME, PINECONE_NAMESPACE } from '@/lib/pinecone';

export async function chatWithDocument(documentId: string, userMessage: string) {
  const supabase = await createClient();

  try {
    if (!documentId) throw new Error('No document ID provided');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('User not authenticated');

    // Získanie dokumentu
    const { data: document, error: docError } = await supabase
      .from('processed_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (docError) throw new Error(`Database error: ${docError.message}`);
    if (!document) throw new Error(`Document not found`);
    if (document.status !== 'processed') {
      throw new Error(`Document is still ${document.status}. Please wait.`);
    }

    // Získanie chat histórie
    const { data: chatHistory } = await supabase
      .from('document_chats')
      .select('user_message, assistant_response, created_at')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(5);

    // 1. Vytvorenie embedding pre user query
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002',
    });

    const queryEmbedding = await embeddings.embedQuery(userMessage);

    // 2. Vyhľadanie relevantných chunks v Pinecone
    const pinecone = await getPineconeClient();
    const index = pinecone.index(PINECONE_INDEX_NAME);

    const queryResponse = await index.namespace(PINECONE_NAMESPACE).query({
      vector: queryEmbedding,
      topK: 5, // Top 5 najrelevantnejších chunks
      includeMetadata: true,
      filter: {
        documentId: { $eq: documentId },
        userId: { $eq: user.id },
      },
    });

    // 3. Extrakcia relevantného kontextu
    const relevantChunks = queryResponse.matches
      .filter((match) => match.score && match.score > 0.7) // Len chunks s vysokou relevantnosťou
      .map((match, idx) => {
        const metadata = match.metadata as any;
        return `[Chunk ${idx + 1}] (Relevance: ${(match.score! * 100).toFixed(1)}%):\n${metadata.text}`;
      })
      .join('\n\n---\n\n');

    if (!relevantChunks) {
      return {
        response: "I couldn't find relevant information in the document to answer your question. Could you try rephrasing or asking about something else in the document?",
      };
    }

    // 4. Generovanie odpovede pomocou LLM
    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
      maxTokens: 1500,
    });

    const prompt = PromptTemplate.fromTemplate(`
You are an expert document analysis assistant. Answer the user's question based ONLY on the provided context from the document.

DOCUMENT INFORMATION:
- Title: {documentTitle}
- Type: {documentType}
- Total Chunks: {totalChunks}

RELEVANT CONTEXT FROM DOCUMENT:
{relevantContext}

CONVERSATION HISTORY:
{conversationHistory}

USER QUESTION: {userQuestion}

INSTRUCTIONS:
1. Answer ONLY based on the provided context above
2. If the context doesn't contain the answer, clearly state: "Based on the provided sections, I don't have information about this."
3. Reference specific chunks when citing information
4. Be precise and accurate
5. If you need to make inferences, clearly mark them as such

ANSWER:
`);

    const chain = RunnableSequence.from([
      {
        documentTitle: () => document.name,
        documentType: () => document.type || 'Unknown',
        totalChunks: () => document.chunks_count || 0,
        relevantContext: () => relevantChunks,
        conversationHistory: () => formatChatHistory(chatHistory || []),
        userQuestion: () => userMessage,
      },
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({});

    // 5. Uloženie chatu do databázy
    await saveChatToDatabase(documentId, userMessage, response, supabase, user.id);

    return { response };

  } catch (error) {
    console.error('Chat with document error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to process chat message'
    );
  }
}

function formatChatHistory(chatHistory: any[]): string {
  if (!chatHistory || chatHistory.length === 0) {
    return 'No previous conversation.';
  }

  return chatHistory
    .map((chat) => `USER: ${chat.user_message}\nASSISTANT: ${chat.assistant_response}`)
    .join('\n\n');
}

async function saveChatToDatabase(
  documentId: string,
  userMessage: string,
  assistantResponse: string,
  supabase: any,
  userId: string
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
        model: 'gpt-3.5-turbo',
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving chat to database:', error);
  }
}