// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export async function middleware(req: NextRequest) {
  const supabase = await createSupabaseServerClient()

  // Check the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Public routes (don’t require auth)
  const isPublicRoute =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/public") ||
    pathname === "/"

  if (!session && !isPublicRoute) {
    // Not signed in → redirect to login
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && pathname.startsWith("/auth")) {
    // Already signed in → prevent access to login/signup
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Continue to requested route
  return NextResponse.next()
}

// Configure which routes run through middleware
export const config = {
  matcher: [
    /*
     * Match all routes except for static files, Next.js internals, and API routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
