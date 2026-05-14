import { NextResponse } from "next/server";
import {
  DurationMinutes,
  DurationOption,
  HOLD_EXPIRATION_MINUTES,
  PriceResult,
  calculatePrice,
  getDurationOptions,
  hasReachedActiveBookingLimit,
  isInsideClubHours,
  isWithinMaxBookingWindow
} from "@/lib/booking-rules";
import { getAvailabilityData } from "@/lib/availability-data";
import { clubDateTimeToUtc } from "@/lib/club-time";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type CreateHoldBody = {
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

  const body = (await request.json()) as CreateHoldBody;
  const { courtId, dateISO, startMinute, durationMinutes } = body;

  if (durationMinutes !== 60 && durationMinutes !== 90) {
    return NextResponse.json({ error: "Duration not allowed." }, { status: 400 });
  }

  if (!isInsideClubHours(startMinute, durationMinutes)) {
    return NextResponse.json(
      { error: "La reserva queda fuera del horario del club." },
      { status: 400 }
    );
  }

  const startDate = clubDateTimeToUtc(dateISO, startMinute);
  const endDate = clubDateTimeToUtc(dateISO, startMinute + durationMinutes);

  if (!isWithinMaxBookingWindow(startDate)) {
    return NextResponse.json(
      { error: "Solo puedes reservar hasta 7 dias en el futuro." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to book." }, { status: 401 });
  }

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .gte("start_time", new Date().toISOString());

  if (hasReachedActiveBookingLimit(count ?? 0)) {
    return NextResponse.json(
      { error: "Ya tienes 3 reservas activas. Cancela una antes de crear otra." },
      { status: 400 }
    );
  }

  await supabase.rpc("expire_old_booking_holds");

  const availability = await getAvailabilityData(dateISO);
  let options: DurationOption[];

  try {
    options = getDurationOptions({
      dateISO,
      courtId,
      startMinute,
      items: availability.scheduleItems,
      pricingRules: availability.pricingRules
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

  const expiresAt = new Date(Date.now() + HOLD_EXPIRATION_MINUTES * 60 * 1000);

  const { data, error } = await supabase
    .from("booking_holds")
    .insert({
      user_id: user.id,
      court_id: courtId,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "active"
    })
    .select("id,expires_at")
    .single();

  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Your player profile has not been created yet. Sign out, sign back in, and try again." },
        { status: 409 }
      );
    }

    if (error.code === "23P01") {
      return NextResponse.json(
        { error: "Ese hueco acaba de ocuparse mientras lo guardabas. Elige otro horario." },
        { status: 409 }
      );
    }

    if (error.code === "42501") {
      return NextResponse.json(
        { error: "Tu usuario no tiene permisos completos todavia. Cierra sesion, entra otra vez y reintenta." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Could not hold the slot temporarily. Someone may have picked it already." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    holdId: data.id,
    expiresAt: data.expires_at,
    price
  });
}
