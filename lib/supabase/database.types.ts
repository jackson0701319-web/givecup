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
      countries: {
        Row: {
          id: string
          name: string
          flag_emoji: string
          country_code: string
          total_amount: number
          donor_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          flag_emoji: string
          country_code: string
          total_amount?: number
          donor_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          flag_emoji?: string
          country_code?: string
          total_amount?: number
          donor_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          group_name: string
          category: string
          total_amount: number
          donor_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_name: string
          category: string
          total_amount?: number
          donor_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_name?: string
          category?: string
          total_amount?: number
          donor_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          receipt_id: string
          country_code: string | null
          group_id: string | null
          amount: number
          donor_name: string
          created_at: string
        }
        Insert: {
          id?: string
          receipt_id?: string
          country_code?: string | null
          group_id?: string | null
          amount: number
          donor_name?: string
          created_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          country_code?: string | null
          group_id?: string | null
          amount?: number
          donor_name?: string
          created_at?: string
        }
      }
    }
  }
}

export type CountryRow = Database["public"]["Tables"]["countries"]["Row"]
export type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
export type DonationRow = Database["public"]["Tables"]["donations"]["Row"]
