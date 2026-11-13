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
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: number
          is_active: boolean
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: never
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: never
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string | null
          body_md: string
          cover_path: string | null
          created_at: string
          excerpt: string | null
          id: number
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body_md?: string
          cover_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: never
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body_md?: string
          cover_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: never
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      gold_price_history: {
        Row: {
          buyback_idr: number
          changed_by: string | null
          effective_at: string
          id: number
          karat_id: number
          sell_idr: number
          store_id: number
        }
        Insert: {
          buyback_idr: number
          changed_by?: string | null
          effective_at?: string
          id?: never
          karat_id: number
          sell_idr: number
          store_id: number
        }
        Update: {
          buyback_idr?: number
          changed_by?: string | null
          effective_at?: string
          id?: never
          karat_id?: number
          sell_idr?: number
          store_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "gold_price_history_karat_id_fkey"
            columns: ["karat_id"]
            isOneToOne: false
            referencedRelation: "karats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gold_price_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      gold_prices: {
        Row: {
          buyback_idr: number
          id: number
          karat_id: number
          sell_idr: number
          store_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          buyback_idr: number
          id?: never
          karat_id: number
          sell_idr: number
          store_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          buyback_idr?: number
          id?: never
          karat_id?: number
          sell_idr?: number
          store_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gold_prices_karat_id_fkey"
            columns: ["karat_id"]
            isOneToOne: false
            referencedRelation: "karats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gold_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      karats: {
        Row: {
          code: string
          created_at: string
          id: number
          is_active: boolean
          label: string
          purity_percent: number | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
          is_active?: boolean
          label: string
          purity_percent?: number | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
          is_active?: boolean
          label?: string
          purity_percent?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          consent: boolean
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: number
          kind: Database["public"]["Enums"]["lead_kind"]
          name: string
          note: string | null
          phone: string
          preferred_date: string | null
          product_id: number | null
          source_path: string | null
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          consent: boolean
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: never
          kind?: Database["public"]["Enums"]["lead_kind"]
          name: string
          note?: string | null
          phone: string
          preferred_date?: string | null
          product_id?: number | null
          source_path?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          consent?: boolean
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: never
          kind?: Database["public"]["Enums"]["lead_kind"]
          name?: string
          note?: string | null
          phone?: string
          preferred_date?: string | null
          product_id?: number | null
          source_path?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: [
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string
          created_at: string
          height: number | null
          id: number
          product_id: number
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          alt?: string
          created_at?: string
          height?: number | null
          id?: never
          product_id: number
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          alt?: string
          created_at?: string
          height?: number | null
          id?: never
          product_id?: number
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: number | null
          created_at: string
          description: string | null
          id: number
          is_demo: boolean
          is_featured: boolean
          karat_id: number
          labour_fee_type: Database["public"]["Enums"]["labour_fee_type"]
          labour_fee_value: number
          model_glb_path: string | null
          model_poster_path: string | null
          model_usdz_path: string | null
          name: string
          occasions: string[]
          price_on_request: boolean
          published_at: string | null
          search: unknown
          size_options: string[]
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          tryon_asset_ref: string | null
          tryon_enabled: boolean
          updated_at: string
          video_url: string | null
          weight_g: number
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: never
          is_demo?: boolean
          is_featured?: boolean
          karat_id: number
          labour_fee_type?: Database["public"]["Enums"]["labour_fee_type"]
          labour_fee_value?: number
          model_glb_path?: string | null
          model_poster_path?: string | null
          model_usdz_path?: string | null
          name: string
          occasions?: string[]
          price_on_request?: boolean
          published_at?: string | null
          search?: unknown
          size_options?: string[]
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          tryon_asset_ref?: string | null
          tryon_enabled?: boolean
          updated_at?: string
          video_url?: string | null
          weight_g: number
        }
        Update: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: never
          is_demo?: boolean
          is_featured?: boolean
          karat_id?: number
          labour_fee_type?: Database["public"]["Enums"]["labour_fee_type"]
          labour_fee_value?: number
          model_glb_path?: string | null
          model_poster_path?: string | null
          model_usdz_path?: string | null
          name?: string
          occasions?: string[]
          price_on_request?: boolean
          published_at?: string | null
          search?: unknown
          size_options?: string[]
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          tryon_asset_ref?: string | null
          tryon_enabled?: boolean
          updated_at?: string
          video_url?: string | null
          weight_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_karat_id_fkey"
            columns: ["karat_id"]
            isOneToOne: false
            referencedRelation: "karats"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          default_labour_fee_type: Database["public"]["Enums"]["labour_fee_type"]
          default_labour_fee_value: number
          demo_mode: boolean
          feature_flags: Json
          id: number
          price_stale_hours: number
          review_card_url: string | null
          rounding_mode: Database["public"]["Enums"]["rounding_mode"]
          rounding_step_idr: number
          timezone: string
          trust_texts: Json
          updated_at: string
        }
        Insert: {
          default_labour_fee_type?: Database["public"]["Enums"]["labour_fee_type"]
          default_labour_fee_value?: number
          demo_mode?: boolean
          feature_flags?: Json
          id?: number
          price_stale_hours?: number
          review_card_url?: string | null
          rounding_mode?: Database["public"]["Enums"]["rounding_mode"]
          rounding_step_idr?: number
          timezone?: string
          trust_texts?: Json
          updated_at?: string
        }
        Update: {
          default_labour_fee_type?: Database["public"]["Enums"]["labour_fee_type"]
          default_labour_fee_value?: number
          demo_mode?: boolean
          feature_flags?: Json
          id?: number
          price_stale_hours?: number
          review_card_url?: string | null
          rounding_mode?: Database["public"]["Enums"]["rounding_mode"]
          rounding_step_idr?: number
          timezone?: string
          trust_texts?: Json
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          google_review_url: string | null
          id: number
          is_primary: boolean
          landmarks: string | null
          latitude: number | null
          longitude: number | null
          maps_url: string | null
          name: string
          opening_hours: Json | null
          phone: string | null
          postal_code: string | null
          province: string | null
          slug: string
          social_links: Json
          tagline: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          google_review_url?: string | null
          id?: never
          is_primary?: boolean
          landmarks?: string | null
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          slug: string
          social_links?: Json
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          google_review_url?: string | null
          id?: never
          is_primary?: boolean
          landmarks?: string | null
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          slug?: string
          social_links?: Json
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: number
          is_published: boolean
          rating: number | null
          source_name: string
          source_url: string
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: never
          is_published?: boolean
          rating?: number | null
          source_name: string
          source_url: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: never
          is_published?: boolean
          rating?: number | null
          source_name?: string
          source_url?: string
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
      admin_role: "owner" | "staff"
      article_status: "draft" | "published"
      labour_fee_type: "per_gram" | "fixed" | "percent"
      lead_kind: "reservation" | "inquiry"
      lead_status: "new" | "contacted" | "done"
      product_status: "draft" | "published" | "sold" | "out_of_stock"
      rounding_mode: "none" | "up" | "nearest"
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

export const Constants = {
  public: {
    Enums: {
      admin_role: ["owner", "staff"],
      article_status: ["draft", "published"],
      labour_fee_type: ["per_gram", "fixed", "percent"],
      lead_kind: ["reservation", "inquiry"],
      lead_status: ["new", "contacted", "done"],
      product_status: ["draft", "published", "sold", "out_of_stock"],
      rounding_mode: ["none", "up", "nearest"],
    },
  },
} as const
