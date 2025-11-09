'use server';

import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { createClient } from '@/supabase/server';
import mammoth from 'mammoth';

export async function chatWithDocument(
    documentId: string,
    userMessage: string,
) {
    const supabase = await createClient();

    try {
        if (!documentId) throw new Error('No document ID provided');

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) throw new Error('User not authenticated');

        // Get document with more details
        const { data: document, error: docError } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('id', documentId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (docError) throw new Error(`Database error: ${docError.message}`);
        if (!document)
            throw new Error(
                `Document with ID ${documentId} not found or you don't have access to it`,
            );
        if (document.status !== 'processed')
            throw new Error(
                `Document is still ${document.status}. Please wait until processing is complete.`,
            );

        // Check file size limit (50MB)
        if (document.file_size > 50 * 1024 * 1024) {
            throw new Error('Document is too large for analysis. Please use a smaller document (under 50MB).');
        }

        // Get chat history
        const { data: chatHistory } = await supabase
            .from('document_chats')
            .select('user_message, assistant_response, created_at')
            .eq('document_id', documentId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(6);

        // Get document content with enhanced extraction
        const documentContent = await getDocumentContent(document, supabase);

        const llm = new ChatOpenAI({
            modelName: 'gpt-3.5-turbo',
            temperature: 0.1,
            maxTokens: 1500,
        });

        const prompt = PromptTemplate.fromTemplate(`
You are an expert document analysis assistant with deep knowledge in document comprehension and analysis. 
Your task is to provide thorough, accurate analysis based EXCLUSIVELY on the provided document content.

DOCUMENT CONTEXT:
{documentContext}

DOCUMENT METADATA:
- Title: {documentTitle}
- Type: {documentType}
- Status: {documentStatus}
- Chunks Processed: {chunksCount}
- Processed Date: {processedDate}

CONVERSATION HISTORY:
{conversationHistory}

USER QUESTION: {userQuestion}

ANALYSIS GUIDELINES:

FOR SUMMARY REQUESTS:
- Provide a comprehensive overview with main themes
- Identify key sections and their purposes
- Highlight important findings or conclusions
- Mention document structure and organization

FOR SPECIFIC INFORMATION REQUESTS:
- Provide exact information from the document
- Include relevant quotes or specific data points
- Reference the section or location where information was found
- Cross-reference multiple parts if needed

FOR ANALYSIS REQUESTS:
- Identify patterns, trends, or relationships in the content
- Analyze the document's purpose and intended audience
- Evaluate the structure and effectiveness of the document
- Provide insights based on the content

FOR COMPARISON REQUESTS:
- Compare different sections or elements
- Identify contradictions or consistencies
- Analyze progression of ideas or arguments

CRITICAL RULES:
1. BASE ALL ANSWERS STRICTLY ON THE PROVIDED DOCUMENT CONTEXT
2. If information is not in the document, clearly state: "Based on the provided document content, this information is not available."
3. Do not invent, assume, or add external knowledge
4. Be precise and reference specific parts of the text
5. For calculations or inferences, explain your reasoning based on document data
6. If the document content is unclear or insufficient, state the limitations clearly

RESPONSE STRUCTURE:
- Start with a direct answer to the question
- Provide supporting evidence from the document
- Include relevant quotes or data points
- Conclude with summary insights

ANSWER:
`);

        const chain = RunnableSequence.from([
            {
                documentContext: () => documentContent,
                documentTitle: () => document.name,
                documentType: () => document.type || 'Unknown',
                documentStatus: () => document.status,
                chunksCount: () => document.chunks_count || 0,
                processedDate: () =>
                    new Date(document.processed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                conversationHistory: () => formatChatHistory(chatHistory || []),
                userQuestion: () => userMessage,
            },
            prompt,
            llm,
            new StringOutputParser(),
        ]);

        const response = await chain.invoke({});

        await saveChatToDatabase(
            documentId,
            userMessage,
            response,
            supabase,
            user.id,
        );

        return { response };
    } catch (error) {
        console.error('Chat with document error:', error);
        throw new Error(
            error instanceof Error
                ? error.message
                : 'Failed to process chat message',
        );
    }
}

async function getDocumentContent(
    document: any,
    supabase: any,
): Promise<string> {
    try {
        console.log('Getting content for document:', document.name, document.type);
        
        // First, check if we have processed chunks in the database
        const { data: chunks, error: chunksError } = await supabase
            .from('document_chunks')
            .select('content, chunk_index, metadata')
            .eq('document_id', document.id)
            .order('chunk_index', { ascending: true })
            .limit(25); // Increased limit for better context

        if (!chunksError && chunks && chunks.length > 0) {
            console.log(`Using ${chunks.length} pre-processed chunks`);
            // Use pre-processed chunks if available
            const combinedContent = chunks.map((chunk: { chunk_index: number; content: any; }, index: any) => 
                `[Chunk ${chunk.chunk_index + 1}]: ${chunk.content}`
            ).join('\n\n');
            
            return combinedContent.length > 12000 
                ? combinedContent.substring(0, 12000) + '...' 
                : combinedContent;
        }

        console.log('No chunks found, downloading original file...');
        
        // Fallback to file download if no chunks available
        const storagePath = document.storage_path || document.path || document.name;
        const { data: fileData, error: fileError } = await supabase.storage
            .from('documents')
            .download(storagePath);

        if (fileError) {
            console.error('File download error:', fileError);
            return `Document: ${document.name}\nType: ${document.type}\nStatus: ${document.status}\n\nDocument content is currently unavailable for analysis. Please ensure the document has been properly processed.`;
        }

        const content = await extractTextFromFile(fileData, document.name);
        
        if (!content || content.trim().length < 10) {
            return `Document "${document.name}" is available but content extraction yielded minimal or no text. This may be because:\n- The document is image-based (scanned PDF, images)\n- The document is encrypted or password-protected\n- The file format is not fully supported\n- The document is empty\n\nPlease ensure your document contains extractable text and try again.`;
        }

        console.log(`Extracted ${content.length} characters from document`);
        
        return content.length > 12000 
            ? content.substring(0, 12000) + '...' 
            : content;

    } catch (error) {
        console.error('Error in getDocumentContent:', error);
        return `Unable to retrieve document content: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later or contact support if the issue persists.`;
    }
}

async function extractTextFromPDF(fileData: Blob): Promise<string> {
    try {
        // CommonJS require pre pdf-parse
        const pdfParse = require('pdf-parse');
        
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdfParse(buffer);
        return data.text || 'No text content could be extracted from this PDF.';
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function extractTextFromDOCX(fileData: Blob): Promise<string> {
    try {
        const arrayBuffer = await fileData.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value || 'No text content could be extracted from this DOCX document.';
    } catch (error) {
        console.error('DOCX extraction error:', error);
        throw new Error(`DOCX text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function extractTextFromFile(
    fileData: Blob,
    fileName: string,
): Promise<string> {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    try {
        console.log(`Extracting text from ${fileExtension} file: ${fileName}`);
        
        if (fileExtension === 'txt') {
            const text = await fileData.text();
            return text || 'Text file is empty or could not be read.';
        }

        if (fileExtension === 'pdf') {
            return await extractTextFromPDF(fileData);
        }

        if (fileExtension === 'docx') {
            return await extractTextFromDOCX(fileData);
        }

        if (['doc'].includes(fileExtension!)) {
            return 'DOC files are not directly supported. Please convert to DOCX or PDF for analysis.';
        }

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension!)) {
            return 'Image file detected. For image analysis, OCR (Optical Character Recognition) processing is required. Please ensure your image documents have been processed through OCR.';
        }

        if (['xlsx', 'xls', 'csv'].includes(fileExtension!)) {
            return 'Spreadsheet file detected. For spreadsheet analysis, please ensure the document has been processed to extract tabular data.';
        }

        // For other file types, try to read as text
        try {
            const text = await fileData.text();
            if (text && text.length > 10) {
                return text;
            }
            return `Unsupported file type: ${fileExtension}. The system could not extract meaningful text content from this file format.`;
        } catch {
            return `Unsupported file type: ${fileExtension}. Content extraction is not available for this file format. Supported formats: PDF, DOCX, TXT.`;
        }
    } catch (error) {
        console.error('Error in extractTextFromFile:', error);
        throw new Error(`Failed to extract text from ${fileExtension} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function formatChatHistory(chatHistory: any[]): string {
    if (!chatHistory || chatHistory.length === 0) {
        return 'No previous conversation in this session.';
    }

    return chatHistory
        .map(
            (chat) =>
                `USER: ${chat.user_message}\nASSISTANT: ${chat.assistant_response}`,
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
                model: 'gpt-3.5-turbo'
            },
        });

        if (error) throw error;
    } catch (error) {
        console.error('Error saving chat to database:', error);
        // Don't throw here to avoid breaking the chat experience
    }
}