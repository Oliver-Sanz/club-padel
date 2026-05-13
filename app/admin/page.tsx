import Link from "next/link";
import type { UrlObject } from "url";
import { AdminDatePicker } from "@/components/admin-date-picker";
import { AdminManualBooking } from "@/components/admin-manual-booking";
import { AuthCard } from "@/components/auth-card";
import { ClubLogo } from "@/components/club-logo";
import { ClubSettingsForm } from "@/components/club-settings-form";
import { LogoutButton } from "@/components/logout-button";
import { getClubConfig } from "@/lib/club-config";
import { getClubDateISO, formatClubDateTime } from "@/lib/club-time";
import { AdminBookingRow, getAdminData } from "@/lib/admin-data";
import { formatMoney, toISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    date?: string;
    court?: string;
    view?: string;
  }>;
};

function formatTime(value: string) {
  return formatClubDateTime(value, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatAdminDayLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const parts = new Intl.DateTimeFormat("es-ES", {
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

function formatTabLabel(dateISO: string) {
  const date = new Date(`${dateISO}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date);
  const dayMonth = new Intl.DateTimeFormat("es-ES", {
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

function groupBookingsByDay(bookings: AdminBookingRow[]) {
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
      label: formatAdminDayLabel(dateISO),
      bookings: [booking]
    });
  });

  return groups;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const clubConfig = await getClubConfig();
  const data = await getAdminData(params);
  const bookingGroups = groupBookingsByDay(data.bookings);
  const previousWindowDate = shiftDateISO(data.selectedDate, -7);
  const nextWindowDate = shiftDateISO(data.selectedDate, 7);
  const view = params.view === "branding" ? "branding" : "bookings";

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <ClubLogo clubName={clubConfig.clubName} logoUrl={clubConfig.logoUrl} />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-court-ball">
            {clubConfig.copy.admin.eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white">
            {view === "branding" ? clubConfig.copy.admin.settingsTitle : clubConfig.copy.admin.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-court-cyan">
            {view === "branding"
              ? clubConfig.copy.admin.settingsSubtitle
              : clubConfig.copy.admin.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-2xl border border-court-cyan px-4 py-3 text-sm font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            href="/"
          >
            {clubConfig.copy.admin.backButton}
          </Link>
          {data.isLoggedIn ? (
            <LogoutButton
              className="rounded-2xl border border-court-cyan px-4 py-3 text-sm font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball"
              label={clubConfig.copy.auth.logoutButton}
            />
          ) : null}
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <Link
          className={[
            "rounded-2xl border px-4 py-3 text-sm font-black transition",
            view === "bookings"
              ? "border-court-ball bg-court-ball text-court-ink shadow-glow"
              : "border-court-cyan text-court-cyan hover:border-court-ball hover:text-court-ball"
          ].join(" ")}
          href={buildAdminLinkHref(data.selectedDate, data.selectedCourt, "bookings")}
        >
          Reservas
        </Link>
        <Link
          className={[
            "rounded-2xl border px-4 py-3 text-sm font-black transition",
            view === "branding"
              ? "border-court-ball bg-court-ball text-court-ink shadow-glow"
              : "border-court-cyan text-court-cyan hover:border-court-ball hover:text-court-ball"
          ].join(" ")}
          href={buildAdminLinkHref(data.selectedDate, data.selectedCourt, "branding")}
        >
          Branding
        </Link>
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
            logoUrl={clubConfig.logoUrl}
            user={null}
          />
        </div>
      ) : null}

      {data.isLoggedIn && !data.isAdmin ? (
        <section className="rounded-[2rem] border border-court-ball bg-court-ink p-6 text-court-ball">
          Tu usuario no tiene permisos de admin. Cambia tu rol a `admin` en la tabla `profiles`.
        </section>
      ) : null}

      {data.isAdmin && view === "bookings" ? (
        <section className="rounded-[2rem] border border-court-ball bg-court-ink p-4 shadow-soft md:p-6">
          <div className="mb-6 grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
            <AdminDatePicker
              selectedCourt={data.selectedCourt}
              selectedDate={data.selectedDate}
            />

            <div className="rounded-[1.75rem] border border-court-cyan bg-court-panel p-4 md:p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-court-ball">
                Mostrando desde
              </p>
              <h2 className="mt-2 text-2xl font-black capitalize tracking-[-0.03em] text-white">
                {formatAdminDayLabel(data.selectedDate)}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-court-cyan">
                El calendario marca el primer dia del listado. Debajo seguiras viendo las reservas
                futuras ordenadas por dia, no solo las de la fecha seleccionada.
              </p>
            </div>
          </div>

          <AdminManualBooking
            copy={clubConfig.copy.admin}
            courts={data.courts}
            selectedDate={data.selectedDate}
          />

          <form className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <input name="date" type="hidden" value={data.selectedDate} />
            <label className="grid gap-2 text-sm font-black text-court-cyan">
              Pista
              <select
                className="rounded-2xl border border-court-cyan bg-court-panel px-4 py-3 text-white outline-none focus:border-court-ball"
                defaultValue={data.selectedCourt}
                name="court"
              >
                <option value="all">Todas</option>
                {data.courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="rounded-2xl bg-court-ball px-5 py-3 text-sm font-black text-court-ink shadow-glow"
              type="submit"
            >
              Filtrar
            </button>
          </form>

          <nav
            aria-label="Accesos rapidos por dia"
            className="mb-4 overflow-x-auto rounded-[1.75rem] border border-court-cyan bg-court-panel p-2"
          >
            <div className="grid min-w-[920px] grid-cols-[56px_repeat(7,minmax(0,1fr))_56px] gap-2">
              <a
                aria-label="Ver 7 dias anteriores"
                className="grid place-items-center rounded-2xl border border-court-cyan text-3xl font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            href={buildAdminHref(previousWindowDate, data.selectedCourt) as any}
              >
                ‹
              </a>
              {data.dayTabs.map((tab) => {
                const isSelected = tab.dateISO === data.selectedDate;

                return (
                  <a
                    className={[
                      "relative rounded-2xl px-3 py-4 text-center text-sm font-black capitalize transition",
                      isSelected
                        ? "bg-court-ball text-court-ink shadow-glow"
                        : "text-court-cyan hover:bg-court-cyan/10 hover:text-court-ball"
                    ].join(" ")}
                    href={buildAdminHref(tab.dateISO, data.selectedCourt)}
                    key={tab.dateISO}
                  >
                    <span className="block">{formatTabLabel(tab.dateISO)}</span>
                    <span
                      className={[
                        "mt-2 inline-flex rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.12em]",
                        isSelected ? "bg-court-ink text-court-ball" : "bg-court-ink text-court-cyan"
                      ].join(" ")}
                    >
                      {tab.bookingCount} reservas
                    </span>
                  </a>
                );
              })}
              <a
                aria-label="Ver 7 dias siguientes"
                className="grid place-items-center rounded-2xl border border-court-cyan text-3xl font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball"
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
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-court-ball">
                    {group.label}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
                    <thead className="text-xs font-black uppercase tracking-[0.16em] text-court-cyan">
                      <tr>
                        <th className="px-3 py-2">Hora</th>
                        <th className="px-3 py-2">Pista</th>
                        <th className="px-3 py-2">Duracion</th>
                        <th className="px-3 py-2">Precio</th>
                        <th className="px-3 py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.bookings.map((booking) => (
                        <tr className="bg-court-panel text-sm font-bold text-white" key={booking.id}>
                          <td className="rounded-l-2xl px-3 py-4 text-court-ball">
                            {formatTime(booking.startTime)}
                          </td>
                          <td className="px-3 py-4 text-court-cyan">{booking.courtName}</td>
                          <td className="px-3 py-4 text-court-cyan">
                            {booking.durationMinutes} min
                          </td>
                          <td className="px-3 py-4 text-court-ball">
                            {formatMoney(booking.priceTotalCents)}
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
              <p className="rounded-2xl border border-court-cyan bg-court-panel p-5 text-sm font-bold text-court-cyan">
                No hay reservas para este filtro.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {data.isAdmin && view === "branding" ? (
        <section className="rounded-[2rem] border border-court-ball bg-court-ink p-4 shadow-soft md:p-6">
          <ClubSettingsForm config={clubConfig} />
        </section>
      ) : null}
    </main>
  );
}
