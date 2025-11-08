'use server';

import { createClient } from '@/supabase/server';

export async function getDocumentChatHistory(documentId: string) {
    const supabase = await createClient();

    try {
        // Overenie autentifikácie
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data: chatHistory, error } = await supabase
            .from('document_chats')
            .select('*')
            .eq('document_id', documentId)
            .eq('user_id', user.id) // RLS filter
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            throw error;
        }

        return { chatHistory: chatHistory || [] };
    } catch (error) {
        console.error('Error fetching chat history:', error);
        // Vrátiť prázdny zoznam namiesto chyby
        return { chatHistory: [] };
    }
}

export async function clearDocumentChatHistory(documentId: string) {
    const supabase = await createClient();

    try {
        // Overenie autentifikácie
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('document_chats')
            .delete()
            .eq('document_id', documentId)
            .eq('user_id', user.id); // RLS filter

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error clearing chat history:', error);
        throw new Error('Failed to clear chat history');
    }
}
