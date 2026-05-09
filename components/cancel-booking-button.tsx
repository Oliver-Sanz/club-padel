"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CancelBookingButtonProps = {
  bookingId: string;
};

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  async function cancelBooking() {
    setIsCancelling(true);
    setMessage("");

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST"
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? "No se pudo cancelar la reserva.");
        return;
      }

      setMessage("Reserva cancelada.");
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div>
      <button
        className="rounded-2xl border border-court-ball px-4 py-3 text-sm font-black text-court-ball transition hover:bg-court-ball hover:text-court-ink disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isCancelling}
        onClick={cancelBooking}
        type="button"
      >
        {isCancelling ? "Cancelando..." : "Cancelar reserva"}
      </button>
      {message ? <p className="mt-2 text-sm font-black text-court-ball">{message}</p> : null}
    </div>
  );
}
