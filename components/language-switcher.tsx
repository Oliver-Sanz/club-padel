"use client";

import { useRouter } from "next/navigation";
import {
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  UI_LABELS,
  type SupportedLocale
} from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: SupportedLocale;
  className?: string;
};

export function LanguageSwitcher({ locale, className = "" }: LanguageSwitcherProps) {
  const router = useRouter();
  const labels = UI_LABELS[locale];

  function changeLocale(nextLocale: SupportedLocale) {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <nav
      aria-label={labels.language}
      className={`inline-flex items-center gap-2 text-[18px] font-normal leading-none tracking-[0em] text-court-cyan ${className}`.trim()}
    >
      {SUPPORTED_LOCALES.map((option, index) => {
        const isSelected = option === locale;

        return (
          <span className="inline-flex items-center gap-2" key={option}>
            {index > 0 ? <span className="h-8 w-px bg-court-cyan" aria-hidden="true" /> : null}
            <button
              aria-current={isSelected ? "true" : undefined}
              className={[
                "uppercase decoration-court-cyan decoration-2 underline-offset-[0.28em] transition hover:text-court-ball focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-court-ball",
                isSelected ? "font-black underline" : "font-normal no-underline"
              ].join(" ")}
              onClick={() => changeLocale(option)}
              type="button"
            >
              {option}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
