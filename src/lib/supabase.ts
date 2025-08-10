/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          github_username: string | null
          leetcode_username: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          skills: string[] | null
          resume_url: string | null
          job_title: string | null
          company: string | null
          experience_years: number | null
          is_profile_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          github_username?: string | null
          leetcode_username?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          skills?: string[] | null
          resume_url?: string | null
          job_title?: string | null
          company?: string | null
          experience_years?: number | null
          is_profile_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          github_username?: string | null
          leetcode_username?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          skills?: string[] | null
          resume_url?: string | null
          job_title?: string | null
          company?: string | null
          experience_years?: number | null
          is_profile_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          tech_stack: string[] | null
          source_code_url: string | null
          live_url: string | null
          image_url: string | null
          is_featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          tech_stack?: string[] | null
          source_code_url?: string | null
          live_url?: string | null
          image_url?: string | null
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          tech_stack?: string[] | null
          source_code_url?: string | null
          live_url?: string | null
          image_url?: string | null
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          issuer: string | null
          date_achieved: string | null
          credential_url: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          issuer?: string | null
          date_achieved?: string | null
          credential_url?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          issuer?: string | null
          date_achieved?: string | null
          credential_url?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          theme: string | null
          dashboard_layout: any | null
          notifications_enabled: boolean | null
          github_notifications: boolean | null
          leetcode_notifications: boolean | null
          news_notifications: boolean | null
          monthly_goal_target: number | null
          monthly_goal_month: string | null
          monthly_goal_completed: number | null
          monthly_goal_last_updated: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          theme?: string | null
          dashboard_layout?: any | null
          notifications_enabled?: boolean | null
          github_notifications?: boolean | null
          leetcode_notifications?: boolean | null
          news_notifications?: boolean | null
          monthly_goal_target?: number | null
          monthly_goal_month?: string | null
          monthly_goal_completed?: number | null
          monthly_goal_last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          theme?: string | null
          dashboard_layout?: any | null
          notifications_enabled?: boolean | null
          github_notifications?: boolean | null
          leetcode_notifications?: boolean | null
          news_notifications?: boolean | null
          monthly_goal_target?: number | null
          monthly_goal_month?: string | null
          monthly_goal_completed?: number | null
          monthly_goal_last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string | null
          article_title: string | null
          article_url: string | null
          article_source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          article_title?: string | null
          article_url?: string | null
          article_source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          article_title?: string | null
          article_url?: string | null
          article_source?: string | null
          created_at?: string
        }
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
  }
}
