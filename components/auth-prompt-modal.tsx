"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type ClubCopy } from "@/lib/club-branding";
import { UI_LABELS, type SupportedLocale } from "@/lib/i18n";
import { ClubLogo } from "@/components/club-logo";

type AuthPromptModalProps = {
  clubName: string;
  logoUrl: string | null;
  isConfigured: boolean;
  copy: ClubCopy["auth"];
  locale: SupportedLocale;
  onClose: () => void;
};

export function AuthPromptModal({
  clubName,
  logoUrl,
  isConfigured,
  copy,
  locale,
  onClose
}: AuthPromptModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const ui = UI_LABELS[locale];

  async function loginWithGoogle() {
    setMessage("");

    if (!isConfigured) {
      setMessage(copy.helper);
      return;
    }

    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }

  async function loginWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isConfigured) {
      setMessage(copy.helper);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(ui.emailSent);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-court-ink/90 p-3 backdrop-blur-sm md:items-center md:justify-center">
      <section className="w-full rounded-[2rem] border border-court-cyan bg-court-ink p-5 shadow-soft md:max-w-lg">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <ClubLogo clubName={clubName} logoUrl={logoUrl} />
            <p className="mt-4 type-label text-court-ball">
              {copy.eyebrow}
            </p>
            <h2 className="mt-2 type-card text-white">{copy.title}</h2>
            <p className="mt-2 type-body text-court-cyan">{copy.subtitle}</p>
          </div>
          <button
            className="rounded-full border border-court-cyan px-4 py-2 type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            onClick={onClose}
            type="button"
          >
            {ui.close}
          </button>
        </div>

        {!isConfigured ? (
          <div className="rounded-2xl border border-court-ball bg-court-panel p-4 type-body-strong text-court-ball">
            {copy.helper}
          </div>
        ) : null}

        <button
          className="mt-4 w-full rounded-2xl bg-court-ball px-4 py-3 type-button text-court-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-court-cyan/20 disabled:text-court-cyan/60"
          disabled={!isConfigured}
          onClick={loginWithGoogle}
          type="button"
        >
          {copy.googleButton}
        </button>

        <form className="mt-3 space-y-3" onSubmit={loginWithEmail}>
          <label className="block type-body-strong text-court-cyan" htmlFor="drawer-email-login">
            Email
          </label>
          <input
            className="w-full rounded-2xl border border-court-cyan bg-court-panel px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-court-cyan/60 focus:border-court-ball"
            disabled={!isConfigured || isLoading}
            id="drawer-email-login"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            required
            type="email"
            value={email}
          />
          <button
            className="w-full rounded-2xl border border-court-cyan px-4 py-3 type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball disabled:cursor-not-allowed disabled:text-court-cyan/60"
            disabled={!isConfigured || isLoading}
            type="submit"
          >
            {isLoading ? ui.sending : copy.emailButton}
          </button>
        </form>

        {message ? (
          <p className="mt-3 rounded-2xl border border-court-ball bg-court-panel px-4 py-3 type-body-strong text-court-ball">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
