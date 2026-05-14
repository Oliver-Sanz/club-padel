import { AvailabilityBoard } from "@/components/availability-board";
import { AuthCard } from "@/components/auth-card";
import { ClubLogo } from "@/components/club-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getClubConfig } from "@/lib/club-config";
import { getAvailabilityData } from "@/lib/availability-data";
import { buildDateOptions } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const isConfigured = isSupabaseConfigured();
  const selectedDate = buildDateOptions(1)[0];
  const clubConfig = await getClubConfig();
  const availabilityData = await getAvailabilityData(selectedDate);
  const user = isConfigured ? await getSafeUser(await createClient()) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
      <header className="relative mb-8 min-w-0 overflow-hidden rounded-[2rem] border border-court-ball bg-court-ink p-6 text-white shadow-soft md:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-court-ball/15 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-1 w-full bg-court-ball" />
        <LanguageSwitcher
          className="absolute right-6 top-6 z-20 md:right-10 md:top-9"
          locale={clubConfig.locale}
        />
        <div className="relative z-10 grid min-w-0 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(14rem,21rem)] md:items-center lg:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)]">
          <div className="min-w-0 max-w-3xl">
            <ClubLogo clubName={clubConfig.clubName} logoUrl={clubConfig.logoUrl} />
            <p className="mt-4 type-label text-court-cyan">
              {clubConfig.copy.home.eyebrow}
            </p>
            <h1 className="mt-4 max-w-full text-balance type-hero text-court-ball">
              {clubConfig.copy.home.title}
            </h1>
            <p className="mt-5 max-w-2xl type-body-lg text-court-cyan">
              {clubConfig.copy.home.subtitle}
            </p>
          </div>
          <div className="hidden min-w-0 md:flex md:items-center md:justify-end md:pr-2 lg:pr-6">
            <div className="flex aspect-[4/3] max-h-[18rem] min-h-0 w-full max-w-[20rem] min-w-0 items-center justify-center overflow-hidden">
              {clubConfig.fullLogoUrl ?? clubConfig.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${clubConfig.clubName} logo`}
                  className="block h-full w-full object-contain"
                  src={clubConfig.fullLogoUrl ?? clubConfig.logoUrl ?? ""}
                />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-[1.75rem] border border-dashed border-court-cyan/40 bg-court-ink/30 p-8 text-center">
                  <span className="type-section text-court-ball">
                    {clubConfig.clubName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <AvailabilityBoard
          canCreateBookings={Boolean(user)}
          clubName={clubConfig.clubName}
          copy={clubConfig.copy}
          initialData={availabilityData}
          isConfigured={isConfigured}
          locale={clubConfig.locale}
          logoUrl={clubConfig.logoUrl}
        />
        <AuthCard
          clubName={clubConfig.clubName}
          copy={clubConfig.copy.auth}
          isConfigured={isConfigured}
          locale={clubConfig.locale}
          logoUrl={clubConfig.logoUrl}
          user={user ? { email: user.email } : null}
        />
      </div>
    </main>
  );
}
