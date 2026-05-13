export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_blocks: {
        Row: {
          id: string;
          court_id: number;
          start_time: string;
          end_time: string;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          court_id: number;
          start_time: string;
          end_time: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_blocks"]["Insert"]>;
        Relationships: [];
      };
      club_settings: {
        Row: {
          club_id: string;
          colors: Json;
          copy: Json;
          logo_path: string | null;
          logo_full_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          club_id: string;
          colors?: Json;
          copy?: Json;
          logo_path?: string | null;
          logo_full_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["club_settings"]["Insert"]>;
        Relationships: [];
      };
      clubs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clubs"]["Insert"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string | null;
          court_id: number;
          start_time: string;
          end_time: string;
          duration_minutes: 60 | 90;
          status: "pending_payment" | "confirmed" | "cancelled" | "expired" | "blocked" | "event";
          price_total_cents: number;
          currency: string;
          price_breakdown: Json;
          payment_id: string | null;
          created_at: string;
          cancelled_at: string | null;
          cancellation_policy_status: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          court_id: number;
          start_time: string;
          end_time: string;
          duration_minutes: 60 | 90;
          status: "pending_payment" | "confirmed" | "cancelled" | "expired" | "blocked" | "event";
          price_total_cents?: number;
          currency?: string;
          price_breakdown?: Json;
          payment_id?: string | null;
          created_at?: string;
          cancelled_at?: string | null;
          cancellation_policy_status?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
      booking_holds: {
        Row: {
          id: string;
          user_id: string;
          court_id: number;
          start_time: string;
          end_time: string;
          expires_at: string;
          status: "active" | "expired" | "converted" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          court_id: number;
          start_time: string;
          end_time: string;
          expires_at: string;
          status?: "active" | "expired" | "converted" | "cancelled";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["booking_holds"]["Insert"]>;
        Relationships: [];
      };
      courts: {
        Row: {
          id: number;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courts"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          name: string;
          event_type: string;
          court_ids: number[];
          start_time: string;
          end_time: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          event_type?: string;
          court_ids: number[];
          start_time: string;
          end_time: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: string;
          status: "pending" | "paid" | "failed" | "expired" | "refunded";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_cents: number;
          currency?: string;
          status?: "pending" | "paid" | "failed" | "expired" | "refunded";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      pricing_rules: {
        Row: {
          id: number;
          day_of_week: number;
          start_time: string;
          end_time: string;
          price_per_30_min_cents: number;
          currency: string;
          label: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          day_of_week: number;
          start_time: string;
          end_time: string;
          price_per_30_min_cents: number;
          currency?: string;
          label: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_rules"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: "user" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: "user" | "admin";
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["profiles"]["Insert"], "id">>;
        Relationships: [];
      };
    };
    Views: {
      availability_items: {
        Row: {
          id: string;
          court_id: number;
          start_time: string;
          end_time: string;
          status: "pending_payment" | "confirmed" | "blocked" | "event";
          label: string;
          expires_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      expire_old_booking_holds: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      booking_status: "pending_payment" | "confirmed" | "cancelled" | "expired" | "blocked" | "event";
      hold_status: "active" | "expired" | "converted" | "cancelled";
      payment_status: "pending" | "paid" | "failed" | "expired" | "refunded";
      profile_role: "user" | "admin";
    };
  };
};
