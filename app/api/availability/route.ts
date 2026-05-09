import { NextResponse } from "next/server";
import { getAvailabilityData } from "@/lib/availability-data";
import { buildDateOptions } from "@/lib/format";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateISO = url.searchParams.get("date") ?? buildDateOptions(1)[0];

  const data = await getAvailabilityData(dateISO);

  return NextResponse.json(data);
}
