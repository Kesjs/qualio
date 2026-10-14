export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          source: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          source?: string
          status?: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          source?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_sources: {
        Row: {
          accent_color: string
          active: boolean
          button_label: string
          created_at: string
          id: string
          position: string
          public_key: string
          site_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          active?: boolean
          button_label?: string
          created_at?: string
          id?: string
          position?: string
          public_key: string
          site_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          active?: boolean
          button_label?: string
          created_at?: string
          id?: string
          position?: string
          public_key?: string
          site_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_sources_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          attempt_count: number
          created_at: string
          event_key: string
          event_type: string
          id: string
          last_error: string | null
          opened_at: string | null
          provider_id: string | null
          recipient: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          event_key: string
          event_type: string
          id?: string
          last_error?: string | null
          opened_at?: string | null
          provider_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          event_key?: string
          event_type?: string
          id?: string
          last_error?: string | null
          opened_at?: string | null
          provider_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_ai_usage: {
        Row: {
          classification_count: number
          created_at: string
          month_key: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          classification_count?: number
          created_at?: string
          month_key: string
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          classification_count?: number
          created_at?: string
          month_key?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_ai_usage_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_intake_events: {
        Row: {
          content_hash: string
          created_at: string
          id: string
          ip_address: string
          public_key: string
          site_id: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          id?: string
          ip_address: string
          public_key: string
          site_id: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          id?: string
          ip_address?: string
          public_key?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_intake_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_items: {
        Row: {
          author_email: string | null
          author_name: string | null
          confidence: number | null
          content: string
          created_at: string
          external_id: string | null
          id: string
          metadata: Json
          reviewed_at: string | null
          sentiment: string | null
          site_id: string
          source: string
          source_url: string | null
          status: string
          theme: string | null
          user_id: string
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          confidence?: number | null
          content: string
          created_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json
          reviewed_at?: string | null
          sentiment?: string | null
          site_id: string
          source?: string
          source_url?: string | null
          status?: string
          theme?: string | null
          user_id: string
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          confidence?: number | null
          content?: string
          created_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json
          reviewed_at?: string | null
          sentiment?: string | null
          site_id?: string
          source?: string
          source_url?: string | null
          status?: string
          theme?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_recommendations: {
        Row: {
          action: string | null
          baseline_count: number | null
          confidence: string | null
          created_at: string
          decided_at: string | null
          description: string | null
          done_at: string | null
          feedback_ids: string[]
          fingerprint: string | null
          id: string
          priority: string | null
          rationale: string | null
          resolved_at: string | null
          site_id: string
          status: string
          synthesis_id: string | null
          theme: string | null
          title: string
          uncertainty: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          baseline_count?: number | null
          confidence?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string | null
          done_at?: string | null
          feedback_ids?: string[]
          fingerprint?: string | null
          id?: string
          priority?: string | null
          rationale?: string | null
          resolved_at?: string | null
          site_id: string
          status?: string
          synthesis_id?: string | null
          theme?: string | null
          title: string
          uncertainty?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          baseline_count?: number | null
          confidence?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string | null
          done_at?: string | null
          feedback_ids?: string[]
          fingerprint?: string | null
          id?: string
          priority?: string | null
          rationale?: string | null
          resolved_at?: string | null
          site_id?: string
          status?: string
          synthesis_id?: string | null
          theme?: string | null
          title?: string
          uncertainty?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_recommendations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_recommendations_synthesis_id_fkey"
            columns: ["synthesis_id"]
            isOneToOne: false
            referencedRelation: "feedback_syntheses"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_syntheses: {
        Row: {
          cost_usd: number | null
          created_at: string
          feedback_ids: string[]
          id: string
          model: string | null
          recommendations: Json
          site_id: string
          summary: string
          themes: Json
          title: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
          week_key: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          feedback_ids?: string[]
          id?: string
          model?: string | null
          recommendations?: Json
          site_id: string
          summary: string
          themes?: Json
          title: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
          week_key?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          feedback_ids?: string[]
          id?: string
          model?: string | null
          recommendations?: Json
          site_id?: string
          summary?: string
          themes?: Json
          title?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
          week_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_syntheses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          consent_source: string | null
          consented_at: string | null
          created_at: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          consent_source?: string | null
          consented_at?: string | null
          created_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          consent_source?: string | null
          consented_at?: string | null
          created_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      product_events: {
        Row: {
          created_at: string
          event_key: string | null
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_key?: string | null
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_key?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          max_scans: number | null
          plan: string | null
          scans_count: number | null
          staging_header: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          max_scans?: number | null
          plan?: string | null
          scans_count?: number | null
          staging_header?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_scans?: number | null
          plan?: string | null
          scans_count?: number | null
          staging_header?: string | null
        }
        Relationships: []
      }
      signup_attempts: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          onboarding_completed_at: string | null
          onboarding_method: string | null
          sector: string | null
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          onboarding_completed_at?: string | null
          onboarding_method?: string | null
          sector?: string | null
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          onboarding_completed_at?: string | null
          onboarding_method?: string | null
          sector?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          stripe_event_id?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
