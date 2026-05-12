import { toISODate } from "@/lib/format";

export const CLUB_TIME_ZONE = "Europe/Madrid";

type ClubDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
}

function getDateTimeParts(value: Date | string, timeZone = CLUB_TIME_ZONE): ClubDateTimeParts {
  const date = typeof value === "string" ? new Date(value) : value;
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => {
    return Number(parts.find((part) => part.type === type)?.value ?? 0);
  };

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second")
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone = CLUB_TIME_ZONE) {
  const parts = getDateTimeParts(date, timeZone);
  const utcFromZonedParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return utcFromZonedParts - date.getTime();
}

function splitDateISO(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return { year, month, day };
}

export function clubDateTimeToUtc(dateISO: string, minuteOfDay: number) {
  const { year, month, day } = splitDateISO(dateISO);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const offsetMs = getTimeZoneOffsetMs(utcGuess);
  return new Date(utcGuess.getTime() - offsetMs);
}

export function getClubDateISO(value: Date | string) {
  const parts = getDateTimeParts(value);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function getClubMinuteOfDay(value: Date | string) {
  const parts = getDateTimeParts(value);
  return parts.hour * 60 + parts.minute;
}

export function getClubDayRangeUtc(dateISO: string) {
  const start = clubDateTimeToUtc(dateISO, 0);
  const nextDate = new Date(`${dateISO}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + 1);
  const end = clubDateTimeToUtc(toISODate(nextDate), 0);

  return {
    start,
    end
  };
}

export function formatClubDateTime(
  value: Date | string,
  options: Intl.DateTimeFormatOptions,
  locale = "es-ES"
) {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: CLUB_TIME_ZONE
  }).format(typeof value === "string" ? new Date(value) : value);
}
