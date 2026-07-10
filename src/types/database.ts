export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string;
          end_at: string;
          id: string;
          player_id: string;
          price_per_slot: number;
          slot_count: number;
          start_at: string;
          status: string;
          total_price: number;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          end_at: string;
          id?: string;
          player_id: string;
          price_per_slot: number;
          slot_count: number;
          start_at: string;
          status: string;
          total_price: number;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          end_at?: string;
          id?: string;
          player_id?: string;
          price_per_slot?: number;
          slot_count?: number;
          start_at?: string;
          status?: string;
          total_price?: number;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      cities: {
        Row: {
          country_id: string;
          created_at: string;
          id: string;
          name_en: string;
          name_sr: string;
        };
        Insert: {
          country_id: string;
          created_at?: string;
          id?: string;
          name_en: string;
          name_sr: string;
        };
        Update: {
          country_id?: string;
          created_at?: string;
          id?: string;
          name_en?: string;
          name_sr?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "countries";
            referencedColumns: ["id"];
          },
        ];
      };
      countries: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          name_en: string;
          name_sr: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          name_en: string;
          name_sr: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          name_en?: string;
          name_sr?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          metadata: Json | null;
          read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          metadata?: Json | null;
          read?: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          metadata?: Json | null;
          read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string | null;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          role: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      slot_locks: {
        Row: {
          created_at: string;
          end_at: string;
          expires_at: string;
          id: string;
          locked_by: string;
          start_at: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          end_at: string;
          expires_at: string;
          id?: string;
          locked_by: string;
          start_at: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          end_at?: string;
          expires_at?: string;
          id?: string;
          locked_by?: string;
          start_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slot_locks_locked_by_fkey";
            columns: ["locked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slot_locks_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      venue_working_hours: {
        Row: {
          closes_at: string | null;
          day_of_week: number;
          id: string;
          is_closed: boolean;
          opens_at: string | null;
          venue_id: string;
        };
        Insert: {
          closes_at?: string | null;
          day_of_week: number;
          id?: string;
          is_closed?: boolean;
          opens_at?: string | null;
          venue_id: string;
        };
        Update: {
          closes_at?: string | null;
          day_of_week?: number;
          id?: string;
          is_closed?: boolean;
          opens_at?: string | null;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venue_working_hours_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          address: string | null;
          city_id: string;
          company_name: string;
          confirmation_mode: string;
          created_at: string;
          currency: string;
          host_id: string;
          id: string;
          lat: number;
          lng: number;
          max_consecutive_slots: number;
          price_per_slot: number;
          slot_duration_minutes: number;
          slug: string;
          status: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city_id: string;
          company_name: string;
          confirmation_mode: string;
          created_at?: string;
          currency?: string;
          host_id: string;
          id?: string;
          lat: number;
          lng: number;
          max_consecutive_slots?: number;
          price_per_slot: number;
          slot_duration_minutes: number;
          slug: string;
          status?: string;
          timezone: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city_id?: string;
          company_name?: string;
          confirmation_mode?: string;
          created_at?: string;
          currency?: string;
          host_id?: string;
          id?: string;
          lat?: number;
          lng?: number;
          max_consecutive_slots?: number;
          price_per_slot?: number;
          slot_duration_minutes?: number;
          slug?: string;
          status?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venues_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_expired_slot_locks: { Args: never; Returns: undefined };
      create_notification: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_title: string;
          p_message: string;
          p_metadata?: Record<string, unknown> | null;
        };
        Returns: string;
      };
      expire_pending_bookings: { Args: never; Returns: string[] };
      generate_venue_slug: {
        Args: { p_city_id: string; p_company_name: string };
        Returns: string;
      };
      get_my_role: { Args: never; Returns: string };
      is_venue_owner: { Args: { p_venue_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
