"use client";

import { UIEvent, useMemo, useRef, useState } from "react";
import {
  DurationOption,
  getDurationOptions,
  generateTimeSlots,
  getSlotVisualStatus,
  isSlotInsideBookingWindow,
  minutesToTime
} from "@/lib/booking-rules";
import { AvailabilityData } from "@/lib/availability-data";
import { type ClubCopy } from "@/lib/club-branding";
import { buildDateOptions } from "@/lib/format";
import { pricingRules as mockPricingRules } from "@/lib/mock-data";
import { BookingDrawer } from "@/components/booking-drawer";
import { DatePicker } from "@/components/date-picker";

type SelectedSlot = {
  courtId: number;
  courtName: string;
  dateISO: string;
  startMinute: number;
};

type ActiveHold = {
  id: string;
  expiresAt: string;
  durationMinutes: 60 | 90;
} | null;

const statusClasses = {
  available:
    "border-court-cyan bg-court-navy text-court-cyan hover:border-court-ball hover:text-court-ball focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-court-ball",
  unavailable: "border-court-cyan/30 bg-court-ink text-court-cyan/45",
  confirmed: "border-court-cyan/70 bg-court-ink text-court-cyan",
  blocked: "border-court-ball bg-court-ink text-court-ball",
  event: "border-court-cyan/70 bg-court-ink text-court-cyan",
  pending_payment: "border-court-ball bg-court-ink text-court-ball shadow-glow"
};

type AvailabilityBoardProps = {
  initialData: AvailabilityData;
  canCreateBookings: boolean;
  copy: ClubCopy;
};

function isAvailabilityData(value: unknown): value is AvailabilityData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<AvailabilityData>;

  return (
    Array.isArray(data.courts) &&
    Array.isArray(data.scheduleItems) &&
    Array.isArray(data.pricingRules) &&
    (data.source === "mock" || data.source === "supabase")
  );
}

export function AvailabilityBoard({ initialData, canCreateBookings, copy }: AvailabilityBoardProps) {
  const [selectedDate, setSelectedDate] = useState(() => buildDateOptions(1)[0]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [availabilityData, setAvailabilityData] = useState(initialData);
  const [drawerOptions, setDrawerOptions] = useState<DurationOption[]>([]);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [activeHold, setActiveHold] = useState<ActiveHold>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isSyncing = useRef(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const now = useMemo(() => new Date(), []);
  const courts = availabilityData.courts;
  const scheduleItems = availabilityData.scheduleItems;
  const pricingRules =
    availabilityData.pricingRules.length > 0 ? availabilityData.pricingRules : mockPricingRules;
  const statusCopy = {
    available: copy.booking.legendAvailable,
    unavailable: "Pasado",
    confirmed: copy.booking.legendBooked,
    blocked: copy.booking.legendBlocked,
    event: copy.booking.legendBooked,
    pending_payment: copy.booking.legendInProgress
  } as const;

  const selectedOptions = activeHold ? drawerOptions : selectedSlot ? drawerOptions : [];

  function syncScroll(event: UIEvent<HTMLDivElement>, originIndex: number) {
    if (isSyncing.current) {
      return;
    }

    isSyncing.current = true;
    const scrollLeft = event.currentTarget.scrollLeft;

    rowRefs.current.forEach((row, index) => {
      if (row && index !== originIndex) {
        row.scrollLeft = scrollLeft;
      }
    });

    window.requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }

  function selectSlot(courtId: number, courtName: string, startMinute: number) {
    const options = getDurationOptions({
      dateISO: selectedDate,
      courtId,
      startMinute,
      items: scheduleItems,
      pricingRules,
      now
    });

    if (!options.some((option) => option.enabled)) {
      return;
    }

    setSelectedSlot({
      courtId,
      courtName,
      dateISO: selectedDate,
      startMinute
    });
    setDrawerOptions(options);
    setActiveHold(null);
    setBookingMessage("");
  }

  async function changeDate(dateISO: string) {
    setSelectedDate(dateISO);
    setSelectedSlot(null);
    setDrawerOptions([]);
    setActiveHold(null);
    setBookingMessage("");
    setIsLoadingDate(true);

    try {
      const response = await fetch(`/api/availability?date=${dateISO}`);
      const data = (await response.json()) as unknown;

      if (!response.ok || !isAvailabilityData(data)) {
        throw new Error("Invalid availability response");
      }

      setAvailabilityData(data);
    } catch {
      setBookingMessage(copy.booking.holdRefreshError);
    } finally {
      setIsLoadingDate(false);
    }
  }

  async function refreshAvailability(dateISO: string) {
    try {
      const response = await fetch(`/api/availability?date=${dateISO}`);
      const data = (await response.json()) as unknown;

      if (!response.ok || !isAvailabilityData(data)) {
        throw new Error("Invalid availability response");
      }

      setAvailabilityData(data);
    } catch {
      setBookingMessage(copy.booking.holdRefreshError);
    }
  }

  async function createBooking(durationMinutes: 60 | 90) {
    if (!selectedSlot) {
      return;
    }

    if (isCreatingBooking) {
      return;
    }

    setBookingMessage(activeHold ? "Confirmando reserva..." : copy.booking.loadingMessage);
    setIsCreatingBooking(true);

    try {
      const response = await fetch(
        activeHold ? `/api/booking-holds/${activeHold.id}/confirm` : "/api/booking-holds",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: activeHold
            ? undefined
            : JSON.stringify({
                courtId: selectedSlot.courtId,
                dateISO: selectedSlot.dateISO,
                startMinute: selectedSlot.startMinute,
                durationMinutes
              })
        }
      );

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        holdId?: string;
        expiresAt?: string;
      };

      if (!response.ok) {
        setBookingMessage(result.error ?? copy.booking.holdRefreshError);
        return;
      }

      if (!activeHold) {
        if (!result.holdId || !result.expiresAt) {
          setBookingMessage(copy.booking.holdRefreshError);
          return;
        }

        setActiveHold({
          id: result.holdId,
          expiresAt: result.expiresAt,
          durationMinutes
        });
        setBookingMessage(copy.booking.holdSuccess);
        await refreshAvailability(selectedDate);
        return;
      }

      setBookingMessage("Reserva confirmada. Actualizando disponibilidad...");
      setActiveHold(null);
      setSelectedSlot(null);
      setDrawerOptions([]);
      await changeDate(selectedDate);
    } catch {
      setBookingMessage(copy.booking.holdRefreshError);
    } finally {
      setIsCreatingBooking(false);
    }
  }

  return (
    <section className="min-w-0 rounded-[2rem] border border-court-ball bg-court-ink p-3 shadow-soft md:p-6">
      <div className="mb-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-court-ball">
            {copy.booking.eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">
            {copy.booking.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-court-cyan">
            {copy.booking.subtitle}
          </p>
          <p className="mt-3 inline-flex rounded-full border border-court-cyan bg-court-panel px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-court-cyan">
            Datos:{" "}
            {availabilityData.source === "supabase"
              ? copy.system.dataSourceSupabase
              : copy.system.dataSourceMock}
          </p>
          {isLoadingDate ? (
            <p className="mt-2 text-sm font-black text-court-ball">
              {copy.system.updatingAvailability}
            </p>
          ) : null}
          {bookingMessage ? (
            <p className="mt-2 text-sm font-black text-court-ball">{bookingMessage}</p>
          ) : null}
        </div>

        <div className="min-w-0">
          <DatePicker onSelectDate={changeDate} selectedDate={selectedDate} />
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        {courts.map((court, courtIndex) => (
          <article className="min-w-0 rounded-3xl border border-court-ball bg-court-panel p-3" key={court.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-white">{court.name}</h3>
              <span className="rounded-full bg-court-ball px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-court-ink">
                08:00-23:00
              </span>
            </div>

            <div
              className="scrollbar-soft overflow-x-auto pb-2"
              onScroll={(event) => syncScroll(event, courtIndex)}
              ref={(node) => {
                rowRefs.current[courtIndex] = node;
              }}
            >
              <div className="grid w-max grid-flow-col auto-cols-[76px] gap-2">
                {timeSlots.map((startMinute) => {
                  const visualStatus = getSlotVisualStatus(
                    scheduleItems,
                    court.id,
                    startMinute,
                    now
                  );
                  const isBookable = isSlotInsideBookingWindow(selectedDate, startMinute, now);
                  const slotStatus =
                    visualStatus === "available" && !isBookable ? "unavailable" : visualStatus;
                  const isAvailable = slotStatus === "available";

                  return (
                    <button
                      aria-label={`${court.name} ${minutesToTime(startMinute)} ${statusCopy[slotStatus]}`}
                      className={[
                        "h-20 rounded-2xl border px-2 py-3 text-left transition disabled:cursor-not-allowed",
                        statusClasses[slotStatus],
                        isAvailable ? "active:scale-[0.98]" : "",
                        slotStatus === "pending_payment" ? "shadow-glow" : ""
                      ].join(" ")}
                      disabled={!isAvailable}
                      key={`${court.id}-${startMinute}`}
                      onClick={() => selectSlot(court.id, court.name, startMinute)}
                      type="button"
                    >
                      <span className="block text-sm font-black">{minutesToTime(startMinute)}</span>
                      <span className="mt-3 block text-[11px] font-black uppercase tracking-[0.13em]">
                        {statusCopy[slotStatus]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-2 text-xs font-black text-court-cyan sm:grid-cols-4">
        <span className="rounded-full border border-court-cyan bg-court-navy px-3 py-2">
          {copy.booking.legendAvailable}
        </span>
        <span className="rounded-full border border-court-cyan/70 bg-court-ink px-3 py-2 text-court-cyan">
          {copy.booking.legendBooked}
        </span>
        <span className="rounded-full border border-court-ball bg-court-ink px-3 py-2 text-court-ball">
          {copy.booking.legendBlocked}
        </span>
        <span className="rounded-full border border-court-ball bg-court-ink px-3 py-2 text-court-ball">
          {copy.booking.legendInProgress}
        </span>
      </div>

      <BookingDrawer
        activeHold={activeHold}
        canCreateBookings={canCreateBookings}
        isSubmitting={isCreatingBooking}
        message={bookingMessage}
        onConfirmBooking={createBooking}
        onClose={() => {
          setSelectedSlot(null);
          setDrawerOptions([]);
          setActiveHold(null);
          setBookingMessage("");
        }}
        options={selectedOptions}
        selectedSlot={selectedSlot}
        copy={copy.booking}
      />
    </section>
  );
}
