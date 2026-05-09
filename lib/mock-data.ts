import { parseTimeToMinutes, PricingRule, ScheduleItem } from "@/lib/booking-rules";

export type Court = {
  id: number;
  name: string;
};

export const courts: Court[] = [
  { id: 1, name: "Pista 1" },
  { id: 2, name: "Pista 2" },
  { id: 3, name: "Pista 3" }
];

export const mockScheduleItems: ScheduleItem[] = [
  {
    id: "booking-1",
    courtId: 1,
    startMinute: parseTimeToMinutes("09:30"),
    endMinute: parseTimeToMinutes("11:00"),
    status: "confirmed",
    label: "Reservada"
  },
  {
    id: "hold-1",
    courtId: 1,
    startMinute: parseTimeToMinutes("18:00"),
    endMinute: parseTimeToMinutes("19:30"),
    status: "pending_payment",
    label: "En proceso",
    expiresAt: new Date(Date.now() + 8 * 60 * 1000)
  },
  {
    id: "block-1",
    courtId: 2,
    startMinute: parseTimeToMinutes("12:00"),
    endMinute: parseTimeToMinutes("13:30"),
    status: "blocked",
    label: "Mantenimiento"
  },
  {
    id: "booking-2",
    courtId: 2,
    startMinute: parseTimeToMinutes("16:30"),
    endMinute: parseTimeToMinutes("17:30"),
    status: "confirmed",
    label: "Reservada"
  }
];

export const pricingRules: PricingRule[] = [
  ...[1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
    {
      id: `weekday-valle-${dayOfWeek}`,
      dayOfWeek,
      startMinute: parseTimeToMinutes("08:00"),
      endMinute: parseTimeToMinutes("17:00"),
      pricePer30MinCents: 600,
      label: "Valle"
    },
    {
      id: `weekday-punta-${dayOfWeek}`,
      dayOfWeek,
      startMinute: parseTimeToMinutes("17:00"),
      endMinute: parseTimeToMinutes("23:00"),
      pricePer30MinCents: 900,
      label: "Punta"
    }
  ]),
  ...[0, 6].map((dayOfWeek) => ({
    id: `weekend-standard-${dayOfWeek}`,
    dayOfWeek,
    startMinute: parseTimeToMinutes("08:00"),
    endMinute: parseTimeToMinutes("23:00"),
    pricePer30MinCents: 1000,
    label: "Fin de semana"
  }))
];
