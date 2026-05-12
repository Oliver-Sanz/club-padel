export const CLUB_OPEN_MINUTES = 8 * 60;
export const CLUB_CLOSE_MINUTES = 23 * 60;
export const SLOT_MINUTES = 30;
export const ALLOWED_DURATIONS = [60, 90] as const;
export const MAX_ACTIVE_BOOKINGS = 3;
export const MAX_DAYS_AHEAD = 7;
export const FREE_CANCELLATION_HOURS = 6;
export const HOLD_EXPIRATION_MINUTES = 6;

export type DurationMinutes = (typeof ALLOWED_DURATIONS)[number];

export type OccupancyStatus = "confirmed" | "blocked" | "event" | "pending_payment";

export type ScheduleItem = {
  id: string;
  courtId: number;
  startMinute: number;
  endMinute: number;
  status: OccupancyStatus;
  label: string;
  expiresAt?: Date | string;
};

export type PricingRule = {
  id: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  pricePer30MinCents: number;
  label: string;
};

export type PriceBreakdownItem = {
  startMinute: number;
  endMinute: number;
  label: string;
  priceCents: number;
};

export type PriceResult = {
  totalCents: number;
  breakdown: PriceBreakdownItem[];
};

export type DurationOption = {
  duration: DurationMinutes;
  enabled: boolean;
  reason?: string;
  price?: PriceResult;
};

export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function generateTimeSlots() {
  const slots: number[] = [];

  for (let minute = CLUB_OPEN_MINUTES; minute < CLUB_CLOSE_MINUTES; minute += SLOT_MINUTES) {
    slots.push(minute);
  }

  return slots;
}

export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  return startA < endB && startB < endA;
}

export function isInsideClubHours(startMinute: number, durationMinutes: number) {
  const endMinute = startMinute + durationMinutes;
  return startMinute >= CLUB_OPEN_MINUTES && endMinute <= CLUB_CLOSE_MINUTES;
}

export function isHoldStillActive(item: ScheduleItem, now = new Date()) {
  if (item.status !== "pending_payment") {
    return true;
  }

  if (!item.expiresAt) {
    return true;
  }

  const expiresAtMs =
    item.expiresAt instanceof Date ? item.expiresAt.getTime() : new Date(item.expiresAt).getTime();

  return Number.isFinite(expiresAtMs) ? expiresAtMs > now.getTime() : true;
}

export function getConflictingItem(
  items: ScheduleItem[],
  courtId: number,
  startMinute: number,
  endMinute: number,
  now = new Date()
) {
  return items.find((item) => {
    if (item.courtId !== courtId || !isHoldStillActive(item, now)) {
      return false;
    }

    return intervalsOverlap(startMinute, endMinute, item.startMinute, item.endMinute);
  });
}

export function getSlotVisualStatus(
  items: ScheduleItem[],
  courtId: number,
  slotStartMinute: number,
  now = new Date()
): OccupancyStatus | "available" {
  const slotEndMinute = slotStartMinute + SLOT_MINUTES;
  const conflict = getConflictingItem(items, courtId, slotStartMinute, slotEndMinute, now);

  return conflict?.status ?? "available";
}

export function getDayOfWeek(dateISO: string) {
  return new Date(`${dateISO}T12:00:00`).getDay();
}

export function calculatePrice(
  dateISO: string,
  startMinute: number,
  durationMinutes: DurationMinutes,
  rules: PricingRule[]
): PriceResult {
  const dayOfWeek = getDayOfWeek(dateISO);
  const endMinute = startMinute + durationMinutes;
  const breakdown: PriceBreakdownItem[] = [];

  for (let minute = startMinute; minute < endMinute; minute += SLOT_MINUTES) {
    const blockEnd = minute + SLOT_MINUTES;
    const rule = rules.find((candidate) => {
      return (
        candidate.dayOfWeek === dayOfWeek &&
        minute >= candidate.startMinute &&
        blockEnd <= candidate.endMinute
      );
    });

    if (!rule) {
      throw new Error(`No pricing rule for ${minutesToTime(minute)}-${minutesToTime(blockEnd)}`);
    }

    breakdown.push({
      startMinute: minute,
      endMinute: blockEnd,
      label: rule.label,
      priceCents: rule.pricePer30MinCents
    });
  }

  return {
    totalCents: breakdown.reduce((sum, block) => sum + block.priceCents, 0),
    breakdown
  };
}

export function getDurationOptions(params: {
  dateISO: string;
  courtId: number;
  startMinute: number;
  items: ScheduleItem[];
  pricingRules: PricingRule[];
  now?: Date;
  enforceMaxBookingWindow?: boolean;
}): DurationOption[] {
  const {
    dateISO,
    courtId,
    startMinute,
    items,
    pricingRules,
    now = new Date(),
    enforceMaxBookingWindow = true
  } = params;

  return ALLOWED_DURATIONS.map((duration) => {
    const endMinute = startMinute + duration;

    if (!isInsideClubHours(startMinute, duration)) {
      return {
        duration,
        enabled: false,
        reason: "La reserva queda fuera del horario del club."
      };
    }

    if (isSlotInPast(dateISO, startMinute, now)) {
      return {
        duration,
        enabled: false,
        reason: "Este horario ya ha pasado."
      };
    }

    if (enforceMaxBookingWindow && !isSlotInsideBookingWindow(dateISO, startMinute, now)) {
      return {
        duration,
        enabled: false,
        reason: "Este horario queda fuera de la ventana de reserva."
      };
    }

    const conflict = getConflictingItem(items, courtId, startMinute, endMinute, now);

    if (conflict) {
      const label = conflict.status === "pending_payment" ? "hay una reserva en proceso" : conflict.label;

      return {
        duration,
        enabled: false,
        reason: `No hay ${duration} minutos seguidos: ${label}.`
      };
    }

    return {
      duration,
      enabled: true,
      price: calculatePrice(dateISO, startMinute, duration, pricingRules)
    };
  });
}

export function hasReachedActiveBookingLimit(activeFutureBookings: number) {
  return activeFutureBookings >= MAX_ACTIVE_BOOKINGS;
}

export function isWithinMaxBookingWindow(start: Date, now = new Date()) {
  const latest = new Date(now);
  latest.setDate(latest.getDate() + MAX_DAYS_AHEAD);

  return start.getTime() >= now.getTime() && start.getTime() <= latest.getTime();
}

export function getSlotStartDate(dateISO: string, startMinute: number) {
  const start = new Date(`${dateISO}T00:00:00`);
  start.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
  return start;
}

export function isSlotInPast(dateISO: string, startMinute: number, now = new Date()) {
  return getSlotStartDate(dateISO, startMinute).getTime() < now.getTime();
}

export function isSlotInsideBookingWindow(dateISO: string, startMinute: number, now = new Date()) {
  return isWithinMaxBookingWindow(getSlotStartDate(dateISO, startMinute), now);
}

export function canCancelForFree(start: Date, now = new Date()) {
  const msUntilStart = start.getTime() - now.getTime();
  return msUntilStart >= FREE_CANCELLATION_HOURS * 60 * 60 * 1000;
}

export function isHoldExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}
