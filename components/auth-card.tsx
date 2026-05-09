"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthCardProps = {
  isConfigured: boolean;
  user: Pick<User, "email"> | null;
};

export function AuthCard({ isConfigured, user }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loginWithGoogle() {
    setMessage("");

    if (!isConfigured) {
      setMessage("Primero configura Supabase en .env.local.");
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
      setMessage("Primero configura Supabase en .env.local.");
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

    setMessage("Te hemos enviado un enlace de acceso al email.");
  }

  if (user) {
    return (
      <section className="rounded-[2rem] border border-court-cyan bg-court-ink p-5 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-court-ball">
          Sesion activa
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Estas dentro</h2>
        <p className="mt-2 text-sm font-semibold text-court-cyan">{user.email}</p>
        <Link
          className="mt-4 block w-full rounded-2xl bg-court-ball px-4 py-3 text-center text-sm font-black text-court-ink shadow-glow transition hover:translate-y-[-1px]"
          href="/mis-reservas"
        >
          Mis reservas
        </Link>
        <Link
          className="mt-3 block w-full rounded-2xl border border-court-cyan px-4 py-3 text-center text-sm font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball"
          href="/admin"
        >
          Ir a admin
        </Link>
        <form action="/auth/logout" className="mt-4" method="post">
          <button
            className="w-full rounded-2xl border border-court-cyan px-4 py-3 text-sm font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball"
            type="submit"
          >
            Cerrar sesion
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-court-cyan bg-court-ink p-5 shadow-soft">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-court-ball">
        Acceso Fase 2
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">Reserva con tu cuenta</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-court-cyan">
        Puedes ver disponibilidad sin iniciar sesion. Para reservar, usaremos Google o un enlace por
        email.
      </p>

      {!isConfigured ? (
        <div className="mt-4 rounded-2xl border border-court-ball bg-court-panel p-4 text-sm font-bold text-court-ball">
          Supabase todavia no esta configurado. La app seguira usando datos mock hasta que rellenes
          `.env.local`.
        </div>
      ) : null}

      <button
        className="mt-4 w-full rounded-2xl bg-court-ball px-4 py-3 text-sm font-black text-court-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-court-cyan/20 disabled:text-court-cyan/60"
        disabled={!isConfigured}
        onClick={loginWithGoogle}
        type="button"
      >
        Continuar con Google
      </button>

      <form className="mt-3 space-y-3" onSubmit={loginWithEmail}>
        <label className="block text-sm font-black text-court-cyan" htmlFor="email-login">
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
          className="w-full rounded-2xl border border-court-cyan px-4 py-3 text-sm font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball disabled:cursor-not-allowed disabled:text-court-cyan/60"
          disabled={!isConfigured || isLoading}
          type="submit"
        >
          {isLoading ? "Enviando..." : "Recibir enlace por email"}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm font-bold text-court-ball">{message}</p> : null}
    </section>
  );
}
