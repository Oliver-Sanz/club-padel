"use client";

import { useEffect, useMemo, useState } from "react";
import { DurationMinutes, DurationOption, minutesToTime } from "@/lib/booking-rules";
import { formatDateLabel, formatMoney, formatRange } from "@/lib/format";
import { type ClubCopy } from "@/lib/club-branding";

type SelectedSlot = {
  courtName: string;
  dateISO: string;
  startMinute: number;
};

type BookingDrawerProps = {
  selectedSlot: SelectedSlot | null;
  options: DurationOption[];
  canCreateBookings: boolean;
  message: string;
  isSubmitting: boolean;
  activeHold: {
    expiresAt: string;
    durationMinutes: DurationMinutes;
  } | null;
  copy: ClubCopy["booking"];
  onClose: () => void;
  onConfirmBooking: (duration: DurationMinutes) => Promise<void>;
};

export function BookingDrawer({
  selectedSlot,
  options,
  canCreateBookings,
  message,
  isSubmitting,
  activeHold,
  copy,
  onClose,
  onConfirmBooking
}: BookingDrawerProps) {
  const firstEnabled = useMemo(() => options.find((option) => option.enabled), [options]);
  const [selectedDuration, setSelectedDuration] = useState<DurationMinutes | null>(
    firstEnabled?.duration ?? null
  );

  useEffect(() => {
    setSelectedDuration(firstEnabled?.duration ?? null);
  }, [firstEnabled]);

  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!activeHold) {
      setSecondsLeft(0);
      return;
    }

    const currentHold = activeHold;

    function updateSecondsLeft() {
      const remainingMs = new Date(currentHold.expiresAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
    }

    updateSecondsLeft();
    const interval = window.setInterval(updateSecondsLeft, 1000);

    return () => window.clearInterval(interval);
  }, [activeHold]);

  if (!selectedSlot) {
    return null;
  }

  const selectedOption = options.find((option) => option.duration === selectedDuration);
  const canSubmit = Boolean(activeHold) || Boolean(selectedOption?.enabled);
  const minutesLeft = Math.floor(secondsLeft / 60);
  const paddedSecondsLeft = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-court-ink/85 p-3 backdrop-blur-sm md:items-center md:justify-center">
      <section className="w-full rounded-[2rem] border border-court-ball bg-court-panel p-5 shadow-soft md:max-w-xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-court-ball">{copy.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {selectedSlot.courtName}
            </h2>
            <p className="mt-1 text-sm text-court-cyan">
              {copy.title} · {formatDateLabel(selectedSlot.dateISO)} a las {minutesToTime(selectedSlot.startMinute)}
            </p>
          </div>
          <button
            className="rounded-full border border-court-cyan px-4 py-2 text-sm font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
        </div>

        {activeHold ? (
          <div className="mb-4 rounded-2xl border border-court-ball bg-court-ink p-4 text-center shadow-glow">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-court-ball">
              {copy.activeHoldLabel}
            </p>
            <p className="mt-2 text-3xl font-black text-white">
              {minutesLeft}:{paddedSecondsLeft}
            </p>
            <p className="mt-1 text-sm font-semibold text-court-cyan">
              Este horario esta guardado para ti mientras termina el contador.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = selectedDuration === option.duration;
            const endMinute = selectedSlot.startMinute + option.duration;

            return (
              <button
                className={[
                  "w-full rounded-2xl border p-4 text-left transition",
                  option.enabled
                    ? "border-court-cyan bg-court-ink text-white hover:border-court-ball focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-court-ball"
                    : "border-dashed border-court-cyan/50 bg-court-ink text-court-cyan/70",
                  isSelected ? "border-court-ball bg-court-navy ring-2 ring-court-ball shadow-glow" : ""
                ].join(" ")}
                disabled={!option.enabled}
                key={option.duration}
                onClick={() => setSelectedDuration(option.duration)}
                type="button"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-black">{option.duration} minutos</p>
                    <p className="text-sm text-court-cyan">
                      {formatRange(selectedSlot.startMinute, endMinute)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-court-ball">
                      {option.price ? formatMoney(option.price.totalCents) : "-"}
                    </p>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-court-cyan">
                      {option.enabled ? "Disponible" : "No disponible"}
                    </p>
                  </div>
                </div>
                {option.reason ? (
                  <p className="mt-3 rounded-xl border border-court-ball bg-court-ink px-3 py-2 text-sm font-black text-court-ball">
                    {option.reason}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          className="mt-5 w-full rounded-2xl bg-court-ball px-5 py-4 text-base font-black text-court-ink shadow-glow transition hover:translate-y-[-1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-court-cyan disabled:cursor-not-allowed disabled:bg-court-cyan/20 disabled:text-court-cyan/55"
          disabled={!canSubmit || !canCreateBookings || isSubmitting}
          onClick={() => {
            if (activeHold) {
              void onConfirmBooking(activeHold.durationMinutes);
              return;
            }

            if (selectedOption?.enabled) {
              void onConfirmBooking(selectedOption.duration);
            }
          }}
          type="button"
        >
          {isSubmitting
            ? activeHold
              ? "Confirmando reserva..."
              : "Guardando horario..."
            : canCreateBookings
              ? activeHold
                ? "Confirmar reserva"
                : copy.buttonLabel
              : "Inicia sesion para reservar"}
        </button>

        {message ? (
          <p className="mt-3 rounded-2xl border border-court-ball bg-court-ink px-4 py-3 text-center text-sm font-black text-court-ball">
            {message}
          </p>
        ) : null}

        <p className="mt-3 text-center text-xs font-semibold text-court-cyan">
          En Fase 3 el horario se guarda temporalmente 6 minutos. En Fase 4 este paso ira a Stripe.
        </p>
      </section>
    </div>
  );
}
