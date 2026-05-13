"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  getMonthGrid,
  mondayFirstWeekDays,
  startOfMonth
} from "@/lib/date-picker-rules";
import { buildDateOptions, formatDateLabel, toISODate } from "@/lib/format";

type DatePickerProps = {
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
  allowAllDates?: boolean;
};

export function DatePicker({ selectedDate, onSelectDate, allowAllDates = false }: DatePickerProps) {
  const allowedDates = useMemo(() => new Set(buildDateOptions(8)), []);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date(`${selectedDate}T12:00:00`))
  );

  const monthDays = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric"
  }).format(visibleMonth);

  return (
    <div className="mx-auto w-full max-w-[22rem] rounded-[1.75rem] border border-court-ball bg-court-ink p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          aria-label="Mes anterior"
          className="grid h-11 w-11 place-items-center rounded-xl border border-court-cyan bg-court-navy type-card text-court-cyan shadow-sm transition hover:border-court-ball hover:text-court-ball"
          onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          type="button"
        >
          ‹
        </button>
        <p className="text-center type-body-strong capitalize text-court-ball">{monthLabel}</p>
        <button
          aria-label="Mes siguiente"
          className="grid h-11 w-11 place-items-center rounded-xl border border-court-cyan bg-court-navy type-card text-court-cyan shadow-sm transition hover:border-court-ball hover:text-court-ball"
          onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          type="button"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1 border-y border-court-ball py-3">
        {mondayFirstWeekDays.map((day) => (
          <span className="type-badge text-center text-court-cyan" key={day}>
            {day}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1">
        {monthDays.map((date) => {
          const dateISO = toISODate(date);
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const isAllowed = allowAllDates || allowedDates.has(dateISO);
          const isSelected = selectedDate === dateISO;

          return (
            <button
              className={[
                "grid aspect-square min-h-9 place-items-center rounded-full type-body-strong transition",
                isSelected ? "bg-court-ball text-court-ink shadow-glow" : "",
                !isSelected && isAllowed
                  ? "text-court-cyan hover:bg-court-cyan/16 hover:text-court-ball focus-visible:outline focus-visible:outline-2 focus-visible:outline-court-ball"
                  : "",
                !isAllowed ? "cursor-not-allowed text-court-grey/40" : "",
                !isCurrentMonth && !isAllowed ? "opacity-40" : ""
              ].join(" ")}
              disabled={!isAllowed}
              key={dateISO}
              onClick={() => onSelectDate(dateISO)}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-court-cyan bg-court-navy p-3">
        <span className="type-body text-court-cyan">Dia seleccionado</span>
        <span className="rounded-xl bg-court-ball px-3 py-2 type-button capitalize text-court-ink">
          {formatDateLabel(selectedDate)}
        </span>
      </div>
    </div>
  );
}
