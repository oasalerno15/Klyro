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
      calendar_data: {
        Row: {
          id: string
          user_id: string
          calendar_form: Json
          task_statuses: Json
          step_statuses: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          calendar_form: Json
          task_statuses?: Json
          step_statuses?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          calendar_form?: Json
          task_statuses?: Json
          step_statuses?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mood_logs: {
        Row: {
          id: string
          user_id: string
          mood: number
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood: number
          date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood?: number
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      spending_logs: {
        Row: {
          id: string
          user_id: string
          amount: number
          date: string
          category: string | null
          merchant: string | null
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          date: string
          category?: string | null
          merchant?: string | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          date?: string
          category?: string | null
          merchant?: string | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spending_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          date: string
          category: string[]
          source: string
          confidence: number | null
          items: Json | null
          file_name: string | null
          need_vs_want: string | null
          mood_at_purchase: string | null
          ai_insight: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          date: string
          category?: string[]
          source?: string
          confidence?: number | null
          items?: Json | null
          file_name?: string | null
          need_vs_want?: string | null
          mood_at_purchase?: string | null
          ai_insight?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          date?: string
          category?: string[]
          source?: string
          confidence?: number | null
          items?: Json | null
          file_name?: string | null
          need_vs_want?: string | null
          mood_at_purchase?: string | null
          ai_insight?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 