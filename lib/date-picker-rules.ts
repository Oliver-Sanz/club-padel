import { toISODate } from "@/lib/format";

export const mondayFirstWeekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getMondayBasedOffset(date: Date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function getMonthGrid(monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const offset = getMondayBasedOffset(firstDay);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export function getMonthGridISO(monthDate: Date) {
  return getMonthGrid(monthDate).map(toISODate);
}
