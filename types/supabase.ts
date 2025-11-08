export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      processed_documents: {
        Row: {
          id: string
          user_id: string
          name: string
          status: 'processing' | 'processed' | 'failed'
          chunks_count: number
          error_message: string | null
          metadata: Json | null
          processed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status?: 'processing' | 'processed' | 'failed'
          chunks_count?: number
          error_message?: string | null
          metadata?: Json | null
          processed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: 'processing' | 'processed' | 'failed'
          chunks_count?: number
          error_message?: string | null
          metadata?: Json | null
          processed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'processed_documents_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      document_chats: {
        Row: {
          id: string
          document_id: string
          user_id: string
          user_message: string
          assistant_response: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          user_message: string
          assistant_response: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          user_message?: string
          assistant_response?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'document_chats_document_id_fkey'
            columns: ['document_id']
            referencedRelation: 'processed_documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'document_chats_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      document_overview: {
        Row: {
          id: string | null
          user_id: string | null
          name: string | null
          status: 'processing' | 'processed' | 'failed' | null
          chunks_count: number | null
          error_message: string | null
          metadata: Json | null
          processed_at: string | null
          created_at: string | null
          updated_at: string | null
          chat_messages_count: number | null
        }
        Insert: {
          id?: never
          user_id?: never
          name?: never
          status?: never
          chunks_count?: never
          error_message?: never
          metadata?: never
          processed_at?: never
          created_at?: never
          updated_at?: never
          chat_messages_count?: never
        }
        Update: {
          id?: never
          user_id?: never
          name?: never
          status?: never
          chunks_count?: never
          error_message?: never
          metadata?: never
          processed_at?: never
          created_at?: never
          updated_at?: never
          chat_messages_count?: never
        }
        Relationships: [
          {
            foreignKeyName: 'processed_documents_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Enums: {
      document_status: 'processing' | 'processed' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']

// Špecifické typy pre dokumenty
export type ProcessedDocument = Tables<'processed_documents'>
export type InsertProcessedDocument = InsertTables<'processed_documents'>
export type UpdateProcessedDocument = UpdateTables<'processed_documents'>

export type DocumentChat = Tables<'document_chats'>
export type InsertDocumentChat = InsertTables<'document_chats'>
export type UpdateDocumentChat = UpdateTables<'document_chats'>

export type DocumentOverview = Views<'document_overview'>

// Typy pre dokument metadata
export interface DocumentMetadata {
  name: string
  type: string
  size?: number
  chunks: number
}

export interface ChatMetadata {
  relevant_chunks: number
  model: string
  is_fallback?: boolean
}

// Typy pre Pinecone metadata
export interface PineconeDocumentMetadata {
  documentId: string
  userId: string
  chunkIndex: number
  documentName: string
  contentType: string
  text: string
}