import type { CSSProperties } from "react";
import { DEFAULT_LOCALE, normalizeLocale, type SupportedLocale } from "@/lib/i18n";

export type ClubThemeColors = {
  background: string;
  foreground: string;
  accent: string;
  grey: string;
  ink: string;
  panel: string;
  mist: string;
  line: string;
};

export type ClubCopy = {
  home: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  auth: {
    eyebrow: string;
    title: string;
    subtitle: string;
    googleButton: string;
    emailButton: string;
    helper: string;
    loggedInTitle: string;
    loggedInSubtitle: string;
    reservationsButton: string;
    adminButton: string;
    logoutButton: string;
    missingConfig: string;
  };
  booking: {
    eyebrow: string;
    title: string;
    subtitle: string;
    buttonLabel: string;
    activeHoldLabel: string;
    holdSuccess: string;
    holdRefreshError: string;
    loadingMessage: string;
    legendAvailable: string;
    legendBooked: string;
    legendBlocked: string;
    legendInProgress: string;
  };
  admin: {
    eyebrow: string;
    title: string;
    subtitle: string;
    backButton: string;
    settingsTitle: string;
    settingsSubtitle: string;
    reservationsTitle: string;
    reservationsSubtitle: string;
    manualTitle: string;
    manualSubtitle: string;
  };
  player: {
    eyebrow: string;
    title: string;
    subtitle: string;
    upcomingTitle: string;
    historyTitle: string;
    emptyUpcoming: string;
    emptyHistory: string;
    cancelButton: string;
    cancelingButton: string;
    cancelSuccess: string;
    contactClub: string;
    cancelledLabel: string;
  };
  system: {
    configurationMissing: string;
    loadingAvailability: string;
    dataSourceMock: string;
    dataSourceSupabase: string;
    updatingAvailability: string;
    fullLogoPathFallback?: string;
  };
};

export type ClubConfig = {
  clubId: string | null;
  slug: string;
  locale: SupportedLocale;
  clubName: string;
  logoPath: string | null;
  logoUrl: string | null;
  fullLogoPath: string | null;
  fullLogoUrl: string | null;
  colors: ClubThemeColors;
  copy: ClubCopy;
  localizedCopy: LocalizedClubCopy;
};

export type LocalizedClubCopy = Record<SupportedLocale, ClubCopy>;

export const DEFAULT_COLORS: ClubThemeColors = {
  background: "#25476E",
  foreground: "#33EFFF",
  accent: "#CCFF00",
  grey: "#D9D9D9",
  ink: "#07111C",
  panel: "#102A43",
  mist: "#EAF6FA",
  line: "#CCFF00"
};

export const DEFAULT_COPY_EN: ClubCopy = {
  home: {
    eyebrow: "Padel Club",
    title: "Clear bookings, faster flow, no double-bookings.",
    subtitle:
      "MVP phase 2: Supabase login, availability ready for real data, and a safe fallback to mocks while you finish the setup."
  },
  auth: {
    eyebrow: "Phase 2 Access",
    title: "Book with your account",
    subtitle:
      "You can explore availability without signing in. To book, use Google or an email link.",
    googleButton: "Continue with Google",
    emailButton: "Send email link",
    helper:
      "Supabase is not configured yet. The app will keep using mock data until you fill in `.env.local`.",
    loggedInTitle: "You are signed in",
    loggedInSubtitle: "Active session",
    reservationsButton: "My bookings",
    adminButton: "Open admin",
    logoutButton: "Log out",
    missingConfig: "Configure Supabase to enable real access."
  },
  booking: {
    eyebrow: "Availability",
    title: "Choose a court and time",
    subtitle:
      "Synchronized horizontal scroll: move any court and all three stay aligned. Yellow slots are temporary holds while another booking is in progress.",
    buttonLabel: "Hold for 6 minutes",
    activeHoldLabel: "Temporary hold active",
    holdSuccess: "Time slot saved. Confirm the booking before it expires.",
    holdRefreshError: "We could not refresh availability. Retrying with the latest data.",
    loadingMessage: "Updating availability...",
    legendAvailable: "Available",
    legendBooked: "Occupied",
    legendBlocked: "Blocked",
    legendInProgress: "In progress"
  },
  admin: {
    eyebrow: "Admin",
    title: "Club bookings",
    subtitle: "View all upcoming active bookings, sorted by date and court.",
    backButton: "Back to bookings",
    settingsTitle: "Branding and copy",
    settingsSubtitle:
      "Adjust the club name, logo, colors, and visible website copy without touching code.",
    reservationsTitle: "Club bookings",
    reservationsSubtitle:
      "View all upcoming active bookings, sorted by date and court.",
    manualTitle: "Create manual booking",
    manualSubtitle:
      "The day is selected in the calendar above. This action creates a confirmed booking from the club side, without payment."
  },
  player: {
    eyebrow: "Player",
    title: "My bookings",
    subtitle: "Review your upcoming bookings and cancel for free up to 6 hours before.",
    upcomingTitle: "Upcoming bookings",
    historyTitle: "History",
    emptyUpcoming: "You do not have any upcoming bookings yet.",
    emptyHistory: "No history yet.",
    cancelButton: "Cancel booking",
    cancelingButton: "Cancelling...",
    cancelSuccess: "Booking cancelled.",
    contactClub: "Less than 6 hours left: contact the club",
    cancelledLabel: "Cancelled"
  },
  system: {
    configurationMissing: "Configure Supabase before using this page.",
    loadingAvailability: "Loading availability...",
    dataSourceMock: "Local mock",
    dataSourceSupabase: "Supabase",
    updatingAvailability: "Updating availability..."
  }
};

export const DEFAULT_COPY_ES: ClubCopy = {
  home: {
    eyebrow: "Club de Padel",
    title: "Reservas claras, rapidas y sin dobles reservas.",
    subtitle:
      "Fase 2 del MVP: login con Supabase, disponibilidad preparada para datos reales y fallback seguro a mocks mientras configuras las claves."
  },
  auth: {
    eyebrow: "Acceso Fase 2",
    title: "Reserva con tu cuenta",
    subtitle:
      "Puedes ver disponibilidad sin iniciar sesion. Para reservar, usaremos Google o un enlace por email.",
    googleButton: "Continuar con Google",
    emailButton: "Recibir enlace por email",
    helper:
      "Supabase todavia no esta configurado. La app seguira usando datos mock hasta que rellenes `.env.local`.",
    loggedInTitle: "Estas dentro",
    loggedInSubtitle: "Sesion activa",
    reservationsButton: "Mis reservas",
    adminButton: "Ir a admin",
    logoutButton: "Cerrar sesion",
    missingConfig: "Configura Supabase para activar el acceso real."
  },
  booking: {
    eyebrow: "Disponibilidad",
    title: "Elige pista y hora",
    subtitle:
      "Scroll horizontal sincronizado: mueve cualquier pista y las tres se alinean. Los slots amarillos son reservas en proceso con expiracion temporal.",
    buttonLabel: "Guardar 6 minutos",
    activeHoldLabel: "Reserva temporal activa",
    holdSuccess: "Horario guardado. Ahora confirma la reserva antes de que expire.",
    holdRefreshError: "No se pudo actualizar la disponibilidad. Reintentando con datos actuales.",
    loadingMessage: "Actualizando disponibilidad...",
    legendAvailable: "Libre",
    legendBooked: "Ocupado",
    legendBlocked: "Bloqueado",
    legendInProgress: "En proceso"
  },
  admin: {
    eyebrow: "Admin",
    title: "Reservas del club",
    subtitle: "Vista de todas las reservas activas futuras, ordenadas por fecha y pista.",
    backButton: "Volver a reservas",
    settingsTitle: "Branding y textos",
    settingsSubtitle:
      "Ajusta el nombre, logo, colores y textos visibles de la web sin tocar el codigo.",
    reservationsTitle: "Reservas del club",
    reservationsSubtitle:
      "Vista de todas las reservas activas futuras, ordenadas por fecha y pista.",
    manualTitle: "Crear reserva manual",
    manualSubtitle:
      "El dia se elige en el calendario superior. Esta accion crea una reserva confirmada desde el club, sin pasar por pago."
  },
  player: {
    eyebrow: "Jugador",
    title: "Mis reservas",
    subtitle: "Consulta tus proximas reservas y cancela gratis hasta 6 horas antes.",
    upcomingTitle: "Proximas reservas",
    historyTitle: "Historial",
    emptyUpcoming: "Aun no tienes reservas futuras.",
    emptyHistory: "Todavia no hay historial.",
    cancelButton: "Cancelar reserva",
    cancelingButton: "Cancelando...",
    cancelSuccess: "Reserva cancelada.",
    contactClub: "Faltan menos de 6 horas: contacta con el club",
    cancelledLabel: "Cancelada"
  },
  system: {
    configurationMissing: "Configura Supabase antes de usar esta pagina.",
    loadingAvailability: "Cargando disponibilidad...",
    dataSourceMock: "Mock local",
    dataSourceSupabase: "Supabase",
    updatingAvailability: "Actualizando disponibilidad..."
  }
};

export const DEFAULT_LOCALIZED_COPY: LocalizedClubCopy = {
  en: DEFAULT_COPY_EN,
  es: DEFAULT_COPY_ES
};

export const DEFAULT_COPY = DEFAULT_COPY_EN;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mergeDeep<T>(base: T, override: unknown): T {
  if (!isRecord(base) || !isRecord(override)) {
    return (override ?? base) as T;
  }

  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = (base as Record<string, unknown>)[key];

    if (isRecord(baseValue) && isRecord(value)) {
      result[key] = mergeDeep(baseValue, value);
      continue;
    }

    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }

  return result as T;
}

function hasLocalizedCopyShape(value: unknown): value is Partial<LocalizedClubCopy> {
  return isRecord(value) && (isRecord(value.en) || isRecord(value.es));
}

export function normalizeLocalizedCopy(override: unknown): LocalizedClubCopy {
  if (hasLocalizedCopyShape(override)) {
    return {
      en: mergeDeep(DEFAULT_COPY_EN, override.en),
      es: mergeDeep(DEFAULT_COPY_ES, override.es)
    };
  }

  return {
    en: DEFAULT_COPY_EN,
    es: mergeDeep(DEFAULT_COPY_ES, override)
  };
}

export function getCopyForLocale(
  localizedCopy: LocalizedClubCopy,
  locale: unknown
): ClubCopy {
  return localizedCopy[normalizeLocale(locale)];
}

export function getClubThemeStyle(colors: ClubThemeColors): CSSProperties {
  return {
    "--court-background": colors.background,
    "--court-foreground": colors.foreground,
    "--court-ball": colors.accent,
    "--court-grey": colors.grey,
    "--court-ink": colors.ink,
    "--court-panel": colors.panel,
    "--court-mist": colors.mist,
    "--court-line": colors.line
  } as CSSProperties;
}

export function getDefaultClubConfig(locale: SupportedLocale = DEFAULT_LOCALE): ClubConfig {
  const normalizedLocale = normalizeLocale(locale);

  return {
    clubId: null,
    slug: "default",
    locale: normalizedLocale,
    clubName: "Padel Club",
    logoPath: null,
    logoUrl: null,
    fullLogoPath: null,
    fullLogoUrl: null,
    colors: DEFAULT_COLORS,
    copy: DEFAULT_LOCALIZED_COPY[normalizedLocale],
    localizedCopy: DEFAULT_LOCALIZED_COPY
  };
}
