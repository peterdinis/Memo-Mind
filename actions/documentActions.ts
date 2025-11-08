'use server';

import { createClient } from "@/supabase/server";

export async function getUserDocuments() {
  const supabase = await createClient();

  try {
    const { data: documents, error } = await supabase
      .from('processed_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { documents };
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Failed to load documents');
  }
}

export async function getDocumentById(documentId: string) {
  const supabase = await createClient();

  try {
    const { data: document, error } = await supabase
      .from('processed_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      throw error;
    }

    return { document };
  } catch (error) {
    console.error('Error fetching document:', error);
    throw new Error('Failed to load document');
  }
}

export async function updateDocumentStatus(documentId: string, status: 'processing' | 'processed' | 'failed', errorMessage?: string) {
  const supabase = await createClient();

  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    if (status === 'processed') {
      updateData.processed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('processed_documents')
      .update(updateData)
      .eq('id', documentId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating document status:', error);
    throw new Error('Failed to update document status');
  }
}