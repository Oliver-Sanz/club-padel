"use client";

import { useEffect, useMemo, useState } from "react";
import { DurationMinutes, DurationOption, minutesToTime } from "@/lib/booking-rules";
import { formatDateLabel, formatMoney, formatRange } from "@/lib/format";
import { type ClubCopy } from "@/lib/club-branding";
import { UI_LABELS, type SupportedLocale } from "@/lib/i18n";
import { AuthPromptModal } from "@/components/auth-prompt-modal";

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
  copy: ClubCopy;
  isConfigured: boolean;
  locale: SupportedLocale;
  clubName: string;
  logoUrl: string | null;
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
  isConfigured,
  locale,
  clubName,
  logoUrl,
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
  const ui = UI_LABELS[locale];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-court-ink/85 p-3 backdrop-blur-sm md:items-center md:justify-center">
      <section className="w-full rounded-[2rem] border border-court-ball bg-court-panel p-5 shadow-soft md:max-w-xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="type-label text-court-ball">{copy.booking.eyebrow}</p>
            <h2 className="mt-2 type-card text-white">
              {selectedSlot.courtName}
            </h2>
            <p className="mt-1 type-body text-court-cyan">
              {copy.booking.title} · {formatDateLabel(selectedSlot.dateISO, locale)} {ui.at} {minutesToTime(selectedSlot.startMinute)}
            </p>
          </div>
          <button
            className="rounded-full border border-court-cyan px-4 py-2 type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            onClick={onClose}
            type="button"
          >
            {ui.close}
          </button>
        </div>

        {activeHold ? (
          <div className="mb-4 rounded-2xl border border-court-ball bg-court-ink p-4 text-center shadow-glow">
            <p className="type-label text-court-ball">
              {copy.booking.activeHoldLabel}
            </p>
            <p className="mt-2 type-display text-white">
              {minutesLeft}:{paddedSecondsLeft}
            </p>
            <p className="mt-1 type-body text-court-cyan">
              {ui.holdCountdown}
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
                    <p className="type-body-strong">
                      {option.duration} {ui.minutes}
                    </p>
                    <p className="type-body text-court-cyan">
                      {formatRange(selectedSlot.startMinute, endMinute)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="type-card text-court-ball">
                      {option.price ? formatMoney(option.price.totalCents, "EUR", locale) : "-"}
                    </p>
                    <p className="type-badge text-court-cyan">
                      {option.enabled ? ui.available : ui.unavailable}
                    </p>
                  </div>
                </div>
                {option.reason ? (
                  <p className="mt-3 rounded-xl border border-court-ball bg-court-ink px-3 py-2 type-body-strong text-court-ball">
                    {option.reason}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          className="mt-5 w-full rounded-2xl bg-court-ball px-5 py-4 type-button text-court-ink shadow-glow transition hover:translate-y-[-1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-court-cyan disabled:cursor-not-allowed disabled:bg-court-cyan/20 disabled:text-court-cyan/55"
          disabled={!canSubmit || isSubmitting}
          onClick={() => {
            if (!canCreateBookings) {
              setIsAuthModalOpen(true);
              return;
            }

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
              ? ui.confirmingBooking
              : ui.savingTimeSlot
            : canCreateBookings
              ? activeHold
                ? ui.confirmBooking
                : copy.booking.buttonLabel
              : ui.signInToBook}
        </button>

        {message ? (
          <p className="mt-3 rounded-2xl border border-court-ball bg-court-ink px-4 py-3 text-center type-body-strong text-court-ball">
            {message}
          </p>
        ) : null}

        <p className="mt-3 text-center type-note text-court-cyan">
          {ui.holdFootnote}
        </p>
      </section>

      {isAuthModalOpen ? (
        <AuthPromptModal
          clubName={clubName}
          copy={copy.auth}
          isConfigured={isConfigured}
          locale={locale}
          logoUrl={logoUrl}
          onClose={() => setIsAuthModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
