"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { type ClubCopy } from "@/lib/club-branding";
import { UI_LABELS, type SupportedLocale } from "@/lib/i18n";
import { ClubLogo } from "@/components/club-logo";

type AuthCardProps = {
  isConfigured: boolean;
  user: Pick<User, "email"> | null;
  clubName: string;
  logoUrl: string | null;
  copy: ClubCopy["auth"];
  locale: SupportedLocale;
};

export function AuthCard({ isConfigured, user, clubName, logoUrl, copy, locale }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const ui = UI_LABELS[locale];

  async function loginWithGoogle() {
    setMessage("");

    if (!isConfigured) {
      setMessage(ui.configureSupabaseFirst);
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
      setMessage(ui.configureSupabaseFirst);
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

  if (user) {
    return (
      <section className="rounded-[2rem] border border-court-cyan bg-court-ink p-5 shadow-soft">
        <ClubLogo clubName={clubName} logoUrl={logoUrl} />
        <p className="mt-4 type-label text-court-ball">
          {copy.loggedInSubtitle}
        </p>
        <h2 className="mt-2 type-card text-white">{copy.loggedInTitle}</h2>
        <p className="mt-2 type-body text-court-cyan">{user.email}</p>
        <Link
          className="mt-4 block w-full rounded-2xl bg-court-ball px-4 py-3 text-center type-button text-court-ink shadow-glow transition hover:translate-y-[-1px]"
          href="/mis-reservas"
        >
          {copy.reservationsButton}
        </Link>
        <Link
          className="mt-3 block w-full rounded-2xl border border-court-cyan px-4 py-3 text-center type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball"
          href="/admin"
        >
          {copy.adminButton}
        </Link>
        <form action="/auth/logout" className="mt-4" method="post">
          <button
            className="w-full rounded-2xl border border-court-cyan px-4 py-3 type-button text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            type="submit"
          >
            {copy.logoutButton}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-court-cyan bg-court-ink p-5 shadow-soft">
      <ClubLogo clubName={clubName} logoUrl={logoUrl} />
      <p className="mt-4 type-label text-court-ball">
        {copy.eyebrow}
      </p>
      <h2 className="mt-2 type-card text-white">{copy.title}</h2>
      <p className="mt-2 type-body text-court-cyan">{copy.subtitle}</p>

      {!isConfigured ? (
        <div className="mt-4 rounded-2xl border border-court-ball bg-court-panel p-4 type-body-strong text-court-ball">
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
        <label className="type-body-strong block text-court-cyan" htmlFor="email-login">
          Email
        </label>
        <input
          className="w-full rounded-2xl border border-court-cyan bg-court-panel px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-court-cyan/60 focus:border-court-ball"
          disabled={!isConfigured || isLoading}
          id="email-login"
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

      {message ? <p className="mt-3 type-body-strong text-court-ball">{message}</p> : null}
    </section>
  );
}
