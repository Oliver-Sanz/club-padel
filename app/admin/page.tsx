import Link from "next/link";
import type { UrlObject } from "url";
import { AdminDatePicker } from "@/components/admin-date-picker";
import { AdminManualBooking } from "@/components/admin-manual-booking";
import { AuthCard } from "@/components/auth-card";
import { ClubLogo } from "@/components/club-logo";
import { ClubSettingsForm } from "@/components/club-settings-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { getClubConfig } from "@/lib/club-config";
import { getClubDateISO, formatClubDateTime } from "@/lib/club-time";
import { AdminBookingRow, getAdminData } from "@/lib/admin-data";
import { formatMoney, toISODate } from "@/lib/format";
import { LOCALE_FORMATS, UI_LABELS, type SupportedLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    date?: string;
    court?: string;
    view?: string;
  }>;
};

function formatTime(value: string, locale: SupportedLocale) {
  return formatClubDateTime(value, {
    hour: "2-digit",
    minute: "2-digit"
  }, locale);
}

function formatAdminDayLabel(value: string, locale: SupportedLocale) {
  const date = new Date(`${value}T12:00:00`);
  const parts = new Intl.DateTimeFormat(LOCALE_FORMATS[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekday = getPart("weekday");
  const day = getPart("day");
  const month = getPart("month");
  const year = getPart("year");

  return `${weekday} - ${day} - ${month} - ${year}`;
}

function formatTabLabel(dateISO: string, locale: SupportedLocale) {
  const date = new Date(`${dateISO}T12:00:00`);
  const weekday = new Intl.DateTimeFormat(LOCALE_FORMATS[locale], { weekday: "short" }).format(date);
  const dayMonth = new Intl.DateTimeFormat(LOCALE_FORMATS[locale], {
    day: "numeric",
    month: "short"
  }).format(date);

  return `${weekday} ${dayMonth}`.replace(".", "");
}

function buildAdminHref(dateISO: string, selectedCourt: string, view = "bookings") {
  const params = new URLSearchParams({ date: dateISO });

  if (selectedCourt !== "all") {
    params.set("court", selectedCourt);
  }

  if (view !== "bookings") {
    params.set("view", view);
  }

  return `/admin?${params.toString()}`;
}

function buildAdminLinkHref(dateISO: string, selectedCourt: string, view = "bookings"): UrlObject {
  const query: Record<string, string> = { date: dateISO };

  if (selectedCourt !== "all") {
    query.court = selectedCourt;
  }

  if (view !== "bookings") {
    query.view = view;
  }

  return {
    pathname: "/admin",
    query
  };
}

function shiftDateISO(dateISO: string, days: number) {
  const date = new Date(`${dateISO}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function groupBookingsByDay(bookings: AdminBookingRow[], locale: SupportedLocale) {
  const groups: Array<{ dateISO: string; label: string; bookings: AdminBookingRow[] }> = [];

  bookings.forEach((booking) => {
    const dateISO = getClubDateISO(booking.startTime);
    const lastGroup = groups.at(-1);

    if (lastGroup?.dateISO === dateISO) {
      lastGroup.bookings.push(booking);
      return;
    }

    groups.push({
      dateISO,
      label: formatAdminDayLabel(dateISO, locale),
      bookings: [booking]
    });
  });

  return groups;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const clubConfig = await getClubConfig();
  const ui = UI_LABELS[clubConfig.locale];
  const data = await getAdminData(params, clubConfig.locale);
  const bookingGroups = groupBookingsByDay(data.bookings, clubConfig.locale);
  const previousWindowDate = shiftDateISO(data.selectedDate, -7);
  const nextWindowDate = shiftDateISO(data.selectedDate, 7);
  const view = params.view === "branding" && data.isSuperAdmin ? "branding" : "bookings";

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <ClubLogo clubName={clubConfig.clubName} logoUrl={clubConfig.logoUrl} />
            <LanguageSwitcher locale={clubConfig.locale} />
          </div>
          {data.isAdmin ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {data.currentRoleLabel ? (
                <span className="inline-flex items-center rounded-full border border-court-ball bg-court-ball px-3 py-1 type-badge text-court-ink">
                  {data.currentRoleLabel}
                </span>
              ) : null}
              {data.currentScopeLabel ? (
                <span className="inline-flex items-center rounded-full border border-court-cyan bg-court-panel px-3 py-1 type-badge text-court-cyan">
                  {data.currentScopeLabel}
                </span>
              ) : null}
              {data.currentUserLabel ? (
                <span className="type-note text-court-grey">
                  {data.currentUserLabel}
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="mt-4 type-label text-court-ball">
            {clubConfig.copy.admin.eyebrow}
          </p>
          <h1 className="mt-2 type-section text-white">
            {view === "branding" ? clubConfig.copy.admin.settingsTitle : clubConfig.copy.admin.title}
          </h1>
          <p className="mt-2 max-w-2xl type-body text-court-cyan">
            {view === "branding"
              ? clubConfig.copy.admin.settingsSubtitle
              : clubConfig.copy.admin.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-2xl border border-court-cyan px-4 py-3 type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            href="/"
          >
            {clubConfig.copy.admin.backButton}
          </Link>
          {data.isLoggedIn ? (
            <LogoutButton
              className="rounded-2xl border border-court-cyan px-4 py-3 type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball"
              label={clubConfig.copy.auth.logoutButton}
            />
          ) : null}
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <Link
          className={[
            "rounded-2xl border px-4 py-3 type-button transition",
            view === "bookings"
              ? "border-court-ball bg-court-ball text-court-ink shadow-glow"
              : "border-court-cyan text-court-cyan hover:border-court-ball hover:text-court-ball"
          ].join(" ")}
          href={buildAdminLinkHref(data.selectedDate, data.selectedCourt, "bookings")}
          >
            {ui.bookingsTab}
          </Link>
        {data.isSuperAdmin ? (
          <Link
            className={[
              "rounded-2xl border px-4 py-3 type-button transition",
              view === "branding"
                ? "border-court-ball bg-court-ball text-court-ink shadow-glow"
                : "border-court-cyan text-court-cyan hover:border-court-ball hover:text-court-ball"
            ].join(" ")}
            href={buildAdminLinkHref(data.selectedDate, data.selectedCourt, "branding")}
          >
            {ui.platformBrandingTab}
          </Link>
        ) : null}
      </div>

      {!data.isConfigured ? (
        <section className="rounded-[2rem] border border-court-ball bg-court-ink p-6 text-court-ball">
          {clubConfig.copy.system.configurationMissing}
        </section>
      ) : null}

      {data.isConfigured && !data.isLoggedIn ? (
        <div className="max-w-md">
          <AuthCard
            clubName={clubConfig.clubName}
            copy={clubConfig.copy.auth}
            isConfigured={data.isConfigured}
            locale={clubConfig.locale}
            logoUrl={clubConfig.logoUrl}
            user={null}
          />
        </div>
      ) : null}

      {data.isLoggedIn && !data.isAdmin ? (
        <section className="rounded-[2rem] border border-court-ball bg-court-ink p-6 text-court-ball">
          {ui.playerRoleWarning}
        </section>
      ) : null}

      {data.isAdmin && view === "bookings" ? (
        <section className="rounded-[2rem] border border-court-ball bg-court-ink p-4 shadow-soft md:p-6">
          <div className="mb-6 grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
            <AdminDatePicker
              selectedCourt={data.selectedCourt}
              selectedDate={data.selectedDate}
              locale={clubConfig.locale}
            />

            <div className="rounded-[1.75rem] border border-court-cyan bg-court-panel p-4 md:p-5">
              <p className="type-label text-court-ball">
                {ui.showingFrom}
              </p>
              <h2 className="mt-2 type-card capitalize text-white">
                {formatAdminDayLabel(data.selectedDate, clubConfig.locale)}
              </h2>
              <p className="mt-2 type-body text-court-cyan">
                {ui.adminDateWindow}
              </p>
            </div>
          </div>

          <AdminManualBooking
            copy={clubConfig.copy.admin}
            courts={data.courts}
            locale={clubConfig.locale}
            players={data.players}
            selectedDate={data.selectedDate}
          />

          <form className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <input name="date" type="hidden" value={data.selectedDate} />
            <label className="grid gap-2 type-body-strong text-court-cyan">
              {ui.court}
              <select
                className="rounded-2xl border border-court-cyan bg-court-panel px-4 py-3 text-white outline-none focus:border-court-ball"
                defaultValue={data.selectedCourt}
                name="court"
              >
                <option value="all">{ui.all}</option>
                {data.courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="rounded-2xl bg-court-ball px-5 py-3 type-button text-court-ink shadow-glow"
              type="submit"
            >
              {ui.filter}
            </button>
          </form>

          <nav
            aria-label={ui.quickDayShortcuts}
            className="mb-4 overflow-x-auto rounded-[1.75rem] border border-court-cyan bg-court-panel p-2"
          >
            <div className="grid min-w-[980px] grid-cols-[56px_repeat(7,minmax(7.5rem,1fr))_56px] gap-2 xl:min-w-0">
              <a
                aria-label={ui.previousSevenDays}
                className="grid place-items-center rounded-2xl border border-court-cyan type-display text-court-cyan transition hover:border-court-ball hover:text-court-ball"
                href={buildAdminHref(previousWindowDate, data.selectedCourt) as any}
              >
                ‹
              </a>
              {data.dayTabs.map((tab) => {
                const isSelected = tab.dateISO === data.selectedDate;

                return (
                  <a
                    className={[
                      "relative flex min-h-[6.5rem] min-w-0 flex-col items-center justify-center rounded-2xl px-3 py-4 text-center type-button capitalize transition",
                      isSelected
                        ? "bg-court-ball text-court-ink shadow-glow"
                        : "text-court-cyan hover:bg-court-cyan/10 hover:text-court-ball"
                    ].join(" ")}
                    href={buildAdminHref(tab.dateISO, data.selectedCourt)}
                    key={tab.dateISO}
                  >
                    <span className="block whitespace-nowrap">{formatTabLabel(tab.dateISO, clubConfig.locale)}</span>
                    <span
                      className={[
                        "mt-2 inline-flex min-w-[5.75rem] justify-center whitespace-nowrap rounded-full px-2 py-1 type-badge",
                        isSelected ? "bg-court-ink text-court-ball" : "bg-court-ink text-court-cyan"
                      ].join(" ")}
                    >
                      {tab.bookingCount} {ui.bookingsCount}
                    </span>
                  </a>
                );
              })}
              <a
                aria-label={ui.nextSevenDays}
                className="grid place-items-center rounded-2xl border border-court-cyan type-display text-court-cyan transition hover:border-court-ball hover:text-court-ball"
                href={buildAdminHref(nextWindowDate, data.selectedCourt) as any}
              >
                ›
              </a>
            </div>
          </nav>

          <div className="space-y-4">
            {bookingGroups.map((group) => (
              <section className="space-y-3" key={group.dateISO}>
                <div className="mb-3 rounded-2xl border border-court-ball bg-court-panel px-4 py-3">
                  <p className="type-label text-court-ball">
                    {group.label}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
                    <thead className="type-label text-court-cyan">
                      <tr>
                        <th className="px-3 py-2">{ui.time}</th>
                        <th className="px-3 py-2">{ui.court}</th>
                        <th className="px-3 py-2">{ui.duration}</th>
                        <th className="px-3 py-2">{ui.price}</th>
                        <th className="px-3 py-2">{ui.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.bookings.map((booking) => (
                        <tr className="bg-court-panel type-body-strong text-white" key={booking.id}>
                          <td className="rounded-l-2xl px-3 py-4 text-court-ball">
                            {formatTime(booking.startTime, clubConfig.locale)}
                          </td>
                          <td className="px-3 py-4 text-court-cyan">{booking.courtName}</td>
                          <td className="px-3 py-4 text-court-cyan">
                            {booking.durationMinutes} min
                          </td>
                          <td className="px-3 py-4 text-court-ball">
                            {formatMoney(booking.priceTotalCents, "EUR", clubConfig.locale)}
                          </td>
                          <td className="rounded-r-2xl px-3 py-4 text-court-cyan">
                            {booking.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
            {bookingGroups.length === 0 ? (
              <p className="rounded-2xl border border-court-cyan bg-court-panel p-5 type-body-strong text-court-cyan">
                {ui.noBookingsForFilter}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {data.isSuperAdmin && view === "branding" ? (
        <section className="rounded-[2rem] border border-court-ball bg-court-ink p-4 shadow-soft md:p-6">
          <ClubSettingsForm config={clubConfig} />
        </section>
      ) : null}
    </main>
  );
}
