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
    PostgrestVersion: "14.5"
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
          trial_ends_at: string | null
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
          trial_ends_at?: string | null
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
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      braviko_admins: {
        Row: {
          active: boolean
          created_at: string
          display_name: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      braviko_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "braviko_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "braviko_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      braviko_customer_profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      braviko_newsletter_subscribers: {
        Row: {
          consent_at: string
          created_at: string
          email: string
          id: string
          locale: string
          source: string
        }
        Insert: {
          consent_at?: string
          created_at?: string
          email: string
          id?: string
          locale: string
          source?: string
        }
        Update: {
          consent_at?: string
          created_at?: string
          email?: string
          id?: string
          locale?: string
          source?: string
        }
        Relationships: []
      }
      braviko_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id: string | null
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "braviko_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "braviko_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      braviko_orders: {
        Row: {
          address: string
          city: string
          created_at: string
          currency: string
          customer_email: string
          delivery_amount: number
          first_name: string
          id: string
          last_name: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          phone: string
          postal_code: string
          reference: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          currency?: string
          customer_email: string
          delivery_amount?: number
          first_name: string
          id?: string
          last_name: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          phone: string
          postal_code: string
          reference: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          currency?: string
          customer_email?: string
          delivery_amount?: number
          first_name?: string
          id?: string
          last_name?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          phone?: string
          postal_code?: string
          reference?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      braviko_product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          storage_path: string
          watermarked_at: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          storage_path: string
          watermarked_at?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          storage_path?: string
          watermarked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "braviko_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "braviko_products"
            referencedColumns: ["id"]
          },
        ]
      }
      braviko_product_translations: {
        Row: {
          conditioning: string | null
          created_at: string
          delivery_info: string | null
          description: string | null
          id: string
          locale: string
          name: string
          product_id: string
          short_description: string | null
          updated_at: string
        }
        Insert: {
          conditioning?: string | null
          created_at?: string
          delivery_info?: string | null
          description?: string | null
          id?: string
          locale: string
          name: string
          product_id: string
          short_description?: string | null
          updated_at?: string
        }
        Update: {
          conditioning?: string | null
          created_at?: string
          delivery_info?: string | null
          description?: string | null
          id?: string
          locale?: string
          name?: string
          product_id?: string
          short_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "braviko_product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "braviko_products"
            referencedColumns: ["id"]
          },
        ]
      }
      braviko_product_variants: {
        Row: {
          active: boolean
          compare_at_price: number | null
          created_at: string
          id: string
          label: string
          price: number
          product_id: string
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          compare_at_price?: number | null
          created_at?: string
          id?: string
          label: string
          price: number
          product_id: string
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          compare_at_price?: number | null
          created_at?: string
          id?: string
          label?: string
          price?: number
          product_id?: string
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "braviko_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "braviko_products"
            referencedColumns: ["id"]
          },
        ]
      }
      braviko_products: {
        Row: {
          category_id: string
          created_at: string
          featured: boolean
          id: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          featured?: boolean
          id?: string
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          featured?: boolean
          id?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "braviko_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "braviko_categories"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          id: string
          max_scans: number
          plan: string
          scans_count: number
          staging_header: string | null
        }
        Insert: {
          created_at?: string
          id: string
          max_scans?: number
          plan?: string
          scans_count?: number
          staging_header?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          max_scans?: number
          plan?: string
          scans_count?: number
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
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
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
      create_braviko_order: {
        Args: { p_customer: Json; p_items: Json; p_reference: string }
        Returns: {
          order_id: string
          order_total: number
        }[]
      }
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
