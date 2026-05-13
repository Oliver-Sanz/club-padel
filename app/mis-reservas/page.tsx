import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { LogoutButton } from "@/components/logout-button";
import { ClubLogo } from "@/components/club-logo";
import { getClubConfig } from "@/lib/club-config";
import { formatClubDateTime } from "@/lib/club-time";
import { PlayerBookingRow, getPlayerBookingsData } from "@/lib/player-bookings-data";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatBookingDate(value: string) {
  return formatClubDateTime(value, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatBookingTimeRange(start: string, end: string) {
  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit"
  };

  return `${formatClubDateTime(start, formatOptions)} - ${formatClubDateTime(end, formatOptions)}`;
}

function BookingCard({
  booking,
  labels
}: {
  booking: PlayerBookingRow;
  labels: {
    cancelButton: string;
    cancelingButton: string;
    cancelSuccess: string;
  };
}) {
  return (
    <article className="rounded-[1.75rem] border border-court-cyan bg-court-panel p-4 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="type-label text-court-ball">
            {booking.status}
          </p>
          <h2 className="mt-2 type-card capitalize text-white">
            {formatBookingDate(booking.startTime)}
          </h2>
          <p className="mt-2 type-body-strong text-court-cyan">
            {formatBookingTimeRange(booking.startTime, booking.endTime)}
          </p>
        </div>

        <div className="rounded-2xl border border-court-ball bg-court-ink p-4 type-button text-court-ball">
          {formatMoney(booking.priceTotalCents)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 type-body-strong text-court-cyan md:grid-cols-3">
        <p className="rounded-2xl border border-court-cyan bg-court-ink px-4 py-3">
          {booking.courtName}
        </p>
        <p className="rounded-2xl border border-court-cyan bg-court-ink px-4 py-3">
          {booking.durationMinutes} minutos
        </p>
        <p className="rounded-2xl border border-court-cyan bg-court-ink px-4 py-3">
          {booking.cancellationMessage || "Sin accion disponible"}
        </p>
      </div>

      <div className="mt-4">
        {booking.canCancel ? (
          <CancelBookingButton
            bookingId={booking.id}
            labels={{
              button: labels.cancelButton,
              canceling: labels.cancelingButton,
              success: labels.cancelSuccess,
              fallbackError: "No se pudo cancelar la reserva."
            }}
          />
        ) : booking.cancellationMessage ? (
          <p className="rounded-2xl border border-court-ball bg-court-ink px-4 py-3 type-body-strong text-court-ball">
            {booking.cancellationMessage}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function BookingHistoryLine({ booking }: { booking: PlayerBookingRow }) {
  const isCancelled = booking.rawStatus === "cancelled";
  const detailClassName = isCancelled ? "line-through decoration-court-ball decoration-2" : "";

  return (
    <article className="rounded-2xl border border-court-cyan/60 bg-court-panel px-4 py-3 type-body-strong text-court-cyan">
      <span className="type-label text-court-ball">{booking.status}</span>
      <span className="mx-2 text-court-cyan/60">·</span>
      <span className={`capitalize ${detailClassName}`}>
        {formatBookingDate(booking.startTime)}
      </span>
      <span className="mx-2 text-court-cyan/60">·</span>
      <span className={detailClassName}>
        {formatBookingTimeRange(booking.startTime, booking.endTime)}
      </span>
      <span className="mx-2 text-court-cyan/60">·</span>
      <span className={detailClassName}>{booking.courtName}</span>
    </article>
  );
}

export default async function MyBookingsPage() {
  const clubConfig = await getClubConfig();
  const data = await getPlayerBookingsData({
    cancelledLabel: clubConfig.copy.player.cancelledLabel,
    contactClub: clubConfig.copy.player.contactClub
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <ClubLogo clubName={clubConfig.clubName} logoUrl={clubConfig.logoUrl} />
          <p className="mt-4 type-label text-court-ball">
            {clubConfig.copy.player.eyebrow}
          </p>
          <h1 className="mt-2 type-section text-white">
            {clubConfig.copy.player.title}
          </h1>
          <p className="mt-2 max-w-2xl type-body text-court-cyan">
            {clubConfig.copy.player.subtitle}
          </p>
        </div>
        <Link
          className="rounded-2xl border border-court-cyan px-4 py-3 type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball"
          href="/"
        >
          Volver a reservar
        </Link>
        {data.isLoggedIn ? (
          <LogoutButton
            className="rounded-2xl border border-court-cyan px-4 py-3 type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            label={clubConfig.copy.auth.logoutButton}
          />
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
            logoUrl={clubConfig.logoUrl}
            user={null}
          />
        </div>
      ) : null}

      {data.isLoggedIn ? (
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-court-ball bg-court-ink p-4 shadow-soft md:p-6">
            <h2 className="type-card text-white">{clubConfig.copy.player.upcomingTitle}</h2>
            <div className="mt-4 space-y-4">
              {data.upcomingBookings.map((booking) => (
                <BookingCard
                  booking={booking}
                  key={booking.id}
                  labels={{
                    cancelButton: clubConfig.copy.player.cancelButton,
                    cancelingButton: clubConfig.copy.player.cancelingButton,
                    cancelSuccess: clubConfig.copy.player.cancelSuccess
                  }}
                />
              ))}
              {data.upcomingBookings.length === 0 ? (
                <p className="rounded-2xl border border-court-cyan bg-court-panel p-5 type-body-strong text-court-cyan">
                  {clubConfig.copy.player.emptyUpcoming}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-court-cyan bg-court-ink p-4 shadow-soft md:p-6">
            <h2 className="type-card text-white">{clubConfig.copy.player.historyTitle}</h2>
            <div className="mt-4 space-y-4">
              {data.pastBookings.slice(0, 6).map((booking) => (
                <BookingHistoryLine booking={booking} key={booking.id} />
              ))}
              {data.pastBookings.length === 0 ? (
                <p className="rounded-2xl border border-court-cyan bg-court-panel p-5 type-body-strong text-court-cyan">
                  {clubConfig.copy.player.emptyHistory}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
