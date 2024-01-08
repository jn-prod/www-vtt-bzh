import { createClient } from 'repository';

export const dbConnection = createClient(
  import.meta.env.VITE_APP_SUPABASE_URL as string,
  import.meta.env.VITE_APP_SUPABASE_KEY as string
);
