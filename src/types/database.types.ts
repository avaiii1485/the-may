// Mirrors the Option A schema in supabase/migrations/.
// Hand-written; regenerate from a live project with:
//   supabase gen types typescript --project-id <id> > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          preferred_name: string | null;
          handle: string | null;
          avatar_url: string | null;
          bio: string | null;
          phone_number: string | null;
          goal: string | null;
          lang: string;
          prefs: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          preferred_name?: string | null;
          handle?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone_number?: string | null;
          goal?: string | null;
          lang?: string;
          prefs?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          eaten_at: string;
          on_path: boolean;
          note: string | null;
          photo_url: string | null;
          text_content: string | null;
          why_eat: string[];
          feeling: number | null;
          ate_with: string[];
          how_was_it: string | null;
          where_eat: string[];
          how_made: string | null;
          made_me_feel: string[];
          answers: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          eaten_at?: string;
          on_path: boolean;
          note?: string | null;
          photo_url?: string | null;
          text_content?: string | null;
          why_eat?: string[];
          feeling?: number | null;
          ate_with?: string[];
          how_was_it?: string | null;
          where_eat?: string[];
          how_made?: string | null;
          made_me_feel?: string[];
          answers?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['meals']['Insert']>;
      };
      questions: {
        Row: {
          id: string;
          key: string;
          type: string;
          prompt_en: string;
          prompt_fa: string;
          display_order: number;
          active: boolean;
          is_core: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          type: string;
          prompt_en: string;
          prompt_fa: string;
          display_order?: number;
          active?: boolean;
          is_core?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['questions']['Insert']>;
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          value: string;
          label_en: string;
          label_fa: string;
          display_order: number;
          active: boolean;
        };
        Insert: {
          id?: string;
          question_id: string;
          value: string;
          label_en: string;
          label_fa: string;
          display_order?: number;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['question_options']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
