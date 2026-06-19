import { createClient } from "@supabase/supabase-js";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Data access should support the storefront without changing the recreated UI language.
 *
 * Add these values in the project environment when connecting to your Supabase project:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export type StoreProduct = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  category?: string | null;
  stock?: number | null;
};
