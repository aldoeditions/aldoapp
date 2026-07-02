/**
 * Types de la base Supabase « Aldo Éditions ».
 *
 * Reconstitués fidèlement depuis le schéma exposé par l'API REST (OpenAPI).
 * Structure conforme à ce qu'attend supabase-js (Row/Insert/Update + Relationships).
 * À regénérer après toute migration via :
 *   npx supabase gen types typescript --project-id exdrjewvotwibqelogns > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* ------------------------------------------------------------------ */
/* Enums métier (valeurs applicatives des colonnes texte)              */
/* ------------------------------------------------------------------ */

export type ArtistPhase = "prospect" | "suivi" | "actif" | "inactif";
export type OeuvreFormat = "A3" | "A4";

export type Database = {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          instagram: string | null;
          portfolio_url: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          avatar_url: string | null;
          bio: string | null;
          type: string | null;
          style: string | null;
          renommee: string | null;
          phase: ArtistPhase;
          pipe_status: string | null;
          contacted_by: string | null;
          first_contact_date: string | null;
          first_contact_info: string | null;
          kit_impression: string | null;
          visuels: string | null;
          demande_infos: string | null;
          contrat_status: string | null;
          commission_pct: number | null;
          drive_link: string | null;
          dans_le_pipe: boolean | null;
          user_id: string | null;
          iban: string | null;
          bic: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          instagram?: string | null;
          portfolio_url?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          type?: string | null;
          style?: string | null;
          renommee?: string | null;
          phase: ArtistPhase;
          user_id?: string | null;
          iban?: string | null;
          bic?: string | null;
          pipe_status?: string | null;
          contacted_by?: string | null;
          first_contact_date?: string | null;
          first_contact_info?: string | null;
          kit_impression?: string | null;
          visuels?: string | null;
          demande_infos?: string | null;
          contrat_status?: string | null;
          commission_pct?: number | null;
          drive_link?: string | null;
          dans_le_pipe?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["artists"]["Insert"]>;
        Relationships: [];
      };
      drops: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          name: string;
          status: string;
          start_date: string;
          end_date: string;
          objectif_ca: number | null;
          notes: string | null;
          date_impression_1: string | null;
          date_impression_2: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          name: string;
          status: string;
          start_date: string;
          end_date: string;
          objectif_ca?: number | null;
          notes?: string | null;
          date_impression_1?: string | null;
          date_impression_2?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["drops"]["Insert"]>;
        Relationships: [];
      };
      oeuvres: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          name: string;
          format: OeuvreFormat;
          artist_id: string;
          drop_id: string | null;
          price: number;
          cout_impression: number | null;
          cout_packaging: number | null;
          nb_ventes: number | null;
          ca_brut: number | null;
          file_url: string | null;
          file_status: string | null;
          status: string;
          shopify_product_id: string | null;
          shopify_variant_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          name: string;
          format: OeuvreFormat;
          artist_id: string;
          drop_id?: string | null;
          price: number;
          cout_impression?: number | null;
          cout_packaging?: number | null;
          nb_ventes?: number | null;
          ca_brut?: number | null;
          file_url?: string | null;
          file_status?: string | null;
          status: string;
          shopify_product_id?: string | null;
          shopify_variant_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["oeuvres"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          shopify_order_id: string | null;
          order_number: string;
          client_name: string;
          client_email: string | null;
          client_address: string | null;
          total_amount: number;
          status: string;
          wave: string | null;
          tracking_number: string | null;
          shipped_at: string | null;
          drop_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          shopify_order_id?: string | null;
          order_number: string;
          client_name: string;
          client_email?: string | null;
          client_address?: string | null;
          total_amount: number;
          status: string;
          wave?: string | null;
          tracking_number?: string | null;
          shipped_at?: string | null;
          drop_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          oeuvre_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          oeuvre_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      params: {
        Row: {
          id: string;
          updated_at: string | null;
          name: string;
          type: string;
          format: string;
          prix_vente: number | null;
          valeur: number;
          details: Json | null;
        };
        Insert: {
          id?: string;
          updated_at?: string | null;
          name: string;
          type: string;
          format: string;
          prix_vente?: number | null;
          valeur: number;
          details?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["params"]["Insert"]>;
        Relationships: [];
      };
      charges: {
        Row: {
          id: string;
          created_at: string | null;
          name: string;
          type: string;
          montant: number;
          categorie: string;
          drop_id: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          name: string;
          type: string;
          montant: number;
          categorie: string;
          drop_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["charges"]["Insert"]>;
        Relationships: [];
      };
      artist_files: {
        Row: {
          id: string;
          created_at: string | null;
          artist_id: string;
          oeuvre_id: string | null;
          filename: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          resolution: string | null;
          status: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_note: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          artist_id: string;
          oeuvre_id?: string | null;
          filename: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          resolution?: string | null;
          status: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["artist_files"]["Insert"]>;
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          created_at: string | null;
          artist_id: string;
          file_path: string | null;
          status: string;
          sent_at: string | null;
          signed_at: string | null;
          commission_pct: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          artist_id: string;
          file_path?: string | null;
          status: string;
          sent_at?: string | null;
          signed_at?: string | null;
          commission_pct?: number | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contracts"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          created_at: string | null;
          artist_id: string;
          drop_id: string | null;
          amount: number;
          status: string;
          paid_at: string | null;
          payment_method: string | null;
          reference: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          artist_id: string;
          drop_id?: string | null;
          amount: number;
          status: string;
          paid_at?: string | null;
          payment_method?: string | null;
          reference?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          created_at: string | null;
          email: string;
          name: string | null;
          role: string;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string | null;
          email: string;
          name?: string | null;
          role?: string;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      drop_pnl: {
        Row: {
          id: string | null;
          name: string | null;
          status: string | null;
          start_date: string | null;
          end_date: string | null;
          objectif_ca: number | null;
          ca_brut: number | null;
          nb_ventes: number | null;
          total_commissions: number | null;
          total_impression: number | null;
          total_packaging: number | null;
          total_charges: number | null;
          resultat_net: number | null;
        };
        Relationships: [];
      };
      artists_with_stats: {
        Row: {
          id: string | null;
          created_at: string | null;
          updated_at: string | null;
          name: string | null;
          email: string | null;
          phone: string | null;
          instagram: string | null;
          portfolio_url: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          avatar_url: string | null;
          bio: string | null;
          type: string | null;
          style: string | null;
          renommee: string | null;
          phase: ArtistPhase | null;
          pipe_status: string | null;
          contacted_by: string | null;
          first_contact_date: string | null;
          first_contact_info: string | null;
          kit_impression: string | null;
          visuels: string | null;
          demande_infos: string | null;
          contrat_status: string | null;
          commission_pct: number | null;
          drive_link: string | null;
          dans_le_pipe: boolean | null;
          user_id: string | null;
          iban: string | null;
          bic: string | null;
          nb_oeuvres: number | null;
          total_ventes: number | null;
          total_ca: number | null;
          total_remuneration: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/* ------------------------------------------------------------------ */
/* Helpers d'accès rapides                                             */
/* ------------------------------------------------------------------ */

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];

// Raccourcis métier
export type Artist = Tables<"artists">;
export type ArtistWithStats = Views<"artists_with_stats">;
export type Drop = Tables<"drops">;
export type DropPnl = Views<"drop_pnl">;
export type Oeuvre = Tables<"oeuvres">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Param = Tables<"params">;
export type Charge = Tables<"charges">;
export type ArtistFile = Tables<"artist_files">;
export type Contract = Tables<"contracts">;
export type Payment = Tables<"payments">;
export type Profile = Tables<"profiles">;
