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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          admin_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_revoked: boolean | null
          last_active_at: string | null
          session_token_hash: string
          user_agent: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          last_active_at?: string | null
          session_token_hash: string
          user_agent?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          last_active_at?: string | null
          session_token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          auth_user_id: string | null
          canary_field_x9: string | null
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          id: string
          locked_until: string | null
          security_answer_1_hash: string
          security_answer_2_hash: string
          security_question_1: string
          security_question_2: string
        }
        Insert: {
          auth_user_id?: string | null
          canary_field_x9?: string | null
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          id?: string
          locked_until?: string | null
          security_answer_1_hash: string
          security_answer_2_hash: string
          security_question_1: string
          security_question_2: string
        }
        Update: {
          auth_user_id?: string | null
          canary_field_x9?: string | null
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          id?: string
          locked_until?: string | null
          security_answer_1_hash?: string
          security_answer_2_hash?: string
          security_question_1?: string
          security_question_2?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string | null
          expires_at: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          reason: string | null
        }
        Insert: {
          blocked_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          reason?: string | null
        }
        Update: {
          blocked_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          reason?: string | null
        }
        Relationships: []
      }
      letter_access_sessions: {
        Row: {
          attempts_used: number | null
          cooldown_until: string | null
          created_at: string | null
          expires_at: string
          id: string
          letter_id: string
          session_token_hash: string
        }
        Insert: {
          attempts_used?: number | null
          cooldown_until?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          letter_id: string
          session_token_hash: string
        }
        Update: {
          attempts_used?: number | null
          cooldown_until?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          letter_id?: string
          session_token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_access_sessions_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          admin_id: string
          canary_field_q7: string | null
          content_encrypted: string
          content_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_read: boolean | null
          order_index: number
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          admin_id: string
          canary_field_q7?: string | null
          content_encrypted: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_read?: boolean | null
          order_index: number
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          admin_id?: string
          canary_field_q7?: string | null
          content_encrypted?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_read?: boolean | null
          order_index?: number
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      recipients: {
        Row: {
          admin_id: string
          canary_field_z3: string | null
          created_at: string | null
          display_label: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          name_encrypted: string
          token_hash: string
          use_count: number | null
        }
        Insert: {
          admin_id: string
          canary_field_z3?: string | null
          created_at?: string | null
          display_label?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          name_encrypted: string
          token_hash: string
          use_count?: number | null
        }
        Update: {
          admin_id?: string
          canary_field_z3?: string | null
          created_at?: string | null
          display_label?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          name_encrypted?: string
          token_hash?: string
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipients_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      replies: {
        Row: {
          canary_field_m2: string | null
          content_encrypted: string
          created_at: string | null
          id: string
          is_read_by_admin: boolean | null
          letter_id: string
          sender_type: string
        }
        Insert: {
          canary_field_m2?: string | null
          content_encrypted: string
          created_at?: string | null
          id?: string
          is_read_by_admin?: boolean | null
          letter_id: string
          sender_type: string
        }
        Update: {
          canary_field_m2?: string | null
          content_encrypted?: string
          created_at?: string | null
          id?: string
          is_read_by_admin?: boolean | null
          letter_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      request_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string
          token_hash_prefix: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: string
          token_hash_prefix?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string
          token_hash_prefix?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          token_hash_prefix: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          token_hash_prefix?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          token_hash_prefix?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      security_questions: {
        Row: {
          answer_hash: string
          created_at: string | null
          id: string
          letter_id: string
          question_order: number
          question_text: string
        }
        Insert: {
          answer_hash: string
          created_at?: string | null
          id?: string
          letter_id: string
          question_order: number
          question_text: string
        }
        Update: {
          answer_hash?: string
          created_at?: string | null
          id?: string
          letter_id?: string
          question_order?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_questions_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_block_ip: { Args: { p_ip: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip: string
          p_max: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      cleanup_old_request_logs: { Args: never; Returns: undefined }
      decrypt_letter_content: {
        Args: { p_letter_id: string; p_session_token: string }
        Returns: string
      }
      decrypt_recipient_name: {
        Args: { p_recipient_id: string }
        Returns: string
      }
      encrypt_content: { Args: { p_content: string }; Returns: string }
      hash_answer: { Args: { p_answer: string }; Returns: string }
      log_security_event: {
        Args: {
          p_event_type: string
          p_ip: string
          p_metadata?: Json
          p_severity: string
          p_token_prefix?: string
          p_user_agent: string
        }
        Returns: undefined
      }
      verify_admin_answers: {
        Args: { p_answer_1: string; p_answer_2: string }
        Returns: boolean
      }
      verify_security_answer: {
        Args: { p_answer: string; p_letter_id: string; p_question_id: string }
        Returns: boolean
      }
      verify_token: { Args: { raw_token: string }; Returns: string }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
