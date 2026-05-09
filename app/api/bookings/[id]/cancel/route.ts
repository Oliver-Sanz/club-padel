import { NextResponse } from "next/server";
import { canCancelForFree } from "@/lib/booking-rules";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type CancelBookingContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: CancelBookingContext) {
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
    return NextResponse.json({ error: "Inicia sesion para cancelar." }, { status: 401 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id,user_id,start_time,status")
    .eq("id", id)
    .single();

  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: "No encontramos esa reserva." }, { status: 404 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Solo puedes cancelar reservas confirmadas." },
      { status: 400 }
    );
  }

  if (!canCancelForFree(new Date(booking.start_time))) {
    return NextResponse.json(
      { error: "Faltan menos de 6 horas. Contacta con el club." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_policy_status: "cancelled_free"
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cancelar la reserva." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
