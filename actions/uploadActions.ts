'use server';

import { createClient } from '@/supabase/server';
import { processAndEmbedDocument } from './processDocumentActions';

export async function uploadDocumentAction(formData: FormData) {
  const supabase = await createClient();

  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('User not authenticated');

    // Validácia súboru
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PDF, DOCX, and TXT files are supported.');
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 50MB.');
    }

    // Generovanie unique file path
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${timestamp}-${randomString}.${fileExtension}`;

    // Upload do Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    // Získanie public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Vytvorenie záznamu v databáze
    const { data: documentRecord, error: dbError } = await supabase
      .from('processed_documents')
      .insert({
        user_id: user.id,
        name: file.name,
        type: fileExtension,
        size: file.size,
        storage_path: fileName,
        public_url: publicUrl,
        status: 'uploading',
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // Spustenie spracovania dokumentu na pozadí (async)
    processAndEmbedDocument({
      documentId: documentRecord.id,
      filePath: fileName,
      fileName: file.name,
    }).catch((error) => {
      console.error('Background processing error:', error);
      // Error je už zachytený v processAndEmbedDocument
    });

    return {
      success: true,
      document: documentRecord,
      message: 'Document uploaded successfully. Processing in background...',
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Upload failed'
    );
  }
}

export async function getUserFilesAction() {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('User not authenticated');

    const { data: files, error: filesError } = await supabase
      .from('processed_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filesError) throw new Error(`Error fetching files: ${filesError.message}`);

    return { files: files || [] };

  } catch (error) {
    console.error('Error fetching user files:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch files'
    );
  }
}

export async function deleteDocumentAction(documentId: string) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('User not authenticated');

    // Získanie dokumentu pre overenie vlastníctva a storage path
    const { data: document, error: docError } = await supabase
      .from('processed_documents')
      .select('storage_path, user_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) throw new Error('Document not found');
    if (document.user_id !== user.id) throw new Error('Unauthorized');

    // Vymazanie zo storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Vymazanie chunks z Pinecone
    try {
      const { getPineconeClient, PINECONE_INDEX_NAME, PINECONE_NAMESPACE } = 
        await import('@/lib/pinecone');
      
      const pinecone = await getPineconeClient();
      const index = pinecone.index(PINECONE_INDEX_NAME);
      
      // Vymazanie všetkých chunks tohto dokumentu
      await index.namespace(PINECONE_NAMESPACE).deleteMany({
        documentId: documentId,
      });
    } catch (pineconeError) {
      console.error('Pinecone deletion error:', pineconeError);
    }

    // Vymazanie z databázy (cascade delete sa postará o chunks a chats)
    const { error: deleteError } = await supabase
      .from('processed_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw new Error(`Delete error: ${deleteError.message}`);

    return { success: true, message: 'Document deleted successfully' };

  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to delete document'
    );
  }
}