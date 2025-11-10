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

    // Rozdelenie textu na chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments([text]);
    
    console.log(`Created ${docs.length} chunks from document`);
    
    // Inicializácia embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small', // Updated to newer model
    });

    // Uloženie chunks do Supabase
    const chunkRecords = docs.map((doc, index) => ({
      document_id: input.documentId,
      user_id: user.id,
      content: doc.pageContent,
      chunk_index: index,
      metadata: {
        fileName: input.fileName,
        chunkSize: doc.pageContent.length,
        totalChunks: docs.length,
      },
    }));

    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (chunksError) throw new Error(`Error saving chunks: ${chunksError.message}`);

    // Vytvorenie embeddings a uloženie do Pinecone
    const pinecone = await getPineconeClient();
    const index = pinecone.index(PINECONE_INDEX_NAME);

    // Spracovanie v dávkach (batch processing)
    const batchSize = 100;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batchDocs = docs.slice(i, i + batchSize);
      const batchTexts = batchDocs.map(doc => doc.pageContent);
      
      // Vytvorenie embeddings pre batch
      const batchEmbeddings = await embeddings.embedDocuments(batchTexts);
      
      // Príprava vektorov pre Pinecone
      const vectors = batchDocs.map((doc, idx) => ({
        id: `${input.documentId}-chunk-${i + idx}`,
        values: batchEmbeddings[idx],
        metadata: {
          documentId: input.documentId,
          userId: user.id,
          chunkIndex: i + idx,
          text: doc.pageContent,
          fileName: input.fileName,
          timestamp: new Date().toISOString(),
        },
      }));

      // Upsert do Pinecone
      await index.namespace(PINECONE_NAMESPACE).upsert(vectors);
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(docs.length / batchSize)}`);
    }

    // Aktualizácia dokumentu - status processed
    await supabase
      .from('processed_documents')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        chunks_count: docs.length,
        metadata: {
          textLength: text.length,
          chunksCount: docs.length,
          embeddingsModel: 'text-embedding-3-small',
        },
      })
      .eq('id', input.documentId);

    return {
      success: true,
      chunksCount: docs.length,
      message: `Document processed successfully with ${docs.length} chunks`,
    };

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Aktualizácia statusu na error
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
      // Dynamický import pre pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
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