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
      payment_orders: {
        Row: {
          order_id: string
          status: string
          amount_krw: number
          donation_amount_usd: number
          tip_amount_usd: number
          donor_name: string
          country_code: string | null
          group_id: string | null
          order_name: string
          target_label: string
          payment_key: string | null
          receipt_id: string | null
          created_at: string
          paid_at: string | null
        }
        Insert: {
          order_id: string
          status?: string
          amount_krw: number
          donation_amount_usd: number
          tip_amount_usd?: number
          donor_name: string
          country_code?: string | null
          group_id?: string | null
          order_name: string
          target_label: string
          payment_key?: string | null
          receipt_id?: string | null
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          order_id?: string
          status?: string
          amount_krw?: number
          donation_amount_usd?: number
          tip_amount_usd?: number
          donor_name?: string
          country_code?: string | null
          group_id?: string | null
          order_name?: string
          target_label?: string
          payment_key?: string | null
          receipt_id?: string | null
          created_at?: string
          paid_at?: string | null
        }
      }
    }
  }
}

export type CountryRow = Database["public"]["Tables"]["countries"]["Row"]
export type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
export type DonationRow = Database["public"]["Tables"]["donations"]["Row"]
