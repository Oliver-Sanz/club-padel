import { AvailabilityBoard } from "@/components/availability-board";
import { AuthCard } from "@/components/auth-card";
import { getAvailabilityData } from "@/lib/availability-data";
import { buildDateOptions } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const isConfigured = isSupabaseConfigured();
  const selectedDate = buildDateOptions(1)[0];
  const availabilityData = await getAvailabilityData(selectedDate);
  const user = isConfigured ? (await (await createClient()).auth.getUser()).data.user : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-8 md:py-10">
      <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-court-ball bg-court-ink p-6 text-white shadow-soft md:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-court-ball/15 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-1 w-full bg-court-ball" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-court-cyan">
            Club de Padel
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-court-ball md:text-6xl">
            Reservas claras, rapidas y sin dobles reservas.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-court-cyan md:text-lg">
            Fase 2 del MVP: login con Supabase, disponibilidad preparada para datos reales y
            fallback seguro a mocks mientras configuras las claves.
          </p>
        </div>
      </header>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <AvailabilityBoard initialData={availabilityData} canCreateBookings={Boolean(user)} />
        <AuthCard isConfigured={isConfigured} user={user ? { email: user.email } : null} />
      </div>
    </main>
  );
}
