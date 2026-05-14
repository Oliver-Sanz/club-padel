import { NextResponse } from "next/server";
import { type ClubCopy, type ClubThemeColors } from "@/lib/club-branding";
import { getClubBrandingBucket, getClubConfig } from "@/lib/club-config";
import { isSuperAdminRole } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type ClubSettingsPayload = {
  clubName: string;
  colors: ClubThemeColors;
  copy: ClubCopy;
  logoPath: string | null;
  fullLogoPath: string | null;
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isClubThemeColors(value: unknown): value is ClubThemeColors {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return [
    "background",
    "foreground",
    "accent",
    "grey",
    "ink",
    "panel",
    "mist",
    "line"
  ].every((key) => isString(candidate[key]));
}

function isClubCopy(value: unknown): value is ClubCopy {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Boolean(candidate.home && candidate.auth && candidate.booking && candidate.admin && candidate.player && candidate.system);
}

function getStringFormDataValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCopyWithFullLogoFallback(copy: ClubCopy, fullLogoPath: string | null): ClubCopy {
  if (!fullLogoPath) {
    return copy;
  }

  return {
    ...copy,
    system: {
      ...copy.system,
      fullLogoPathFallback: fullLogoPath
    }
  };
}

async function uploadBrandingAsset(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubSlug: string,
  file: File
) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "png";
  const safeName = sanitizeFileName(file.name) || "logo";
  const path = `${clubSlug}/${Date.now()}-${safeName}.${extension ?? "png"}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(getClubBrandingBucket())
    .upload(path, bytes, {
      contentType: file.type || "image/png",
      upsert: true
    });

  if (uploadError) {
    return { path: null, error: "No se pudo subir la imagen." } as const;
  }

  return { path, error: null } as const;
}

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Inicia sesion como super admin." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isSuperAdminRole(profile?.role)) {
    return { error: NextResponse.json({ error: "No tienes permisos de super admin." }, { status: 403 }) };
  }

  return { supabase, user };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: await getClubConfig() });
  }

  const result = await requireSuperAdmin();
  if ("error" in result) {
    return result.error;
  }

  const settings = await getClubConfig();
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase todavia no esta configurado." },
      { status: 400 }
    );
  }

  const auth = await requireSuperAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  const { supabase } = auth;
  const formData = await request.formData();
  const payloadRaw = formData.get("payload");

  if (!isString(payloadRaw)) {
    return NextResponse.json({ error: "No hemos recibido la configuracion." }, { status: 400 });
  }

  let payload: ClubSettingsPayload;

  try {
    payload = JSON.parse(payloadRaw) as ClubSettingsPayload;
  } catch {
    return NextResponse.json({ error: "La configuracion no tiene un formato valido." }, { status: 400 });
  }

  if (!isString(payload.clubName) || !payload.clubName.trim()) {
    return NextResponse.json({ error: "El nombre del club es obligatorio." }, { status: 400 });
  }

  if (!isClubThemeColors(payload.colors)) {
    return NextResponse.json({ error: "Los colores no tienen un formato valido." }, { status: 400 });
  }

  if (!isClubCopy(payload.copy)) {
    return NextResponse.json({ error: "Los textos no tienen un formato valido." }, { status: 400 });
  }

  const clubSlug = "default";
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .upsert(
      {
        slug: clubSlug,
        name: payload.clubName.trim(),
        is_active: true
      },
      { onConflict: "slug" }
    )
    .select("id,slug,name")
    .single();

  if (clubError || !club) {
    return NextResponse.json(
      { error: "No se pudo guardar el club." },
      { status: 500 }
    );
  }

  let logoPath = payload.logoPath;
  let fullLogoPath = payload.fullLogoPath;
  const logo = formData.get("logo");
  const fullLogo = formData.get("fullLogo");

  if (logo instanceof File && logo.size > 0) {
    const uploaded = await uploadBrandingAsset(supabase, club.slug, logo);
    if (!uploaded.path) {
      return NextResponse.json(
        { error: uploaded.error },
        { status: 500 }
      );
    }
    logoPath = uploaded.path;
  }

  if (fullLogo instanceof File && fullLogo.size > 0) {
    const uploaded = await uploadBrandingAsset(supabase, club.slug, fullLogo);
    if (!uploaded.path) {
      return NextResponse.json(
        { error: uploaded.error },
        { status: 500 }
      );
    }
    fullLogoPath = uploaded.path;
  }

  const upsertPayload: {
    club_id: string;
    colors: ClubThemeColors;
    copy: ClubCopy;
    logo_path: string | null;
    updated_at: string;
    logo_full_path?: string | null;
  } = {
    club_id: club.id,
    colors: payload.colors,
    copy: getCopyWithFullLogoFallback(payload.copy, fullLogoPath),
    logo_path: logoPath,
    updated_at: new Date().toISOString()
  };

  if (fullLogoPath !== null || (fullLogo instanceof File && fullLogo.size > 0)) {
    upsertPayload.logo_full_path = fullLogoPath;
  }

  let { error: settingsError } = await supabase
    .from("club_settings")
    .upsert(upsertPayload, { onConflict: "club_id" });

  if (settingsError && "logo_full_path" in upsertPayload) {
    delete upsertPayload.logo_full_path;
    const retryResult = await supabase
      .from("club_settings")
      .upsert(upsertPayload, { onConflict: "club_id" });
    settingsError = retryResult.error;
  }

  if (settingsError) {
    console.error("club_settings upsert failed", settingsError);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `No se pudo guardar la configuracion del club: ${settingsError.message}`
            : "No se pudo guardar la configuracion del club."
      },
      { status: 500 }
    );
  }

  const updatedConfig = await getClubConfig();

  return NextResponse.json({ settings: updatedConfig });
}
