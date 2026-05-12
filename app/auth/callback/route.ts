import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const supabase = await createClient();
  await supabase.auth.exchangeCodeForSession(code);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email ?? null,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null
    });
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
