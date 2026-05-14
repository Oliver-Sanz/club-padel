import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  DEFAULT_COLORS,
  getDefaultClubConfig,
  getCopyForLocale,
  mergeDeep,
  normalizeLocalizedCopy,
  type ClubConfig
} from "@/lib/club-branding";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

const BRANDING_BUCKET = "club-branding";

type ClubSettingsRow = {
  logo_path: string | null;
  logo_full_path?: string | null;
  colors: unknown;
  copy: unknown;
};

export async function getClubConfig(): Promise<ClubConfig> {
  noStore();
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  if (!isSupabaseConfigured()) {
    return getDefaultClubConfig(locale);
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
      return getDefaultClubConfig(locale);
    }

    const { data: settings } = await supabase
      .from("club_settings")
      .select("*")
      .eq("club_id", club.id)
      .maybeSingle();

    const typedSettings = settings as ClubSettingsRow | null;
    const logoPath = typedSettings?.logo_path ?? null;
    const localizedCopy = normalizeLocalizedCopy(typedSettings?.copy);
    const mergedCopy = getCopyForLocale(localizedCopy, locale);
    const fullLogoPath =
      typedSettings?.logo_full_path ?? mergedCopy.system.fullLogoPathFallback ?? null;

    const logoUrl =
      logoPath ? supabase.storage.from(BRANDING_BUCKET).getPublicUrl(logoPath).data.publicUrl : null;
    const fullLogoUrl = fullLogoPath
      ? supabase.storage.from(BRANDING_BUCKET).getPublicUrl(fullLogoPath).data.publicUrl
      : null;

    return {
      clubId: club.id,
      slug: club.slug,
      locale,
      clubName: club.name,
      logoPath,
      logoUrl,
      fullLogoPath,
      fullLogoUrl,
      colors: mergeDeep(DEFAULT_COLORS, typedSettings?.colors),
      copy: mergedCopy,
      localizedCopy
    };
  } catch {
    return getDefaultClubConfig(locale);
  }
}

export function getClubBrandingBucket() {
  return BRANDING_BUCKET;
}
