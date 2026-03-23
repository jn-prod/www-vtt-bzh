export type { SupabaseClient } from '@supabase/supabase-js';

export type Filter = { column: string; operator: string; value: unknown };

export type FilterOption = {
  limit: number;
  offset: number;
  order: { column: string; ascending: boolean };
};

export interface SupabaseConfig {
  key: string;
  url: string;
  table: string;
}
