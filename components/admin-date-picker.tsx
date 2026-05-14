"use client";

import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/date-picker";
import { type SupportedLocale } from "@/lib/i18n";

type AdminDatePickerProps = {
  selectedDate: string;
  selectedCourt: string;
  locale: SupportedLocale;
};

export function AdminDatePicker({ selectedDate, selectedCourt, locale }: AdminDatePickerProps) {
  const router = useRouter();

  function selectDate(dateISO: string) {
    const params = new URLSearchParams();
    params.set("date", dateISO);

    if (selectedCourt !== "all") {
      params.set("court", selectedCourt);
    } else {
      params.delete("court");
    }

    router.push(`/admin?${params.toString()}`);
  }

  return <DatePicker allowAllDates locale={locale} onSelectDate={selectDate} selectedDate={selectedDate} />;
}
