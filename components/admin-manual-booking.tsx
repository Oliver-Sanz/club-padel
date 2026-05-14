"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DurationMinutes,
  generateTimeSlots,
  getDurationOptions,
  minutesToTime
} from "@/lib/booking-rules";
import { AvailabilityData } from "@/lib/availability-data";
import { type ClubCopy } from "@/lib/club-branding";
import { formatMoney, formatRange } from "@/lib/format";
import { UI_LABELS, type SupportedLocale } from "@/lib/i18n";

type AdminManualBookingProps = {
  selectedDate: string;
  courts: Array<{ id: number; name: string }>;
  players: Array<{ id: string; label: string }>;
  copy: ClubCopy["admin"];
  locale: SupportedLocale;
};

export function AdminManualBooking({ selectedDate, courts, players, copy, locale }: AdminManualBookingProps) {
  const router = useRouter();
  const [courtId, setCourtId] = useState(() => courts[0]?.id ?? 1);
  const [playerId, setPlayerId] = useState(() => players[0]?.id ?? "");
  const [startMinute, setStartMinute] = useState(8 * 60);
  const [duration, setDuration] = useState<DurationMinutes>(60);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const timePickerRef = useRef<HTMLDivElement | null>(null);
  const ui = UI_LABELS[locale];

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const selectedCourt = courts.find((court) => court.id === courtId);
  const selectedPlayer = players.find((player) => player.id === playerId);
  const timeOptions = useMemo(() => {
    if (!availability) {
      return timeSlots.map((minute) => ({
        minute,
        label: minutesToTime(minute),
        enabled: false,
        stateLabel: ui.loading
      }));
    }

    return timeSlots.map((minute) => {
      try {
        const options = getDurationOptions({
          dateISO: selectedDate,
          courtId,
          startMinute: minute,
          items: availability.scheduleItems,
          pricingRules: availability.pricingRules,
          enforceMaxBookingWindow: false
        });
        const hasAnyAvailableDuration = options.some((option) => option.enabled);
        const reason = options.find((option) => option.reason)?.reason ?? "";
        const stateLabel = hasAnyAvailableDuration
          ? ui.available
          : reason.includes("passed") || reason.includes("pasado")
            ? ui.past
            : ui.occupied;

        return {
          minute,
          label: `${minutesToTime(minute)} - ${stateLabel}`,
          enabled: hasAnyAvailableDuration,
          stateLabel
        };
      } catch {
        return {
          minute,
          label: `${minutesToTime(minute)} - ${ui.noPrice}`,
          enabled: false,
          stateLabel: ui.noPrice
        };
      }
    });
  }, [availability, courtId, selectedDate, timeSlots]);

  const selectedOptions = useMemo(() => {
    if (!availability) {
      return [];
    }

    try {
      return getDurationOptions({
        dateISO: selectedDate,
        courtId,
        startMinute,
        items: availability.scheduleItems,
        pricingRules: availability.pricingRules,
        enforceMaxBookingWindow: false
      });
    } catch {
      return [];
    }
  }, [availability, courtId, selectedDate, startMinute]);

  const selectedDurationOption = selectedOptions.find((option) => option.duration === duration);
  const selectedTimeOption = timeOptions.find((option) => option.minute === startMinute);

  useEffect(() => {
    let ignore = false;

    async function loadAvailability() {
      setIsLoading(true);
      setMessage("");

      try {
        const response = await fetch(`/api/availability?date=${selectedDate}`);
        const data = (await response.json()) as AvailabilityData;

        if (!ignore) {
          setAvailability(data);
        }
      } catch {
        if (!ignore) {
          setMessage(
            locale === "es"
              ? "No se pudo cargar la disponibilidad de ese dia."
              : "Could not load availability for that day."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      ignore = true;
    };
  }, [selectedDate]);

  useEffect(() => {
    function closeTimePickerOnOutsideClick(event: MouseEvent) {
      if (
        timePickerRef.current &&
        event.target instanceof Node &&
        !timePickerRef.current.contains(event.target)
      ) {
        setIsTimePickerOpen(false);
      }
    }

    document.addEventListener("mousedown", closeTimePickerOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeTimePickerOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    const firstEnabledTime = timeOptions.find((option) => option.enabled);

    if (firstEnabledTime && !selectedTimeOption?.enabled) {
      setStartMinute(firstEnabledTime.minute);
    }
  }, [selectedTimeOption?.enabled, timeOptions]);

  useEffect(() => {
    const firstEnabled = selectedOptions.find((option) => option.enabled);

    if (firstEnabled && !selectedDurationOption?.enabled) {
      setDuration(firstEnabled.duration);
    }
  }, [selectedDurationOption?.enabled, selectedOptions]);

  useEffect(() => {
    if (!playerId && players[0]?.id) {
      setPlayerId(players[0].id);
    }
  }, [playerId, players]);

  async function createManualBooking() {
    setIsSubmitting(true);
    setMessage(ui.createManualBooking);

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          courtId,
          userId: playerId || null,
          dateISO: selectedDate,
          startMinute,
          durationMinutes: duration
        })
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? ui.createManualBookingError);
        return;
      }

      setMessage(ui.createManualBookingSuccess);
      router.refresh();
    } catch {
      setMessage(ui.serverError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mb-6 rounded-[1.75rem] border border-court-ball bg-court-panel p-4 md:p-5">
      <div className="mb-4">
        <p className="type-label text-court-ball">
          {copy.manualTitle}
        </p>
        <h2 className="mt-1 type-card text-white">
          {ui.chooseManualBooking}
        </h2>
        <p className="mt-2 type-body text-court-cyan">
          {copy.manualSubtitle}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
        <label className="grid gap-2 type-body-strong text-court-cyan">
          {ui.player}
          <select
            className="rounded-2xl border border-court-cyan bg-court-ink px-4 py-3 text-white outline-none focus:border-court-ball"
            disabled={players.length === 0}
            onChange={(event) => setPlayerId(event.target.value)}
            value={playerId}
          >
            {players.length === 0 ? (
              <option value="">{ui.noPlayers}</option>
            ) : null}
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 type-body-strong text-court-cyan">
          {ui.court}
          <select
            className="rounded-2xl border border-court-cyan bg-court-ink px-4 py-3 text-white outline-none focus:border-court-ball"
            onChange={(event) => setCourtId(Number(event.target.value))}
            value={courtId}
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 type-body-strong text-court-cyan">
          {ui.time}
          <div className="relative" ref={timePickerRef}>
            <button
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-court-cyan bg-court-ink px-4 py-3 text-left text-white outline-none transition focus:border-court-ball"
              onClick={() => setIsTimePickerOpen((isOpen) => !isOpen)}
              type="button"
            >
              <span>{selectedTimeOption?.label ?? ui.selectTime}</span>
              <span className="type-card text-court-cyan">⌄</span>
            </button>

            {isTimePickerOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-72 overflow-y-auto rounded-2xl border border-court-cyan bg-court-ink p-2 shadow-soft">
                {timeOptions.map((option) => (
                  <button
                    className={[
                      "mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left type-body-strong transition last:mb-0",
                      option.enabled
                        ? "text-white hover:bg-court-cyan/15 hover:text-court-ball"
                        : "cursor-not-allowed text-court-grey/45"
                    ].join(" ")}
                    disabled={!option.enabled}
                    key={option.minute}
                    onClick={() => {
                      setStartMinute(option.minute);
                      setIsTimePickerOpen(false);
                    }}
                    type="button"
                  >
                    <span>{minutesToTime(option.minute)}</span>
                    <span
                      className={[
                        "rounded-full px-2 py-1 type-badge",
                        option.enabled
                          ? "bg-court-ball text-court-ink"
                          : "bg-court-panel text-court-grey/60"
                      ].join(" ")}
                    >
                      {option.stateLabel}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </label>

        <div className="grid gap-2 type-body-strong text-court-cyan">
          {ui.duration}
          <div className="grid grid-cols-2 gap-2">
            {selectedOptions.map((option) => (
              <button
                className={[
                  "rounded-2xl border px-4 py-3 text-left type-button transition",
                  duration === option.duration
                    ? "border-court-ball bg-court-ball text-court-ink shadow-glow"
                    : "border-court-cyan bg-court-ink text-court-cyan",
                  !option.enabled ? "cursor-not-allowed opacity-45" : ""
                ].join(" ")}
                disabled={!option.enabled}
                key={option.duration}
                onClick={() => setDuration(option.duration)}
                type="button"
              >
                {option.duration} min
              </button>
            ))}
          </div>
        </div>

        <button
          className="rounded-2xl bg-court-ball px-5 py-3 type-button text-court-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-court-cyan/20 disabled:text-court-cyan/55"
          disabled={!playerId || !selectedDurationOption?.enabled || isLoading || isSubmitting}
          onClick={createManualBooking}
          type="button"
        >
          {isSubmitting ? ui.creating : ui.createBooking}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-court-cyan bg-court-ink p-4 type-body-strong text-court-cyan">
        {selectedDurationOption?.enabled ? (
          <p>
            {selectedPlayer?.label ?? ui.player} · {selectedCourt?.name ?? ui.court} · {formatRange(startMinute, startMinute + duration)} ·{" "}
            {formatMoney(selectedDurationOption.price?.totalCents ?? 0, "EUR", locale)}
          </p>
        ) : (
          <p>
            {selectedDurationOption?.reason ??
              ui.selectAvailableSlot}
          </p>
        )}
      </div>

      {message ? (
        <p className="mt-3 rounded-2xl border border-court-ball bg-court-ink px-4 py-3 type-body-strong text-court-ball">
          {message}
        </p>
      ) : null}
    </section>
  );
}
