import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  DEFAULT_COLORS,
  DEFAULT_COPY,
  getDefaultClubConfig,
  mergeDeep,
  type ClubConfig
} from "@/lib/club-branding";

const BRANDING_BUCKET = "club-branding";

type ClubSettingsRow = {
  logo_path: string | null;
  colors: unknown;
  copy: unknown;
};

export async function getClubConfig(): Promise<ClubConfig> {
  noStore();

  if (!isSupabaseConfigured()) {
    return getDefaultClubConfig();
  }

  try {
    const supabase = await createClient();
    const { data: clubs } = await supabase
      .from("clubs")
      .select("id,slug,name")
      .eq("is_active", true)
      .order("created_at")
      .limit(1);

    const club = clubs?.[0];

    if (!club) {
      return getDefaultClubConfig();
    }

    const { data: settings } = await supabase
      .from("club_settings")
      .select("logo_path,colors,copy")
      .eq("club_id", club.id)
      .maybeSingle();

    const typedSettings = settings as ClubSettingsRow | null;
    const logoPath = typedSettings?.logo_path ?? null;

    const logoUrl =
      logoPath ? supabase.storage.from(BRANDING_BUCKET).getPublicUrl(logoPath).data.publicUrl : null;

    return {
      clubId: club.id,
      slug: club.slug,
      clubName: club.name,
      logoPath,
      logoUrl,
      colors: mergeDeep(DEFAULT_COLORS, typedSettings?.colors),
      copy: mergeDeep(DEFAULT_COPY, typedSettings?.copy)
    };
  } catch {
    return getDefaultClubConfig();
  }
}

export function getClubBrandingBucket() {
  return BRANDING_BUCKET;
}
