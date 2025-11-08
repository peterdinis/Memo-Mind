'use server';

import { createClient } from "@/supabase/server";

export async function getDocumentChatHistory(documentId: string) {
  const supabase = await createClient();

  try {
    const { data: chatHistory, error } = await supabase
      .from('document_chats')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      throw error;
    }

    return { chatHistory };
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw new Error('Failed to load chat history');
  }
}

export async function clearDocumentChatHistory(documentId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('document_chats')
      .delete()
      .eq('document_id', documentId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw new Error('Failed to clear chat history');
  }
}