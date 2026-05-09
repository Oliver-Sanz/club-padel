import { describe, expect, it } from "vitest";
import {
  getMondayBasedOffset,
  getMonthGridISO,
  mondayFirstWeekDays
} from "@/lib/date-picker-rules";

describe("date picker rules", () => {
  it("starts the week on Monday", () => {
    expect(mondayFirstWeekDays).toEqual(["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]);
  });

  it("maps Monday to offset 0 and Sunday to offset 6", () => {
    expect(getMondayBasedOffset(new Date("2026-06-01T12:00:00"))).toBe(0);
    expect(getMondayBasedOffset(new Date("2026-06-07T12:00:00"))).toBe(6);
  });

  it("builds a 6-week month grid aligned to Monday", () => {
    const grid = getMonthGridISO(new Date("2026-05-01T12:00:00"));

    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-04-27");
    expect(grid[4]).toBe("2026-05-01");
  });
});
