import { getClubDateISO, getClubDayRangeUtc } from "@/lib/club-time";
import { toISODate } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AdminBookingRow = {
  id: string;
  courtId: number;
  courtName: string;
  userId: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  priceTotalCents: number;
  createdAt: string;
};

export type AdminData = {
  isConfigured: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  selectedDate: string;
  selectedCourt: string;
  courts: Array<{ id: number; name: string }>;
  bookings: AdminBookingRow[];
  dayTabs: Array<{
    dateISO: string;
    bookingCount: number;
  }>;
};

function getDayRange(dateISO: string) {
  const { start, end } = getClubDayRangeUtc(dateISO);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function buildAdminDateWindow(startDateISO: string, days = 7) {
  const start = new Date(`${startDateISO}T12:00:00`);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toISODate(date);
  });
}

function emptyAdminData(params: {
  isConfigured: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  selectedDate: string;
  selectedCourt: string;
}): AdminData {
  return {
    ...params,
    courts: [],
    bookings: [],
    dayTabs: buildAdminDateWindow(params.selectedDate).map((dateISO) => ({
      dateISO,
      bookingCount: 0
    }))
  };
}

export async function getAdminData(params: { date?: string; court?: string }): Promise<AdminData> {
  const selectedDate = params.date ?? toISODate(new Date());
  const visibleDates = buildAdminDateWindow(selectedDate);
  const selectedCourt = params.court ?? "all";

  if (!isSupabaseConfigured()) {
    return emptyAdminData({
      isConfigured: false,
      isLoggedIn: false,
      isAdmin: false,
      selectedDate,
      selectedCourt,
    });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return emptyAdminData({
      isConfigured: true,
      isLoggedIn: false,
      isAdmin: false,
      selectedDate,
      selectedCourt,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return emptyAdminData({
      isConfigured: true,
      isLoggedIn: true,
      isAdmin: false,
      selectedDate,
      selectedCourt,
    });
  }

  const { data: courts } = await supabase.from("courts").select("id,name").order("id");
  const { start } = getDayRange(selectedDate);
  const tabStart = getClubDayRangeUtc(visibleDates[0]).start.toISOString();
  const tabEnd = getClubDayRangeUtc(visibleDates[visibleDates.length - 1]).end.toISOString();

  let query = supabase
    .from("bookings")
    .select("id,court_id,user_id,start_time,end_time,duration_minutes,status,price_total_cents,created_at")
    .gte("start_time", start)
    .in("status", ["confirmed", "pending_payment"])
    .order("start_time");

  let tabsQuery = supabase
    .from("bookings")
    .select("id,court_id,start_time")
    .gte("start_time", tabStart)
    .lt("start_time", tabEnd)
    .in("status", ["confirmed", "pending_payment"]);

  if (selectedCourt !== "all") {
    query = query.eq("court_id", Number(selectedCourt));
    tabsQuery = tabsQuery.eq("court_id", Number(selectedCourt));
  }

  const [{ data: bookings }, { data: tabBookings }] = await Promise.all([query, tabsQuery]);
  const courtMap = new Map((courts ?? []).map((court) => [court.id, court.name]));
  const bookingCounts = new Map<string, number>();

  tabBookings?.forEach((booking) => {
    const dateISO = getClubDateISO(booking.start_time);
    bookingCounts.set(dateISO, (bookingCounts.get(dateISO) ?? 0) + 1);
  });

  return {
    isConfigured: true,
    isLoggedIn: true,
    isAdmin: true,
    selectedDate,
    selectedCourt,
    courts: courts ?? [],
    dayTabs: visibleDates.map((dateISO) => ({
      dateISO,
      bookingCount: bookingCounts.get(dateISO) ?? 0
    })),
    bookings:
      bookings?.map((booking) => ({
        id: booking.id,
        courtId: booking.court_id,
        courtName: courtMap.get(booking.court_id) ?? `Pista ${booking.court_id}`,
        userId: booking.user_id,
        startTime: booking.start_time,
        endTime: booking.end_time,
        durationMinutes: booking.duration_minutes,
        status: booking.status,
        priceTotalCents: booking.price_total_cents,
        createdAt: booking.created_at
      })) ?? []
  };
}
