import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

async function logout(request: Request) {
  const requestUrl = new URL(request.url);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut().catch(() => {});
  }

  const cookieStore = await cookies();
  cookieStore
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"))
    .forEach((cookie) => {
      cookieStore.set(cookie.name, "", {
        maxAge: 0,
        path: "/"
      });
    });

  return NextResponse.redirect(new URL("/", requestUrl.origin), { status: 303 });
}

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}
