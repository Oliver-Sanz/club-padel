import { minutesToTime } from "@/lib/booking-rules";

export function formatMoney(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency
  }).format(cents / 100);
}

export function formatDateLabel(dateISO: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(new Date(`${dateISO}T12:00:00`));
}

export function formatRange(startMinute: number, endMinute: number) {
  return `${minutesToTime(startMinute)}-${minutesToTime(endMinute)}`;
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildDateOptions(days = 8) {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return toISODate(date);
  });
}
