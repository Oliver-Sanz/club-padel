import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/supabase/database.types";
import { getRequiredSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getRequiredSupabaseEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
