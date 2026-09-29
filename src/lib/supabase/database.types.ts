export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          plan: string
          scans_count: number
          max_scans: number
          staging_header: string | null
          created_at: string
        }
        Insert: {
          id: string
          plan?: string
          scans_count?: number
          max_scans?: number
          staging_header?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan?: string
          scans_count?: number
          max_scans?: number
          staging_header?: string | null
          created_at?: string
        }
        Relationships: []
      }
      checks: {
        Row: {
          category: string
          created_at: string | null
          duration_ms: number | null
          id: string
          key: string
          message: string | null
          page_id: string | null
          scan_id: string
          severity: string | null
          status: string
          title: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          key: string
          message?: string | null
          page_id?: string | null
          scan_id: string
          severity?: string | null
          status: string
          title?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          key?: string
          message?: string | null
          page_id?: string | null
          scan_id?: string
          severity?: string | null
          status?: string
          title?: string | null
        }
        Relationships: [
          { foreignKeyName: "checks_page_id_fkey"; columns: ["page_id"]; isOneToOne: false; referencedRelation: "pages"; referencedColumns: ["id"] },
          { foreignKeyName: "checks_scan_id_fkey"; columns: ["scan_id"]; isOneToOne: false; referencedRelation: "scans"; referencedColumns: ["id"] },
        ]
      }
      evidence: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string | null
          payload: Json | null
          scan_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id?: string | null
          payload?: Json | null
          scan_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string | null
          payload?: Json | null
          scan_id?: string
          type?: string
        }
        Relationships: [
          { foreignKeyName: "evidence_issue_id_fkey"; columns: ["issue_id"]; isOneToOne: false; referencedRelation: "issues"; referencedColumns: ["id"] },
          { foreignKeyName: "evidence_scan_id_fkey"; columns: ["scan_id"]; isOneToOne: false; referencedRelation: "scans"; referencedColumns: ["id"] },
        ]
      }
      issues: {
        Row: {
          category: string
          confidence: string | null
          created_at: string | null
          description: string | null
          id: string
          page_id: string | null
          scan_id: string
          severity: string
          status: string | null
          suggestion: string | null
          title: string
          ai_tokens_input?: number | null
          ai_tokens_output?: number | null
          ai_cost_usd?: number | null
          ai_duration_ms?: number | null
          ai_model?: string | null
        }
        Insert: {
          category: string
          confidence?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          page_id?: string | null
          scan_id: string
          severity: string
          status?: string | null
          suggestion?: string | null
          title: string
          ai_tokens_input?: number | null
          ai_tokens_output?: number | null
          ai_cost_usd?: number | null
          ai_duration_ms?: number | null
          ai_model?: string | null
        }
        Update: {
          category?: string
          confidence?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          page_id?: string | null
          scan_id?: string
          severity?: string
          status?: string | null
          suggestion?: string | null
          title?: string
          ai_tokens_input?: number | null
          ai_tokens_output?: number | null
          ai_cost_usd?: number | null
          ai_duration_ms?: number | null
          ai_model?: string | null
        }
        Relationships: [
          { foreignKeyName: "issues_page_id_fkey"; columns: ["page_id"]; isOneToOne: false; referencedRelation: "pages"; referencedColumns: ["id"] },
          { foreignKeyName: "issues_scan_id_fkey"; columns: ["scan_id"]; isOneToOne: false; referencedRelation: "scans"; referencedColumns: ["id"] },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          depth: number | null
          final_url: string | null
          id: string
          response_time_ms: number | null
          scan_id: string
          status_code: number | null
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          depth?: number | null
          final_url?: string | null
          id?: string
          response_time_ms?: number | null
          scan_id: string
          status_code?: number | null
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          depth?: number | null
          final_url?: string | null
          id?: string
          response_time_ms?: number | null
          scan_id?: string
          status_code?: number | null
          title?: string | null
          url?: string
        }
        Relationships: [
          { foreignKeyName: "pages_scan_id_fkey"; columns: ["scan_id"]; isOneToOne: false; referencedRelation: "scans"; referencedColumns: ["id"] },
        ]
      }
      scans: {
        Row: {
          checks_failed: number | null
          checks_passed: number | null
          checks_total: number | null
          checks_warning: number | null
          completed_at: string | null
          consent_confirmed_at: string | null
          created_at: string | null
          critical_count: number | null
          current_step: string | null
          error: string | null
          id: string
          major_count: number | null
          pages_discovered: number | null
          previous_scan_id: string | null
          site_id: string
          started_at: string | null
          status: string
          summary: string | null
          user_id: string
          ai_calls_count?: number | null
          ai_tokens_input?: number | null
          ai_tokens_output?: number | null
          ai_cost_usd?: number | null
          ai_duration_ms?: number | null
          scan_modules: Json
          attempt_count: number
          max_attempts: number
          queued_at: string | null
          worker_started_at: string | null
        }
        Insert: {
          checks_failed?: number | null
          checks_passed?: number | null
          checks_total?: number | null
          checks_warning?: number | null
          completed_at?: string | null
          consent_confirmed_at?: string | null
          created_at?: string | null
          critical_count?: number | null
          current_step?: string | null
          error?: string | null
          id?: string
          major_count?: number | null
          pages_discovered?: number | null
          previous_scan_id?: string | null
          site_id: string
          started_at?: string | null
          status?: string
          summary?: string | null
          user_id: string
          ai_calls_count?: number | null
          ai_tokens_input?: number | null
          ai_tokens_output?: number | null
          ai_cost_usd?: number | null
          ai_duration_ms?: number | null
          scan_modules?: Json
          attempt_count?: number
          max_attempts?: number
          queued_at?: string | null
          worker_started_at?: string | null
        }
        Update: {
          checks_failed?: number | null
          checks_passed?: number | null
          checks_total?: number | null
          checks_warning?: number | null
          completed_at?: string | null
          consent_confirmed_at?: string | null
          created_at?: string | null
          critical_count?: number | null
          current_step?: string | null
          error?: string | null
          id?: string
          major_count?: number | null
          pages_discovered?: number | null
          previous_scan_id?: string | null
          site_id?: string
          started_at?: string | null
          status?: string
          summary?: string | null
          user_id?: string
          ai_calls_count?: number | null
          ai_tokens_input?: number | null
          ai_tokens_output?: number | null
          ai_cost_usd?: number | null
          ai_duration_ms?: number | null
          scan_modules?: Json
          attempt_count?: number
          max_attempts?: number
          queued_at?: string | null
          worker_started_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "scans_previous_scan_id_fkey"; columns: ["previous_scan_id"]; isOneToOne: false; referencedRelation: "scans"; referencedColumns: ["id"] },
          { foreignKeyName: "scans_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "sites"; referencedColumns: ["id"] },
        ]
      }
      screenshots: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string | null
          page_id: string | null
          scan_id: string
          storage_path: string
          viewport: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id?: string | null
          page_id?: string | null
          scan_id: string
          storage_path: string
          viewport: string
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string | null
          page_id?: string | null
          scan_id?: string
          storage_path?: string
          viewport?: string
        }
        Relationships: [
          { foreignKeyName: "screenshots_scan_id_fkey"; columns: ["scan_id"]; isOneToOne: false; referencedRelation: "scans"; referencedColumns: ["id"] },
        ]
      }
      journey_steps: {
        Row: {
          id: string
          scan_id: string
          page_id: string | null
          issue_id: string | null
          journey_name: string
          step_order: number
          step_name: string
          action_type: string
          action_target: string | null
          action_details: Json | null
          status: string
          result_payload: Json | null
          error_message: string | null
          screenshot_id: string | null
          duration_ms: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          scan_id: string
          page_id?: string | null
          issue_id?: string | null
          journey_name: string
          step_order: number
          step_name: string
          action_type: string
          action_target?: string | null
          action_details?: Json | null
          status: string
          result_payload?: Json | null
          error_message?: string | null
          screenshot_id?: string | null
          duration_ms?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          scan_id?: string
          page_id?: string | null
          issue_id?: string | null
          journey_name?: string
          step_order?: number
          step_name?: string
          action_type?: string
          action_target?: string | null
          action_details?: Json | null
          status?: string
          result_payload?: Json | null
          error_message?: string | null
          screenshot_id?: string | null
          duration_ms?: number | null
          created_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "journey_steps_scan_id_fkey"; columns: ["scan_id"]; isOneToOne: false; referencedRelation: "scans"; referencedColumns: ["id"] },
          { foreignKeyName: "journey_steps_page_id_fkey"; columns: ["page_id"]; isOneToOne: false; referencedRelation: "pages"; referencedColumns: ["id"] },
          { foreignKeyName: "journey_steps_issue_id_fkey"; columns: ["issue_id"]; isOneToOne: false; referencedRelation: "issues"; referencedColumns: ["id"] },
          { foreignKeyName: "journey_steps_screenshot_id_fkey"; columns: ["screenshot_id"]; isOneToOne: false; referencedRelation: "screenshots"; referencedColumns: ["id"] },
        ]
      }
      signup_attempts: {
        Row: {
          id: string
          ip_address: string
          created_at: string | null
        }
        Insert: {
          id?: string
          ip_address: string
          created_at?: string | null
        }
        Update: {
          id?: string
          ip_address?: string
          created_at?: string | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          created_at: string | null
          environment: string
          id: string
          journey_definitions: Json
          last_scan_id: string | null
          name: string | null
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          environment?: string
          id?: string
          journey_definitions?: Json
          last_scan_id?: string | null
          name?: string | null
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          environment?: string
          id?: string
          journey_definitions?: Json
          last_scan_id?: string | null
          name?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "sites_last_scan_id_fkey"; columns: ["last_scan_id"]; isOneToOne: false; referencedRelation: "scans"; referencedColumns: ["id"] },
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
