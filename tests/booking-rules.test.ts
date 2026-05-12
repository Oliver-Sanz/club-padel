import { describe, expect, it } from "vitest";
import {
  canCancelForFree,
  calculatePrice,
  getDurationOptions,
  hasReachedActiveBookingLimit,
  isHoldStillActive,
  intervalsOverlap,
  isHoldExpired,
  isInsideClubHours,
  isWithinMaxBookingWindow,
  parseTimeToMinutes,
  ScheduleItem
} from "@/lib/booking-rules";
import { pricingRules } from "@/lib/mock-data";

describe("booking rules", () => {
  it("allows exact consecutive bookings but rejects overlaps", () => {
    expect(
      intervalsOverlap(
        parseTimeToMinutes("18:00"),
        parseTimeToMinutes("19:30"),
        parseTimeToMinutes("19:30"),
        parseTimeToMinutes("21:00")
      )
    ).toBe(false);

    expect(
      intervalsOverlap(
        parseTimeToMinutes("18:00"),
        parseTimeToMinutes("19:30"),
        parseTimeToMinutes("19:00"),
        parseTimeToMinutes("20:00")
      )
    ).toBe(true);
  });

  it("keeps reservations inside club hours", () => {
    expect(isInsideClubHours(parseTimeToMinutes("08:00"), 60)).toBe(true);
    expect(isInsideClubHours(parseTimeToMinutes("22:00"), 60)).toBe(true);
    expect(isInsideClubHours(parseTimeToMinutes("22:30"), 60)).toBe(false);
  });

  it("calculates crossed valley and peak pricing by 30-minute blocks", () => {
    const price = calculatePrice("2026-05-06", parseTimeToMinutes("16:30"), 90, pricingRules);

    expect(price.totalCents).toBe(2400);
    expect(price.breakdown.map((block) => block.label)).toEqual(["Valle", "Punta", "Punta"]);
  });

  it("disables 90 minutes when the slot does not fit before a conflict", () => {
    const items: ScheduleItem[] = [
      {
        id: "booking",
        courtId: 1,
        startMinute: parseTimeToMinutes("19:00"),
        endMinute: parseTimeToMinutes("20:00"),
        status: "confirmed",
        label: "Reservada"
      }
    ];

    const options = getDurationOptions({
      dateISO: "2026-05-06",
      courtId: 1,
      startMinute: parseTimeToMinutes("18:00"),
      items,
      pricingRules,
      now: new Date("2026-05-06T10:00:00")
    });

    expect(options.find((option) => option.duration === 60)?.enabled).toBe(true);
    expect(options.find((option) => option.duration === 90)?.enabled).toBe(false);
  });

  it("disables duration options for slots that already passed today", () => {
    const options = getDurationOptions({
      dateISO: "2026-05-08",
      courtId: 1,
      startMinute: parseTimeToMinutes("08:00"),
      items: [],
      pricingRules,
      now: new Date("2026-05-08T14:00:00")
    });

    expect(options.every((option) => !option.enabled)).toBe(true);
    expect(options[0].reason).toContain("ya ha pasado");
  });

  it("enforces the active booking limit", () => {
    expect(hasReachedActiveBookingLimit(2)).toBe(false);
    expect(hasReachedActiveBookingLimit(3)).toBe(true);
  });

  it("limits booking to the next 7 days", () => {
    const now = new Date("2026-05-06T10:00:00");

    expect(isWithinMaxBookingWindow(new Date("2026-05-13T09:59:00"), now)).toBe(true);
    expect(isWithinMaxBookingWindow(new Date("2026-05-14T10:01:00"), now)).toBe(false);
  });

  it("allows free cancellation until 6 hours before start", () => {
    const now = new Date("2026-05-06T10:00:00");

    expect(canCancelForFree(new Date("2026-05-06T16:00:00"), now)).toBe(true);
    expect(canCancelForFree(new Date("2026-05-06T15:59:00"), now)).toBe(false);
  });

  it("detects expired holds", () => {
    const now = new Date("2026-05-06T10:00:00");

    expect(isHoldExpired(new Date("2026-05-06T09:59:00"), now)).toBe(true);
    expect(isHoldExpired(new Date("2026-05-06T10:01:00"), now)).toBe(false);
  });

  it("accepts pending hold expirations received as JSON strings", () => {
    const now = new Date("2026-05-12T10:00:00.000Z");

    expect(
      isHoldStillActive(
        {
          id: "hold-json",
          courtId: 1,
          startMinute: parseTimeToMinutes("18:00"),
          endMinute: parseTimeToMinutes("19:00"),
          status: "pending_payment",
          label: "En proceso",
          expiresAt: "2026-05-12T10:06:00.000Z"
        },
        now
      )
    ).toBe(true);
  });
});
