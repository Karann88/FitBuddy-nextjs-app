import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRequestSupabaseClient } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  // Prepare redirect response; cookies set during exchange will attach to this response
  const redirectTo = req.nextUrl.searchParams.get("redirectTo") || "/dashboard";
  const url = new URL(req.url);

  // If provider returned an error, bounce to login with details
  const error = url.searchParams.get("error") || url.searchParams.get("error_description");
  if (error) {
    const backToLogin = new URL("/auth/login", req.url);
    backToLogin.searchParams.set("error", error);
    return NextResponse.redirect(backToLogin);
  }

  // No code present – invalid callback access
  if (!url.searchParams.get("code")) {
    const backToLogin = new URL("/auth/login", req.url);
    backToLogin.searchParams.set("error", "Missing OAuth code");
    return NextResponse.redirect(backToLogin);
  }

  const res = NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });

  const supabase = createRequestSupabaseClient(req, res);

  // Exchange the auth code in the URL for a session and persist cookies to res
  try {
    await supabase.auth.exchangeCodeForSession(req.url);
  } catch (e) {
    const backToLogin = new URL("/auth/login", req.url);
    const message = (e as { message?: string })?.message || "Failed to exchange code for session";
    backToLogin.searchParams.set("error", message);
    return NextResponse.redirect(backToLogin, { status: 303 });
  }

  return res;
}


