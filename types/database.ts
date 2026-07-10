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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          cds_group_id: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          title: string
        }
        Insert: {
          cds_group_id?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          title: string
        }
        Update: {
          cds_group_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "cds_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_current_month_attendance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_monthly_attendance"
            referencedColumns: ["user_id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_status: string
          device_info: Json
          flagged: boolean
          id: string
          latitude: number
          longitude: number
          session_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          attendance_status?: string
          device_info?: Json
          flagged?: boolean
          id?: string
          latitude: number
          longitude: number
          session_id: string
          timestamp?: string
          user_id: string
        }
        Update: {
          attendance_status?: string
          device_info?: Json
          flagged?: boolean
          id?: string
          latitude?: number
          longitude?: number
          session_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_current_month_attendance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_monthly_attendance"
            referencedColumns: ["user_id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          allowed_radius: number
          cds_group_id: string
          created_at: string
          created_by: string
          end_time: string
          id: string
          latitude: number
          location_name: string
          longitude: number
          qr_token: string
          start_time: string
          title: string
        }
        Insert: {
          allowed_radius?: number
          cds_group_id: string
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          latitude: number
          location_name: string
          longitude: number
          qr_token: string
          start_time: string
          title: string
        }
        Update: {
          allowed_radius?: number
          cds_group_id?: string
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          latitude?: number
          location_name?: string
          longitude?: number
          qr_token?: string
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "cds_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_current_month_attendance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attendance_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_monthly_attendance"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cds_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          meeting_day: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          meeting_day: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          meeting_day?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cds_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cds_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_current_month_attendance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cds_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_monthly_attendance"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          batch: string | null
          cds_group_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          last_login_at: string | null
          phone_number: string
          profile_photo: string | null
          promoted_to_clo_at: string | null
          role: string
          service_end_date: string | null
          service_start_date: string | null
          service_status: string
          state_code: string
        }
        Insert: {
          batch?: string | null
          cds_group_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          last_login_at?: string | null
          phone_number: string
          profile_photo?: string | null
          promoted_to_clo_at?: string | null
          role?: string
          service_end_date?: string | null
          service_start_date?: string | null
          service_status?: string
          state_code: string
        }
        Update: {
          batch?: string | null
          cds_group_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          phone_number?: string
          profile_photo?: string | null
          promoted_to_clo_at?: string | null
          role?: string
          service_end_date?: string | null
          service_start_date?: string | null
          service_status?: string
          state_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "cds_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_attendance"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_current_month_attendance: {
        Row: {
          absent_count: number | null
          attendance_pct: number | null
          batch: string | null
          cds_group_id: string | null
          cleared: boolean | null
          excused_count: number | null
          full_name: string | null
          group_name: string | null
          month_key: string | null
          month_label: string | null
          present_count: number | null
          service_status: string | null
          sessions_held: number | null
          state_code: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "cds_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      v_group_attendance: {
        Row: {
          avg_attendance_pct: number | null
          current_month_sessions: number | null
          id: string | null
          meeting_day: string | null
          member_count: number | null
          name: string | null
          total_sessions: number | null
        }
        Relationships: []
      }
      v_monthly_attendance: {
        Row: {
          absent_count: number | null
          attendance_pct: number | null
          batch: string | null
          cds_group_id: string | null
          cleared: boolean | null
          excused_count: number | null
          full_name: string | null
          group_name: string | null
          month_key: string | null
          month_label: string | null
          present_count: number | null
          service_status: string | null
          sessions_held: number | null
          state_code: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "cds_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_cds_group_id_fkey"
            columns: ["cds_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_attendance"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      demote_from_clo: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: undefined
      }
      flag_suspicious_records: { Args: never; Returns: number }
      get_user_role: { Args: never; Returns: string }
      pass_out_batch: { Args: { p_batch: string }; Returns: number }
      promote_to_clo: { Args: { p_user_id: string }; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
