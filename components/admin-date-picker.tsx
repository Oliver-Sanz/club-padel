"use client";

import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/date-picker";

type AdminDatePickerProps = {
  selectedDate: string;
  selectedCourt: string;
};

export function AdminDatePicker({ selectedDate, selectedCourt }: AdminDatePickerProps) {
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

  return <DatePicker allowAllDates onSelectDate={selectDate} selectedDate={selectedDate} />;
}
