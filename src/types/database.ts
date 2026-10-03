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
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          color: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          color?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          color?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          name: string
          brand: string | null
          barcode: string | null
          image_url: string | null
          description: string | null
          quantity: number
          unit: string
          mrp: number | null
          purchase_price: number | null
          weight: string | null
          manufacturing_date: string | null
          expiry_date: string | null
          batch_number: string | null
          purchase_date: string | null
          storage_location: string | null
          minimum_stock_level: number
          notes: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          name: string
          brand?: string | null
          barcode?: string | null
          image_url?: string | null
          description?: string | null
          quantity?: number
          unit?: string
          mrp?: number | null
          purchase_price?: number | null
          weight?: string | null
          manufacturing_date?: string | null
          expiry_date?: string | null
          batch_number?: string | null
          purchase_date?: string | null
          storage_location?: string | null
          minimum_stock_level?: number
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          name?: string
          brand?: string | null
          barcode?: string | null
          image_url?: string | null
          description?: string | null
          quantity?: number
          unit?: string
          mrp?: number | null
          purchase_price?: number | null
          weight?: string | null
          manufacturing_date?: string | null
          expiry_date?: string | null
          batch_number?: string | null
          purchase_date?: string | null
          storage_location?: string | null
          minimum_stock_level?: number
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          quantity: number
          purchase_price: number
          total_amount: number
          purchase_date: string
          store_name: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          quantity?: number
          purchase_price?: number
          total_amount?: number
          purchase_date?: string
          store_name?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          quantity?: number
          purchase_price?: number
          total_amount?: number
          purchase_date?: string
          store_name?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      consumption_history: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          quantity: number
          consumed_at: string
          note: string | null
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          quantity?: number
          consumed_at?: string
          note?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          quantity?: number
          consumed_at?: string
          note?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          title: string
          message: string
          type: 'expiry' | 'low_stock' | 'system' | 'activity'
          severity: 'info' | 'warning' | 'critical' | 'success'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          title: string
          message: string
          type?: 'expiry' | 'low_stock' | 'system' | 'activity'
          severity?: 'info' | 'warning' | 'critical' | 'success'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          title?: string
          message?: string
          type?: 'expiry' | 'low_stock' | 'system' | 'activity'
          severity?: 'info' | 'warning' | 'critical' | 'success'
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          action: 'create' | 'update' | 'delete' | 'consume' | 'purchase'
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          action: 'create' | 'update' | 'delete' | 'consume' | 'purchase'
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          action?: 'create' | 'update' | 'delete' | 'consume' | 'purchase'
          description?: string
          created_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'system'
          low_stock_threshold: number
          expiry_warning_days: number
          notification_preferences: {
            email: boolean
            push: boolean
            expiry_alerts: boolean
            low_stock_alerts: boolean
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          low_stock_threshold?: number
          expiry_warning_days?: number
          notification_preferences?: {
            email: boolean
            push: boolean
            expiry_alerts: boolean
            low_stock_alerts: boolean
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          low_stock_threshold?: number
          expiry_warning_days?: number
          notification_preferences?: {
            email: boolean
            push: boolean
            expiry_alerts: boolean
            low_stock_alerts: boolean
          }
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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

// Convenience Type Aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
export type ConsumptionHistory = Database['public']['Tables']['consumption_history']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
