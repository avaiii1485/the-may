// Mirrors the Supabase schema in supabase.sql.
// Generated equivalent. Run `supabase gen types typescript` in your project to regenerate.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          goal: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          photo_url: string | null;
          text_content: string | null;
          eaten_at: string;
          on_path: boolean;
          note: string | null;
          why_eat: string[];
          feeling: number | null;
          ate_with: string[];
          how_was_it: string | null;
          where_eat: string[];
          how_made: string | null;
          made_me_feel: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_url?: string | null;
          text_content?: string | null;
          eaten_at?: string;
          on_path: boolean;
          note?: string | null;
          why_eat?: string[];
          feeling?: number | null;
          ate_with?: string[];
          how_was_it?: string | null;
          where_eat?: string[];
          how_made?: string | null;
          made_me_feel?: string[];
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['meals']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
