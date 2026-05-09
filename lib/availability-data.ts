import { PricingRule, ScheduleItem } from "@/lib/booking-rules";
import { courts as mockCourts, mockScheduleItems, pricingRules as mockPricingRules } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AvailabilityData = {
  courts: typeof mockCourts;
  scheduleItems: ScheduleItem[];
  pricingRules: PricingRule[];
  source: "mock" | "supabase";
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateToMinutes(value: string) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function isSameLocalDate(value: string, dateISO: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}` === dateISO;
}

function getMockAvailability(): AvailabilityData {
  return {
    courts: mockCourts,
    scheduleItems: mockScheduleItems,
    pricingRules: mockPricingRules,
    source: "mock"
  };
}

function mergeWithFallbackPricingRules(rules: PricingRule[]) {
  const existingKeys = new Set(
    rules.map((rule) => `${rule.dayOfWeek}-${rule.startMinute}-${rule.endMinute}`)
  );
  const missingFallbackRules = mockPricingRules.filter((rule) => {
    const key = `${rule.dayOfWeek}-${rule.startMinute}-${rule.endMinute}`;
    return !existingKeys.has(key);
  });

  return [...rules, ...missingFallbackRules];
}

export async function getAvailabilityData(dateISO: string): Promise<AvailabilityData> {
  if (!isSupabaseConfigured()) {
    return getMockAvailability();
  }

  try {
    const supabase = await createClient();
    await supabase.rpc("expire_old_booking_holds");

    const [courtsResult, availabilityResult, pricingResult] =
      await Promise.all([
        supabase.from("courts").select("id,name").eq("is_active", true).order("id"),
        supabase
          .from("availability_items")
          .select("id,court_id,start_time,end_time,status,label,expires_at"),
        supabase.from("pricing_rules").select("*").eq("is_active", true)
      ]);

    if (
      courtsResult.error ||
      availabilityResult.error ||
      pricingResult.error
    ) {
      return getMockAvailability();
    }

    const scheduleItems: ScheduleItem[] =
      availabilityResult.data
        ?.filter((item) => isSameLocalDate(item.start_time, dateISO))
        .map((item) => ({
          id: item.id,
          courtId: item.court_id,
          startMinute: dateToMinutes(item.start_time),
          endMinute: dateToMinutes(item.end_time),
          status: item.status === "confirmed" ? "confirmed" : item.status,
          label: item.label,
          expiresAt: item.expires_at ? new Date(item.expires_at) : undefined
        })) ?? [];

    const pricingRules =
      pricingResult.data?.map((rule) => ({
        id: String(rule.id),
        dayOfWeek: rule.day_of_week,
        startMinute: timeToMinutes(rule.start_time),
        endMinute: timeToMinutes(rule.end_time),
        pricePer30MinCents: rule.price_per_30_min_cents,
        label: rule.label
      })) ?? [];

    return {
      courts: courtsResult.data ?? mockCourts,
      scheduleItems,
      pricingRules: mergeWithFallbackPricingRules(pricingRules),
      source: "supabase"
    };
  } catch {
    return getMockAvailability();
  }
}
