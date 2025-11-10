'use server';

import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getPineconeClient, PINECONE_INDEX_NAME, PINECONE_NAMESPACE } from '@/lib/pinecone';
import { createClient } from '@/supabase/server';
import mammoth from 'mammoth';

interface ProcessDocumentInput {
  documentId: string;
  filePath: string;
  fileName: string;
}

export async function processAndEmbedDocument(input: ProcessDocumentInput) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('User not authenticated');

    await supabase
      .from('processed_documents')
      .update({ status: 'processing' })
      .eq('id', input.documentId);

    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .download(input.filePath);

    if (fileError) throw new Error(`File download error: ${fileError.message}`);

    const text = await extractTextFromFile(fileData, input.fileName);
    
    if (!text || text.trim().length < 50) {
      throw new Error('Insufficient text content extracted from document');
    }
    
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const chunks = await textSplitter.splitText(text);
    
    console.log(`Created ${chunks.length} chunks from document`);

    // 4. Vytvorenie embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002',
    });

    // 5. Uloženie chunks do Supabase
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: input.documentId,
      user_id: user.id,
      content: chunk,
      chunk_index: index,
      metadata: {
        fileName: input.fileName,
        chunkSize: chunk.length,
        totalChunks: chunks.length,
      },
    }));

    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (chunksError) throw new Error(`Error saving chunks: ${chunksError.message}`);

    // 6. Vytvorenie embeddings a uloženie do Pinecone
    const pinecone = await getPineconeClient();
    const index = pinecone.index(PINECONE_INDEX_NAME);

    // Spracovanie v dávkach (batch processing)
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      
      // Vytvorenie embeddings pre batch
      const batchEmbeddings = await embeddings.embedDocuments(batchChunks);
      
      // Príprava vektorov pre Pinecone
      const vectors = batchChunks.map((chunk, idx) => ({
        id: `${input.documentId}-chunk-${i + idx}`,
        values: batchEmbeddings[idx],
        metadata: {
          documentId: input.documentId,
          userId: user.id,
          chunkIndex: i + idx,
          text: chunk,
          fileName: input.fileName,
          timestamp: new Date().toISOString(),
        },
      }));

      // Upsert do Pinecone
      await index.namespace(PINECONE_NAMESPACE).upsert(vectors);
      
      console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
    }

    // 7. Aktualizácia dokumentu - status processed
    await supabase
      .from('processed_documents')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        chunks_count: chunks.length,
        metadata: {
          textLength: text.length,
          chunksCount: chunks.length,
          embeddingsModel: 'text-embedding-ada-002',
        },
      })
      .eq('id', input.documentId);

    return {
      success: true,
      chunksCount: chunks.length,
      message: `Document processed successfully with ${chunks.length} chunks`,
    };

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Aktualizujte status na error
    await supabase
      .from('processed_documents')
      .update({
        status: 'error',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      })
      .eq('id', input.documentId);

    throw error;
  }
}

async function extractTextFromFile(fileData: Blob, fileName: string): Promise<string> {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  try {
    if (fileExtension === 'txt') {
      return await fileData.text();
    }

    if (fileExtension === 'pdf') {
      const pdfParse = require('pdf-parse');
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (fileExtension === 'docx') {
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    throw new Error(`Unsupported file type: ${fileExtension}`);
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from ${fileExtension} file`);
  }
}