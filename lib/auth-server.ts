/* eslint-disable @typescript-eslint/no-unused-vars */
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { AuthUser } from "@/lib/auth"

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // Try to get profile data
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!profileError) {
        profile = profileData
      }
    } catch (profileError) {
      // Continue without profile data
    }

    return {
      id: user.id,
      email: user.email!,
      firstName: profile?.first_name || user.user_metadata?.first_name || "",
      lastName: profile?.last_name || user.user_metadata?.last_name || "",
      isEmailVerified: user.email_confirmed_at !== null,
    }
  } catch (error) {
    // Don't log auth errors in production to avoid noise
    return null
  }
}

export async function checkServerAuth(): Promise<boolean> {
  try {
    const user = await getServerUser()
    return !!user
  } catch (error) {
    return false
  }
}


