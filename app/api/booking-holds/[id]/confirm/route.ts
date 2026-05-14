import { NextResponse } from "next/server";
import {
  DurationMinutes,
  PriceResult,
  calculatePrice
} from "@/lib/booking-rules";
import { getAvailabilityData } from "@/lib/availability-data";
import { getClubDateISO, getClubMinuteOfDay } from "@/lib/club-time";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type ConfirmHoldContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: ConfirmHoldContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase todavia no esta configurado." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to confirm." }, { status: 401 });
  }

  await supabase.rpc("expire_old_booking_holds");

  const { data: hold } = await supabase
    .from("booking_holds")
    .select("id,user_id,court_id,start_time,end_time,expires_at,status")
    .eq("id", id)
    .single();

  if (!hold || hold.user_id !== user.id) {
    return NextResponse.json({ error: "No encontramos esa reserva temporal." }, { status: 404 });
  }

  if (hold.status !== "active") {
    return NextResponse.json({ error: "Esta reserva temporal ya no esta activa." }, { status: 400 });
  }

  if (new Date(hold.expires_at).getTime() <= Date.now()) {
    await supabase.from("booking_holds").update({ status: "expired" }).eq("id", id);
    return NextResponse.json({ error: "El tiempo de reserva temporal ha expirado." }, { status: 400 });
  }

  const dateISO = getClubDateISO(hold.start_time);
  const startMinute = getClubMinuteOfDay(hold.start_time);
  const endMinute = getClubMinuteOfDay(hold.end_time);
  const durationMinutes = (endMinute - startMinute) as DurationMinutes;
  const availability = await getAvailabilityData(dateISO);
  let price: PriceResult;

  try {
    price = calculatePrice(dateISO, startMinute, durationMinutes, availability.pricingRules);
  } catch {
    return NextResponse.json(
      { error: "There is no pricing rule configured for that time slot." },
      { status: 400 }
    );
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      court_id: hold.court_id,
      start_time: hold.start_time,
      end_time: hold.end_time,
      duration_minutes: durationMinutes,
      status: "confirmed",
      price_total_cents: price.totalCents,
      price_breakdown: price.breakdown,
      cancellation_policy_status: "free_until_6h_before"
    })
    .select("id")
    .single();

  if (bookingError) {
    return NextResponse.json(
      { error: "Could not confirm the booking. That slot may no longer be available." },
      { status: 409 }
    );
  }

  await supabase.from("booking_holds").update({ status: "converted" }).eq("id", id);

  return NextResponse.json({ bookingId: booking.id });
}
