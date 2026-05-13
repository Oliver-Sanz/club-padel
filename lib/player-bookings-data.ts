import { canCancelForFree } from "@/lib/booking-rules";
import { type ClubCopy } from "@/lib/club-branding";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/supabase/session";

export type PlayerBookingRow = {
  id: string;
  courtName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  rawStatus: string;
  priceTotalCents: number;
  canCancel: boolean;
  cancellationMessage: string;
};

export type PlayerBookingsData = {
  isConfigured: boolean;
  isLoggedIn: boolean;
  upcomingBookings: PlayerBookingRow[];
  pastBookings: PlayerBookingRow[];
};

function mapBookingStatus(status: string, cancelledLabel = "Cancelada") {
  if (status === "confirmed") {
    return "Confirmada";
  }

  if (status === "pending_payment") {
    return "En proceso";
  }

  if (status === "cancelled") {
    return cancelledLabel;
  }

  if (status === "expired") {
    return "Expirada";
  }

  return status;
}

export async function getPlayerBookingsData(labels?: Pick<ClubCopy["player"], "cancelledLabel" | "contactClub">): Promise<PlayerBookingsData> {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      isLoggedIn: false,
      upcomingBookings: [],
      pastBookings: []
    };
  }

  const supabase = await createClient();
  const user = await getSafeUser(supabase);

  if (!user) {
    return {
      isConfigured: true,
      isLoggedIn: false,
      upcomingBookings: [],
      pastBookings: []
    };
  }

  const [{ data: bookings }, { data: courts }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,court_id,start_time,end_time,duration_minutes,status,price_total_cents")
      .eq("user_id", user.id)
      .order("start_time", { ascending: false }),
    supabase.from("courts").select("id,name")
  ]);

  const now = new Date();
  const courtMap = new Map((courts ?? []).map((court) => [court.id, court.name]));
  const rows =
    bookings?.map((booking) => {
      const start = new Date(booking.start_time);
      const isFuture = start.getTime() > now.getTime();
      const isConfirmed = booking.status === "confirmed";
      const canCancel = isFuture && isConfirmed && canCancelForFree(start, now);
      const cancellationMessage =
        isFuture && isConfirmed
          ? canCancel
            ? "Cancelacion gratis disponible"
            : labels?.contactClub ?? "Faltan menos de 6 horas: contacta con el club"
          : "";

      return {
        id: booking.id,
        courtName: courtMap.get(booking.court_id) ?? `Pista ${booking.court_id}`,
        startTime: booking.start_time,
        endTime: booking.end_time,
        durationMinutes: booking.duration_minutes,
        status: mapBookingStatus(booking.status, labels?.cancelledLabel),
        rawStatus: booking.status,
        priceTotalCents: booking.price_total_cents,
        canCancel,
        cancellationMessage
      };
    }) ?? [];

  return {
    isConfigured: true,
    isLoggedIn: true,
    upcomingBookings: rows
      .filter((booking) => {
        return (
          new Date(booking.startTime).getTime() >= now.getTime() &&
          (booking.rawStatus === "confirmed" || booking.rawStatus === "pending_payment")
        );
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    pastBookings: rows.filter((booking) => {
      return (
        new Date(booking.startTime).getTime() < now.getTime() ||
        booking.rawStatus === "cancelled" ||
        booking.rawStatus === "expired"
      );
    })
  };
}
