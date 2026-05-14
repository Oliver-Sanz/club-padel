import { getClubDateISO, getClubDayRangeUtc } from "@/lib/club-time";
import { toISODate } from "@/lib/format";
import { isClubAdminRole, isPlayerRole, isSuperAdminRole } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/supabase/session";

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

export type AdminPlayerRow = {
  id: string;
  label: string;
  role: string | null;
};

export type AdminData = {
  isConfigured: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  currentUserLabel: string | null;
  currentRoleLabel: string | null;
  currentScopeLabel: string | null;
  selectedDate: string;
  selectedCourt: string;
  courts: Array<{ id: number; name: string }>;
  players: AdminPlayerRow[];
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
  isSuperAdmin?: boolean;
  selectedDate: string;
  selectedCourt: string;
}): AdminData {
  return {
    ...params,
    isSuperAdmin: params.isSuperAdmin ?? false,
    currentUserLabel: null,
    currentRoleLabel: null,
    currentScopeLabel: null,
    courts: [],
    players: [],
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
      isSuperAdmin: false,
      selectedDate,
      selectedCourt,
    });
  }

  const supabase = await createClient();
  const user = await getSafeUser(supabase);

  if (!user) {
    return emptyAdminData({
      isConfigured: true,
      isLoggedIn: false,
      isAdmin: false,
      isSuperAdmin: false,
      selectedDate,
      selectedCourt,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name,email")
    .eq("id", user.id)
    .single();

  if (!isClubAdminRole(profile?.role)) {
    return emptyAdminData({
      isConfigured: true,
      isLoggedIn: true,
      isAdmin: false,
      isSuperAdmin: false,
      selectedDate,
      selectedCourt,
    });
  }

  const [{ data: courts }, { data: profiles }] = await Promise.all([
    supabase.from("courts").select("id,name").order("id"),
    supabase.from("profiles").select("id,full_name,email,role").order("created_at")
  ]);
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
    isSuperAdmin: isSuperAdminRole(profile?.role),
    currentUserLabel: profile?.full_name || profile?.email || user.email || null,
    currentRoleLabel: isSuperAdminRole(profile?.role) ? "Super admin" : "Admin club",
    currentScopeLabel: isSuperAdminRole(profile?.role) ? "Plataforma" : "Club",
    selectedDate,
    selectedCourt,
    courts: courts ?? [],
    players:
      profiles
        ?.filter((profile) => isPlayerRole(profile.role))
        .map((profile) => ({
          id: profile.id,
          label: profile.full_name || profile.email || "Jugador sin nombre",
          role: profile.role
        })) ?? [],
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
