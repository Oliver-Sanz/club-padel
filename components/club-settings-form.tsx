"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  type ClubConfig,
  type ClubCopy,
  type ClubThemeColors,
  type LocalizedClubCopy,
  getClubThemeStyle
} from "@/lib/club-branding";
import { LOCALE_LABELS, SUPPORTED_LOCALES, UI_LABELS, type SupportedLocale } from "@/lib/i18n";
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
    <label className="grid gap-2 type-body-strong text-court-cyan">
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
    <label className="grid gap-2 type-body-strong text-court-cyan">
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
        <p className="type-label text-court-ball">{title}</p>
        <p className="mt-2 type-body text-court-cyan">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function ClubSettingsForm({ config }: ClubSettingsFormProps) {
  const router = useRouter();
  const ui = UI_LABELS[config.locale];
  const [clubName, setClubName] = useState(config.clubName);
  const [colors, setColors] = useState<ClubThemeColors>(config.colors);
  const [localizedCopy, setLocalizedCopy] = useState<LocalizedClubCopy>(config.localizedCopy);
  const [editingLocale, setEditingLocale] = useState<SupportedLocale>(config.locale);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(config.logoUrl);
  const [fullLogoFile, setFullLogoFile] = useState<File | null>(null);
  const [fullLogoPreviewUrl, setFullLogoPreviewUrl] = useState<string | null>(
    config.fullLogoUrl
  );
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const previewStyle = useMemo(() => getClubThemeStyle(colors), [colors]);
  const copy = localizedCopy[editingLocale];

  function updateCopySection<
    TSection extends keyof ClubCopy,
    TField extends keyof ClubCopy[TSection]
  >(section: TSection, field: TField, value: string) {
    setLocalizedCopy((current) => ({
      ...current,
      [editingLocale]: {
        ...current[editingLocale],
        [section]: {
          ...current[editingLocale][section],
          [field]: value
        }
      }
    }));
  }

  async function saveSettings() {
    setIsSaving(true);
    setMessage(ui.savingSettings);

    try {
      const payload = {
        clubName,
        colors,
        copy: localizedCopy,
        logoPath: config.logoPath,
        fullLogoPath: config.fullLogoPath
      };

      const formData = new FormData();
      formData.set("payload", JSON.stringify(payload));
      if (logoFile) {
        formData.set("logo", logoFile);
      }
      if (fullLogoFile) {
        formData.set("fullLogo", fullLogoFile);
      }

      const response = await fetch("/api/club-settings", {
        method: "POST",
        body: formData
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? ui.settingsSaveError);
        return;
      }

      setMessage(ui.settingsSaved);
      router.refresh();
    } catch {
      setMessage(ui.serverError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <SettingsBlock
          description={ui.brandingDescription}
          title="Branding"
        >
          <TextField label={ui.clubName} onChange={setClubName} value={clubName} />

          <label className="grid gap-2 type-body-strong text-court-cyan">
            <span>{ui.isotype}</span>
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

          <label className="grid gap-2 type-body-strong text-court-cyan">
            <span>{ui.fullLogo}</span>
            <input
              className="rounded-2xl border border-court-cyan bg-court-ink px-4 py-3 text-white outline-none focus:border-court-ball"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setFullLogoFile(file);
                if (fullLogoPreviewUrl?.startsWith("blob:")) {
                  URL.revokeObjectURL(fullLogoPreviewUrl);
                }
                setFullLogoPreviewUrl(file ? URL.createObjectURL(file) : config.fullLogoUrl);
              }}
              type="file"
              accept="image/*"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <ColorField label={ui.background} onChange={(value) => setColors((current) => ({ ...current, background: value }))} value={colors.background} />
            <ColorField label={ui.primaryText} onChange={(value) => setColors((current) => ({ ...current, foreground: value }))} value={colors.foreground} />
            <ColorField label={ui.accent} onChange={(value) => setColors((current) => ({ ...current, accent: value }))} value={colors.accent} />
            <ColorField label={ui.supportGrey} onChange={(value) => setColors((current) => ({ ...current, grey: value }))} value={colors.grey} />
            <ColorField label={ui.innerSurface} onChange={(value) => setColors((current) => ({ ...current, ink: value }))} value={colors.ink} />
            <ColorField label={ui.panel} onChange={(value) => setColors((current) => ({ ...current, panel: value }))} value={colors.panel} />
          </div>
        </SettingsBlock>

        <SettingsBlock
          description={ui.homeDescription}
          title="Home"
        >
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                className={[
                  "rounded-2xl border px-4 py-2 type-button transition",
                  editingLocale === locale
                    ? "border-court-ball bg-court-ball text-court-ink shadow-glow"
                    : "border-court-cyan text-court-cyan hover:border-court-ball hover:text-court-ball"
                ].join(" ")}
                key={locale}
                onClick={() => setEditingLocale(locale)}
                type="button"
              >
                {LOCALE_LABELS[locale]}
              </button>
            ))}
          </div>
          <TextField label="Eyebrow" onChange={(value) => updateCopySection("home", "eyebrow", value)} value={copy.home.eyebrow} />
          <TextField label="Title" onChange={(value) => updateCopySection("home", "title", value)} value={copy.home.title} />
          <TextField label="Description" as="textarea" onChange={(value) => updateCopySection("home", "subtitle", value)} value={copy.home.subtitle} />
        </SettingsBlock>

        <SettingsBlock
          description={ui.copyDescription}
          title={ui.copyTitle}
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="grid gap-4">
              <TextField label="Login - eyebrow" onChange={(value) => updateCopySection("auth", "eyebrow", value)} value={copy.auth.eyebrow} />
              <TextField label="Login - title" onChange={(value) => updateCopySection("auth", "title", value)} value={copy.auth.title} />
              <TextField label="Login - description" as="textarea" onChange={(value) => updateCopySection("auth", "subtitle", value)} value={copy.auth.subtitle} />
              <TextField label="Google button" onChange={(value) => updateCopySection("auth", "googleButton", value)} value={copy.auth.googleButton} />
              <TextField label="Email button" onChange={(value) => updateCopySection("auth", "emailButton", value)} value={copy.auth.emailButton} />
              <TextField label="Login helper" as="textarea" onChange={(value) => updateCopySection("auth", "helper", value)} value={copy.auth.helper} />
            </div>

            <div className="grid gap-4">
              <TextField label="Booking - eyebrow" onChange={(value) => updateCopySection("booking", "eyebrow", value)} value={copy.booking.eyebrow} />
              <TextField label="Booking - title" onChange={(value) => updateCopySection("booking", "title", value)} value={copy.booking.title} />
              <TextField label="Booking - description" as="textarea" onChange={(value) => updateCopySection("booking", "subtitle", value)} value={copy.booking.subtitle} />
              <TextField label="Primary button" onChange={(value) => updateCopySection("booking", "buttonLabel", value)} value={copy.booking.buttonLabel} />
              <TextField label="Hold label" onChange={(value) => updateCopySection("booking", "activeHoldLabel", value)} value={copy.booking.activeHoldLabel} />
              <TextField label="Hold message" as="textarea" onChange={(value) => updateCopySection("booking", "holdSuccess", value)} value={copy.booking.holdSuccess} />
              <TextField label="Available legend" onChange={(value) => updateCopySection("booking", "legendAvailable", value)} value={copy.booking.legendAvailable} />
              <TextField label="Occupied legend" onChange={(value) => updateCopySection("booking", "legendBooked", value)} value={copy.booking.legendBooked} />
              <TextField label="Blocked legend" onChange={(value) => updateCopySection("booking", "legendBlocked", value)} value={copy.booking.legendBlocked} />
              <TextField label="In-progress legend" onChange={(value) => updateCopySection("booking", "legendInProgress", value)} value={copy.booking.legendInProgress} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="grid gap-4">
              <TextField label="Admin - title" onChange={(value) => updateCopySection("admin", "title", value)} value={copy.admin.title} />
              <TextField label="Admin - description" as="textarea" onChange={(value) => updateCopySection("admin", "subtitle", value)} value={copy.admin.subtitle} />
              <TextField label="Admin - back button" onChange={(value) => updateCopySection("admin", "backButton", value)} value={copy.admin.backButton} />
              <TextField label="Admin - branding title" onChange={(value) => updateCopySection("admin", "settingsTitle", value)} value={copy.admin.settingsTitle} />
              <TextField label="Admin - branding text" as="textarea" onChange={(value) => updateCopySection("admin", "settingsSubtitle", value)} value={copy.admin.settingsSubtitle} />
              <TextField label="Admin - manual title" onChange={(value) => updateCopySection("admin", "manualTitle", value)} value={copy.admin.manualTitle} />
              <TextField label="Admin - manual text" as="textarea" onChange={(value) => updateCopySection("admin", "manualSubtitle", value)} value={copy.admin.manualSubtitle} />
            </div>

            <div className="grid gap-4">
              <TextField label="Player - title" onChange={(value) => updateCopySection("player", "title", value)} value={copy.player.title} />
              <TextField label="Player - description" as="textarea" onChange={(value) => updateCopySection("player", "subtitle", value)} value={copy.player.subtitle} />
              <TextField label="Player - upcoming bookings" onChange={(value) => updateCopySection("player", "upcomingTitle", value)} value={copy.player.upcomingTitle} />
              <TextField label="Player - history" onChange={(value) => updateCopySection("player", "historyTitle", value)} value={copy.player.historyTitle} />
              <TextField label="Player - empty upcoming" onChange={(value) => updateCopySection("player", "emptyUpcoming", value)} value={copy.player.emptyUpcoming} />
              <TextField label="Player - empty history" onChange={(value) => updateCopySection("player", "emptyHistory", value)} value={copy.player.emptyHistory} />
            </div>
          </div>
        </SettingsBlock>

        <SettingsBlock
          description={ui.systemDescription}
          title={ui.systemTitle}
        >
          <TextField
            label={ui.supabaseNotConfigured}
            onChange={(value) => updateCopySection("auth", "missingConfig", value)}
            value={copy.auth.missingConfig}
          />
          <TextField
            label={ui.loadingAvailability}
            onChange={(value) => updateCopySection("system", "loadingAvailability", value)}
            value={copy.system.loadingAvailability}
          />
          <TextField
            label={ui.mockData}
            onChange={(value) => updateCopySection("system", "dataSourceMock", value)}
            value={copy.system.dataSourceMock}
          />
          <TextField
            label={ui.supabaseData}
            onChange={(value) => updateCopySection("system", "dataSourceSupabase", value)}
            value={copy.system.dataSourceSupabase}
          />
          <TextField
            label={ui.updatingAvailability}
            onChange={(value) => updateCopySection("system", "updatingAvailability", value)}
            value={copy.system.updatingAvailability}
          />
          <TextField
            label={ui.missingConfig}
            as="textarea"
            onChange={(value) => updateCopySection("system", "configurationMissing", value)}
            value={copy.system.configurationMissing}
          />
        </SettingsBlock>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <section className="rounded-[1.75rem] border border-court-ball bg-court-ink p-4 shadow-soft">
          <p className="type-label text-court-ball">{ui.preview}</p>
          <div className="mt-4 rounded-[1.5rem] border border-court-cyan bg-court-panel p-4" style={previewStyle}>
            <div className="mb-3">
              <ClubLogo clubName={clubName} logoUrl={logoPreviewUrl} />
            </div>
            <div className="mb-3 grid min-h-24 place-items-center rounded-2xl border border-court-cyan/40 bg-court-ink/40 p-3">
              {fullLogoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${clubName} full logo`}
                  className="max-h-20 w-full object-contain"
                  src={fullLogoPreviewUrl}
                />
              ) : (
                <p className="type-note text-court-cyan">{ui.fullLogoNotUploaded}</p>
              )}
            </div>
            <p className="type-label text-court-cyan">
              {copy.home.eyebrow}
            </p>
            <h3 className="mt-2 type-card leading-tight text-court-ball">
              {copy.home.title}
            </h3>
            <p className="mt-2 type-body text-court-cyan">{copy.home.subtitle}</p>
            <div className="mt-4 rounded-2xl border border-court-ball bg-court-ink px-4 py-3 type-body-strong text-court-ball">
              {copy.booking.buttonLabel}
            </div>
          </div>
        </section>

        <button
          className="w-full rounded-2xl bg-court-ball px-5 py-4 type-button text-court-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-court-cyan/20 disabled:text-court-cyan/55"
          disabled={isSaving}
          onClick={() => void saveSettings()}
          type="button"
        >
          {isSaving ? ui.saving : ui.saveSettings}
        </button>

        {message ? (
          <p className="rounded-2xl border border-court-ball bg-court-ink px-4 py-3 type-body-strong text-court-ball">
            {message}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
