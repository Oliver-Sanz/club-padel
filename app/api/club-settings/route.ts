import { NextResponse } from "next/server";
import { type ClubCopy, type ClubThemeColors } from "@/lib/club-branding";
import { getClubBrandingBucket, getClubConfig } from "@/lib/club-config";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type ClubSettingsPayload = {
  clubName: string;
  colors: ClubThemeColors;
  copy: ClubCopy;
  logoPath: string | null;
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

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Inicia sesion como admin." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "No tienes permisos de admin." }, { status: 403 }) };
  }

  return { supabase, user };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: await getClubConfig() });
  }

  const result = await requireAdmin();
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

  const auth = await requireAdmin();
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
  const logo = formData.get("logo");

  if (logo instanceof File && logo.size > 0) {
    const extension = logo.name.includes(".") ? logo.name.split(".").pop()?.toLowerCase() : "png";
    const safeName = sanitizeFileName(logo.name) || "logo";
    const path = `${club.slug}/${Date.now()}-${safeName}.${extension ?? "png"}`;
    const bytes = new Uint8Array(await logo.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(getClubBrandingBucket())
      .upload(path, bytes, {
        contentType: logo.type || "image/png",
        upsert: true
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "No se pudo subir el logo." },
        { status: 500 }
      );
    }

    logoPath = path;
  }

  const { error: settingsError } = await supabase.from("club_settings").upsert(
    {
      club_id: club.id,
      colors: payload.colors,
      copy: payload.copy,
      logo_path: logoPath,
      updated_at: new Date().toISOString()
    },
    { onConflict: "club_id" }
  );

  if (settingsError) {
    return NextResponse.json(
      { error: "No se pudo guardar la configuracion del club." },
      { status: 500 }
    );
  }

  const updatedConfig = await getClubConfig();

  return NextResponse.json({ settings: updatedConfig });
}
