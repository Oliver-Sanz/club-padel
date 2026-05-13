"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { type ClubConfig, type ClubCopy, type ClubThemeColors, getClubThemeStyle } from "@/lib/club-branding";
import { ClubLogo } from "@/components/club-logo";

type ClubSettingsFormProps = {
  config: ClubConfig;
};

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  as?: "input" | "textarea";
};

function TextField({ label, value, onChange, placeholder, as = "input" }: TextFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-black text-court-cyan">
      <span>{label}</span>
      {as === "textarea" ? (
        <textarea
          className="min-h-24 rounded-2xl border border-court-cyan bg-court-ink px-4 py-3 text-white outline-none focus:border-court-ball"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <input
          className="rounded-2xl border border-court-cyan bg-court-ink px-4 py-3 text-white outline-none focus:border-court-ball"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      )}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-court-cyan">
      <span>{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-court-cyan bg-court-ink px-4 py-3">
        <input
          className="h-10 w-14 cursor-pointer rounded-xl border-0 bg-transparent p-0"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
        <input
          className="w-full bg-transparent text-white outline-none"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </div>
    </label>
  );
}

function SettingsBlock({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-court-cyan bg-court-panel p-4 shadow-soft md:p-5">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-court-ball">{title}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-court-cyan">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function ClubSettingsForm({ config }: ClubSettingsFormProps) {
  const router = useRouter();
  const [clubName, setClubName] = useState(config.clubName);
  const [colors, setColors] = useState<ClubThemeColors>(config.colors);
  const [copy, setCopy] = useState<ClubCopy>(config.copy);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(config.logoUrl);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const previewStyle = useMemo(() => getClubThemeStyle(colors), [colors]);

  function updateCopySection<
    TSection extends keyof ClubCopy,
    TField extends keyof ClubCopy[TSection]
  >(section: TSection, field: TField, value: string) {
    setCopy((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value
      }
    }));
  }

  async function saveSettings() {
    setIsSaving(true);
    setMessage("Guardando configuracion...");

    try {
      const payload = {
        clubName,
        colors,
        copy,
        logoPath: config.logoPath
      };

      const formData = new FormData();
      formData.set("payload", JSON.stringify(payload));
      if (logoFile) {
        formData.set("logo", logoFile);
      }

      const response = await fetch("/api/club-settings", {
        method: "POST",
        body: formData
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? "No se pudo guardar la configuracion.");
        return;
      }

      setMessage("Configuracion guardada. Recargando vista...");
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <SettingsBlock
          description="Nombre del club, logo y colores principales."
          title="Branding"
        >
          <TextField label="Nombre del club" onChange={setClubName} value={clubName} />

          <label className="grid gap-2 text-sm font-black text-court-cyan">
            <span>Logo del club</span>
            <input
              className="rounded-2xl border border-court-cyan bg-court-ink px-4 py-3 text-white outline-none focus:border-court-ball"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setLogoFile(file);
                if (logoPreviewUrl?.startsWith("blob:")) {
                  URL.revokeObjectURL(logoPreviewUrl);
                }
                setLogoPreviewUrl(file ? URL.createObjectURL(file) : config.logoUrl);
              }}
              type="file"
              accept="image/*"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <ColorField label="Fondo" onChange={(value) => setColors((current) => ({ ...current, background: value }))} value={colors.background} />
            <ColorField label="Texto principal" onChange={(value) => setColors((current) => ({ ...current, foreground: value }))} value={colors.foreground} />
            <ColorField label="Acento" onChange={(value) => setColors((current) => ({ ...current, accent: value }))} value={colors.accent} />
            <ColorField label="Gris de apoyo" onChange={(value) => setColors((current) => ({ ...current, grey: value }))} value={colors.grey} />
            <ColorField label="Interior" onChange={(value) => setColors((current) => ({ ...current, ink: value }))} value={colors.ink} />
            <ColorField label="Panel" onChange={(value) => setColors((current) => ({ ...current, panel: value }))} value={colors.panel} />
          </div>
        </SettingsBlock>

        <SettingsBlock
          description="Textos que ven los usuarios al entrar en la portada."
          title="Home"
        >
          <TextField label="Texto pequeno" onChange={(value) => updateCopySection("home", "eyebrow", value)} value={copy.home.eyebrow} />
          <TextField label="Titulo" onChange={(value) => updateCopySection("home", "title", value)} value={copy.home.title} />
          <TextField label="Descripcion" as="textarea" onChange={(value) => updateCopySection("home", "subtitle", value)} value={copy.home.subtitle} />
        </SettingsBlock>

        <SettingsBlock
          description="Cabeceras y ayudas de login, reservas, admin y espacio del jugador."
          title="Textos"
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="grid gap-4">
              <TextField label="Login - texto pequeno" onChange={(value) => updateCopySection("auth", "eyebrow", value)} value={copy.auth.eyebrow} />
              <TextField label="Login - titulo" onChange={(value) => updateCopySection("auth", "title", value)} value={copy.auth.title} />
              <TextField label="Login - descripcion" as="textarea" onChange={(value) => updateCopySection("auth", "subtitle", value)} value={copy.auth.subtitle} />
              <TextField label="Boton Google" onChange={(value) => updateCopySection("auth", "googleButton", value)} value={copy.auth.googleButton} />
              <TextField label="Boton email" onChange={(value) => updateCopySection("auth", "emailButton", value)} value={copy.auth.emailButton} />
              <TextField label="Ayuda login" as="textarea" onChange={(value) => updateCopySection("auth", "helper", value)} value={copy.auth.helper} />
            </div>

            <div className="grid gap-4">
              <TextField label="Reservas - texto pequeno" onChange={(value) => updateCopySection("booking", "eyebrow", value)} value={copy.booking.eyebrow} />
              <TextField label="Reservas - titulo" onChange={(value) => updateCopySection("booking", "title", value)} value={copy.booking.title} />
              <TextField label="Reservas - descripcion" as="textarea" onChange={(value) => updateCopySection("booking", "subtitle", value)} value={copy.booking.subtitle} />
              <TextField label="Boton principal" onChange={(value) => updateCopySection("booking", "buttonLabel", value)} value={copy.booking.buttonLabel} />
              <TextField label="Etiqueta hold" onChange={(value) => updateCopySection("booking", "activeHoldLabel", value)} value={copy.booking.activeHoldLabel} />
              <TextField label="Mensaje hold" as="textarea" onChange={(value) => updateCopySection("booking", "holdSuccess", value)} value={copy.booking.holdSuccess} />
              <TextField label="Leyenda libre" onChange={(value) => updateCopySection("booking", "legendAvailable", value)} value={copy.booking.legendAvailable} />
              <TextField label="Leyenda ocupado" onChange={(value) => updateCopySection("booking", "legendBooked", value)} value={copy.booking.legendBooked} />
              <TextField label="Leyenda bloqueado" onChange={(value) => updateCopySection("booking", "legendBlocked", value)} value={copy.booking.legendBlocked} />
              <TextField label="Leyenda en proceso" onChange={(value) => updateCopySection("booking", "legendInProgress", value)} value={copy.booking.legendInProgress} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="grid gap-4">
              <TextField label="Admin - titulo" onChange={(value) => updateCopySection("admin", "title", value)} value={copy.admin.title} />
              <TextField label="Admin - descripcion" as="textarea" onChange={(value) => updateCopySection("admin", "subtitle", value)} value={copy.admin.subtitle} />
              <TextField label="Admin - boton volver" onChange={(value) => updateCopySection("admin", "backButton", value)} value={copy.admin.backButton} />
              <TextField label="Admin - titulo branding" onChange={(value) => updateCopySection("admin", "settingsTitle", value)} value={copy.admin.settingsTitle} />
              <TextField label="Admin - texto branding" as="textarea" onChange={(value) => updateCopySection("admin", "settingsSubtitle", value)} value={copy.admin.settingsSubtitle} />
              <TextField label="Admin - titulo manual" onChange={(value) => updateCopySection("admin", "manualTitle", value)} value={copy.admin.manualTitle} />
              <TextField label="Admin - texto manual" as="textarea" onChange={(value) => updateCopySection("admin", "manualSubtitle", value)} value={copy.admin.manualSubtitle} />
            </div>

            <div className="grid gap-4">
              <TextField label="Jugador - titulo" onChange={(value) => updateCopySection("player", "title", value)} value={copy.player.title} />
              <TextField label="Jugador - descripcion" as="textarea" onChange={(value) => updateCopySection("player", "subtitle", value)} value={copy.player.subtitle} />
              <TextField label="Jugador - reservas futuras" onChange={(value) => updateCopySection("player", "upcomingTitle", value)} value={copy.player.upcomingTitle} />
              <TextField label="Jugador - historial" onChange={(value) => updateCopySection("player", "historyTitle", value)} value={copy.player.historyTitle} />
              <TextField label="Jugador - sin reservas" onChange={(value) => updateCopySection("player", "emptyUpcoming", value)} value={copy.player.emptyUpcoming} />
              <TextField label="Jugador - sin historial" onChange={(value) => updateCopySection("player", "emptyHistory", value)} value={copy.player.emptyHistory} />
            </div>
          </div>
        </SettingsBlock>

        <SettingsBlock
          description="Mensajes de soporte y estados generales de la app."
          title="Sistema"
        >
          <TextField
            label="Supabase no configurado"
            onChange={(value) => updateCopySection("auth", "missingConfig", value)}
            value={copy.auth.missingConfig}
          />
          <TextField
            label="Cargando disponibilidad"
            onChange={(value) => updateCopySection("system", "loadingAvailability", value)}
            value={copy.system.loadingAvailability}
          />
          <TextField
            label="Datos mock"
            onChange={(value) => updateCopySection("system", "dataSourceMock", value)}
            value={copy.system.dataSourceMock}
          />
          <TextField
            label="Datos Supabase"
            onChange={(value) => updateCopySection("system", "dataSourceSupabase", value)}
            value={copy.system.dataSourceSupabase}
          />
          <TextField
            label="Actualizando disponibilidad"
            onChange={(value) => updateCopySection("system", "updatingAvailability", value)}
            value={copy.system.updatingAvailability}
          />
          <TextField
            label="Configuracion faltante"
            as="textarea"
            onChange={(value) => updateCopySection("system", "configurationMissing", value)}
            value={copy.system.configurationMissing}
          />
        </SettingsBlock>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <section className="rounded-[1.75rem] border border-court-ball bg-court-ink p-4 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-court-ball">Vista previa</p>
          <div className="mt-4 rounded-[1.5rem] border border-court-cyan bg-court-panel p-4" style={previewStyle}>
            <div className="mb-3">
              <ClubLogo clubName={clubName} logoUrl={logoPreviewUrl} />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-court-cyan">
              {copy.home.eyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight text-court-ball">
              {copy.home.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-court-cyan">{copy.home.subtitle}</p>
            <div className="mt-4 rounded-2xl border border-court-ball bg-court-ink px-4 py-3 text-sm font-bold text-court-ball">
              {copy.booking.buttonLabel}
            </div>
          </div>
        </section>

        <button
          className="w-full rounded-2xl bg-court-ball px-5 py-4 text-sm font-black text-court-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-court-cyan/20 disabled:text-court-cyan/55"
          disabled={isSaving}
          onClick={() => void saveSettings()}
          type="button"
        >
          {isSaving ? "Guardando..." : "Guardar configuracion"}
        </button>

        {message ? (
          <p className="rounded-2xl border border-court-ball bg-court-ink px-4 py-3 text-sm font-black text-court-ball">
            {message}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
