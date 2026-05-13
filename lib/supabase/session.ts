import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSafeUser(client: SupabaseClient) {
  try {
    const {
      data: { user }
    } = await client.auth.getUser();

    return user ?? null;
  } catch {
    return null;
  }
}
