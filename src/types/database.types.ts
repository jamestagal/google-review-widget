

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_calls: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          request_body: Json | null
          response_code: number
          updated_at: string
          user_agent: string | null
          widget_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          request_body?: Json | null
          response_code: number
          updated_at?: string
          user_agent?: string | null
          widget_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          request_body?: Json | null
          response_code?: number
          updated_at?: string
          user_agent?: string | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_calls_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widget_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_address: string | null
          business_name: string
          created_at: string
          google_place_id: string
          id: string
          logo_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_address?: string | null
          business_name: string
          created_at?: string
          google_place_id: string
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_address?: string | null
          business_name?: string
          created_at?: string
          google_place_id?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          body: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      review_cache: {
        Row: {
          business_profile_id: string | null
          created_at: string | null
          id: string
          last_updated: string
          overall_rating: number | null
          place_id: string
          reviews: Json
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          business_profile_id?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string
          overall_rating?: number | null
          place_id: string
          reviews?: Json
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          business_profile_id?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string
          overall_rating?: number | null
          place_id?: string
          reviews?: Json
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_cache_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_products: {
        Row: {
          created_at: string
          stripe_product_id: string
          type: Database["public"]["Enums"]["stripe_payment_mode"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          stripe_product_id: string
          type: Database["public"]["Enums"]["stripe_payment_mode"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          stripe_product_id?: string
          type?: Database["public"]["Enums"]["stripe_payment_mode"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      widget_api_keys: {
        Row: {
          allowed_domains: string[]
          api_key: string
          cache_duration: number
          created_at: string
          custom_settings: Json
          max_reviews: number
          rate_limit: number
          subscription_tier: string
          updated_at: string
          usage_limit: number
          user_id: string
        }
        Insert: {
          allowed_domains?: string[]
          api_key: string
          cache_duration?: number
          created_at?: string
          custom_settings?: Json
          max_reviews?: number
          rate_limit?: number
          subscription_tier?: string
          updated_at?: string
          usage_limit?: number
          user_id: string
        }
        Update: {
          allowed_domains?: string[]
          api_key?: string
          cache_duration?: number
          created_at?: string
          custom_settings?: Json
          max_reviews?: number
          rate_limit?: number
          subscription_tier?: string
          updated_at?: string
          usage_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      widget_projects: {
        Row: {
          analytics: Json
          api_key: string
          api_usage: number
          business_profile_id: string | null
          colors: Json
          created_at: string
          display: Json
          display_type: string
          filters: Json
          fonts: Json
          id: string
          last_viewed_at: string | null
          name: string
          rate_limit: number | null
          subscription_tier: string
          theme: string
          updated_at: string
          user_id: string | null
          view_count: number
        }
        Insert: {
          analytics?: Json
          api_key: string
          api_usage?: number
          business_profile_id?: string | null
          colors?: Json
          created_at?: string
          display?: Json
          display_type: string
          filters?: Json
          fonts?: Json
          id?: string
          last_viewed_at?: string | null
          name: string
          rate_limit?: number | null
          subscription_tier?: string
          theme?: string
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Update: {
          analytics?: Json
          api_key?: string
          api_usage?: number
          business_profile_id?: string | null
          colors?: Json
          created_at?: string
          display?: Json
          display_type?: string
          filters?: Json
          fonts?: Json
          id?: string
          last_viewed_at?: string | null
          name?: string
          rate_limit?: number | null
          subscription_tier?: string
          theme?: string
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "widget_projects_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_usage_stats: {
        Row: {
          api_key: string | null
          avg_load_time: number | null
          created_at: string | null
          date_hour: string
          domains: Json | null
          error_count: number
          id: string
          interactions: number
          metadata: Json | null
          referrers: Json | null
          unique_visitors: number
          updated_at: string | null
          user_id: string | null
          views: number
          widget_id: string | null
        }
        Insert: {
          api_key?: string | null
          avg_load_time?: number | null
          created_at?: string | null
          date_hour?: string
          domains?: Json | null
          error_count?: number
          id?: string
          interactions?: number
          metadata?: Json | null
          referrers?: Json | null
          unique_visitors?: number
          updated_at?: string | null
          user_id?: string | null
          views?: number
          widget_id?: string | null
        }
        Update: {
          api_key?: string | null
          avg_load_time?: number | null
          created_at?: string | null
          date_hour?: string
          domains?: Json | null
          error_count?: number
          id?: string
          interactions?: number
          metadata?: Json | null
          referrers?: Json | null
          unique_visitors?: number
          updated_at?: string | null
          user_id?: string | null
          views?: number
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_usage_stats_api_key_fkey"
            columns: ["api_key"]
            isOneToOne: false
            referencedRelation: "widget_api_keys"
            referencedColumns: ["api_key"]
          },
          {
            foreignKeyName: "widget_usage_stats_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widget_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_tables_exist: {
        Args: {
          tables: string[]
        }
        Returns: Json
      }
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_counter: {
        Args: {
          row_id: string
        }
        Returns: number
      }
      increment_widget_usage: {
        Args: {
          p_widget_id: string
          p_api_key: string
          p_view_count?: number
          p_visitor_count?: number
          p_interaction_count?: number
          p_error_count?: number
          p_load_time?: number
          p_domain?: string
          p_referrer?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_widget_usage: {
        Args: {
          key_id: string
          log_date: string
          domain: string
          agent: string
        }
        Returns: undefined
      }
      user_password_set: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      stripe_payment_mode: "payment" | "subscription"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      stripe_payment_mode: ["payment", "subscription"],
    },
  },
} as const
