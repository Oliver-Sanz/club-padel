import { NextResponse } from "next/server";
import {
  DurationMinutes,
  DurationOption,
  PriceResult,
  calculatePrice,
  getDurationOptions,
  getSlotStartDate,
  isInsideClubHours
} from "@/lib/booking-rules";
import { getAvailabilityData } from "@/lib/availability-data";
import { clubDateTimeToUtc } from "@/lib/club-time";
import { isClubAdminRole } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type CreateAdminBookingBody = {
  courtId: number;
  userId?: string | null;
  dateISO: string;
  startMinute: number;
  durationMinutes: DurationMinutes;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase todavia no esta configurado." },
      { status: 400 }
    );
  }

  const body = (await request.json()) as CreateAdminBookingBody;
  const { courtId, dateISO, startMinute, durationMinutes } = body;
  const targetUserId = body.userId ?? null;

  if (durationMinutes !== 60 && durationMinutes !== 90) {
    return NextResponse.json({ error: "Duration not allowed." }, { status: 400 });
  }

  if (!isInsideClubHours(startMinute, durationMinutes)) {
    return NextResponse.json(
      { error: "La reserva queda fuera del horario del club." },
      { status: 400 }
    );
  }

  if (getSlotStartDate(dateISO, startMinute).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "No puedes crear una reserva en una hora que ya ha pasado." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isClubAdminRole(profile?.role)) {
    return NextResponse.json({ error: "No tienes permisos de admin." }, { status: 403 });
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "Select a player for this booking." }, { status: 400 });
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "We could not find that player." }, { status: 400 });
  }

  const availability = await getAvailabilityData(dateISO);
  let options: DurationOption[];

  try {
    options = getDurationOptions({
      dateISO,
      courtId,
      startMinute,
      items: availability.scheduleItems,
      pricingRules: availability.pricingRules,
      enforceMaxBookingWindow: false
    });
  } catch {
    return NextResponse.json(
      { error: "There is no pricing rule configured for that time slot." },
      { status: 400 }
    );
  }

  const selectedOption = options.find((option) => option.duration === durationMinutes);

  if (!selectedOption?.enabled) {
    return NextResponse.json(
      { error: selectedOption?.reason ?? "Ese horario ya no esta disponible." },
      { status: 409 }
    );
  }

  let price: PriceResult;

  try {
    price = calculatePrice(dateISO, startMinute, durationMinutes, availability.pricingRules);
  } catch {
    return NextResponse.json(
      { error: "There is no pricing rule configured for that time slot." },
      { status: 400 }
    );
  }

  const startDate = clubDateTimeToUtc(dateISO, startMinute);
  const endDate = clubDateTimeToUtc(dateISO, startMinute + durationMinutes);

  const bookingPayload: {
    user_id: string;
    court_id: number;
    start_time: string;
    end_time: string;
    duration_minutes: DurationMinutes;
    status: "confirmed";
    price_total_cents: number;
    price_breakdown: PriceResult["breakdown"];
    cancellation_policy_status: string;
    created_by?: string;
  } = {
    user_id: targetUserId,
    court_id: courtId,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    duration_minutes: durationMinutes,
    status: "confirmed",
    price_total_cents: price.totalCents,
    price_breakdown: price.breakdown,
    cancellation_policy_status: "admin_manual"
  };

  bookingPayload.created_by = user.id;

  let { data, error } = await supabase
    .from("bookings")
    .insert(bookingPayload)
    .select("id")
    .single();

  if (error && "created_by" in bookingPayload) {
    delete bookingPayload.created_by;
    const retryResult = await supabase
      .from("bookings")
      .insert(bookingPayload)
      .select("id")
      .single();

    data = retryResult.data;
    error = retryResult.error;
  }

  if (error || !data) {
    return NextResponse.json(
      { error: "Could not create the booking. That slot may already be occupied." },
      { status: 409 }
    );
  }

  return NextResponse.json({ bookingId: data.id });
}
