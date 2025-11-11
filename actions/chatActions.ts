'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import { createClient } from '@/supabase/server';
import { z } from 'zod';

export const chatWithDocument = authenticatedAction
  .inputSchema(z.object({
    documentId: z.string(),
    question: z.string().min(1, 'Question cannot be empty'),
  }))
  .action(async ({ parsedInput: { documentId, question } }) => {
    const supabase = await createClient();

    // Verify document access and status
    const { data: document, error: docError } = await supabase
      .from('processed_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    if (document.status !== 'processed') {
      throw new Error('Document is still processing. Please wait until processing is complete.');
    }

    if (document.chunks_count === 0) {
      throw new Error('Document has no processed content. Please re-upload the document.');
    }

    // Generate RAG response
    const response = await generateRAGResponse(documentId, question, document.name);

    // Save to chat history
    const { error: chatError } = await supabase
      .from('document_chats')
      .insert({
        document_id: documentId,
        user_message: question,
        assistant_response: response,
      });

    if (chatError) {
      console.error('Failed to save chat history:', chatError);
    }

    return { response };
  });

async function generateRAGResponse(documentId: string, question: string, documentTitle: string) {
  try {
    // 1. Create embedding for the question
    const questionEmbedding = await createEmbedding(question);
    
    // 2. Search for relevant chunks in Pinecone
    const relevantChunks = await searchPinecone(documentId, questionEmbedding, 5);
    
    if (relevantChunks.length === 0) {
      return "I couldn't find any relevant information in the document to answer your question. The document might not contain information related to your query.";
    }

    // 3. Create context from relevant chunks
    const context = relevantChunks.map(chunk => chunk.text).join('\n\n');

    // 4. Generate response using OpenAI Chat Completion
    const response = await generateChatResponse(question, context, documentTitle);
    
    return response;
  } catch (error) {
    console.error('RAG response error:', error);
    throw new Error('Failed to generate response from document. Please try again.');
  }
}

// Create single embedding
async function createEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Search Pinecone
async function searchPinecone(documentId: string, embedding: number[], topK: number = 5) {
  const { Pinecone } = await import('@pinecone-database/pinecone');
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  const results = await index.namespace(documentId).query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return results.matches.map(match => ({
    text: match.metadata?.text as string,
    score: match.score,
  }));
}

// Generate chat response using OpenAI
async function generateChatResponse(question: string, context: string, documentTitle: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant analyzing the document: "${documentTitle}"

Based STRICTLY on the provided context from the document, please answer the user's question. Follow these rules:
1. Only use information from the provided context
2. If the context doesn't contain enough information to answer fully, say so and mention what information IS available
3. Do not make up information or use external knowledge
4. Be precise and helpful`
        },
        {
          role: 'user',
          content: `Context from the document:
${context}

User Question: ${question}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}