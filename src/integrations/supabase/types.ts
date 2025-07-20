export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          name: string
          type: 'individual' | 'group'
          status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
          created_by: string | null
          created_at: string
          updated_at: string
          scheduled_days: string[] | null
          start_time: string | null
          end_time: string | null
          message_interval: number | null
          start_date: string | null
          total_contacts: number | null
          sent_messages: number | null
          failed_messages: number | null
        }
        Insert: {
          id?: string
          name: string
          type: 'individual' | 'group'
          status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          scheduled_days?: string[] | null
          start_time?: string | null
          end_time?: string | null
          message_interval?: number | null
          start_date?: string | null
          total_contacts?: number | null
          sent_messages?: number | null
          failed_messages?: number | null
        }
        Update: {
          id?: string
          name?: string
          type?: 'individual' | 'group'
          status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          scheduled_days?: string[] | null
          start_time?: string | null
          end_time?: string | null
          message_interval?: number | null
          start_date?: string | null
          total_contacts?: number | null
          sent_messages?: number | null
          failed_messages?: number | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          category: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          category?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          category?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          campaign_id: string
          nome: string
          numero: string
          tag: string
          created_at: string
          status: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          nome: string
          numero: string
          tag: string
          created_at?: string
          status?: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          nome?: string
          numero?: string
          tag?: string
          created_at?: string
          status?: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at?: string | null
          error_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          campaign_id: string
          type: 'text' | 'image' | 'video' | 'audio' | 'document'
          content: string
          order_index: number
          created_at: string
          updated_at: string
          file_name: string | null
          file_size: number | null
          mime_type: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          type: 'text' | 'image' | 'video' | 'audio' | 'document'
          content: string
          order_index?: number
          created_at?: string
          updated_at?: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          type?: 'text' | 'image' | 'video' | 'audio' | 'document'
          content?: string
          order_index?: number
          created_at?: string
          updated_at?: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          }
        ]
      }
      groups: {
        Row: {
          id: string
          whatsapp_group_id: string
          subject: string
          subject_owner: string | null
          subject_time: number | null
          picture_url: string | null
          size: number | null
          creation: number
          owner: string | null
          description: string | null
          desc_id: string | null
          restrict: boolean | null
          announce: boolean | null
          is_community: boolean | null
          is_community_announce: boolean | null
          instance_name: string | null
          last_sync_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          whatsapp_group_id: string
          subject: string
          subject_owner?: string | null
          subject_time?: number | null
          picture_url?: string | null
          size?: number | null
          creation: number
          owner?: string | null
          description?: string | null
          desc_id?: string | null
          restrict?: boolean | null
          announce?: boolean | null
          is_community?: boolean | null
          is_community_announce?: boolean | null
          instance_name?: string | null
          last_sync_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          whatsapp_group_id?: string
          subject?: string
          subject_owner?: string | null
          subject_time?: number | null
          picture_url?: string | null
          size?: number | null
          creation?: number
          owner?: string | null
          description?: string | null
          desc_id?: string | null
          restrict?: boolean | null
          announce?: boolean | null
          is_community?: boolean | null
          is_community_announce?: boolean | null
          instance_name?: string | null
          last_sync_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          id: string
          group_id: string | null
          whatsapp_id: string
          phone_number: string
          admin_role: string | null
          joined_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          group_id?: string | null
          whatsapp_id: string
          phone_number: string
          admin_role?: string | null
          joined_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string | null
          whatsapp_id?: string
          phone_number?: string
          admin_role?: string | null
          joined_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          }
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
