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
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type CreateAdminBookingBody = {
  courtId: number;
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

  if (durationMinutes !== 60 && durationMinutes !== 90) {
    return NextResponse.json({ error: "Duracion no permitida." }, { status: 400 });
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
    return NextResponse.json({ error: "Inicia sesion como admin." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos de admin." }, { status: 403 });
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
      { error: "No hay una regla de precio configurada para ese horario." },
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
      { error: "No hay una regla de precio configurada para ese horario." },
      { status: 400 }
    );
  }

  const startDate = clubDateTimeToUtc(dateISO, startMinute);
  const endDate = clubDateTimeToUtc(dateISO, startMinute + durationMinutes);

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      court_id: courtId,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: durationMinutes,
      status: "confirmed",
      price_total_cents: price.totalCents,
      price_breakdown: price.breakdown,
      cancellation_policy_status: "admin_manual"
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo crear la reserva. Puede que ese hueco ya este ocupado." },
      { status: 409 }
    );
  }

  return NextResponse.json({ bookingId: data.id });
}
