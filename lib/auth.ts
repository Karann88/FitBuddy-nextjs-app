// import { supabase } from "./supabase"
import { createSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase"
import { AuthDebug } from "./auth-debug"
import { getAuthError, type AuthError } from "./auth-errors"
import type { User } from "@supabase/supabase-js"

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  isEmailVerified: boolean
}

export interface LoginResult {
  success: boolean
  user?: AuthUser
  error?: string
  errorDetails?: AuthError
  requiresEmailConfirmation?: boolean
}

export interface RegisterResult {
  success: boolean
  user?: AuthUser
  error?: string
  errorDetails?: AuthError
  requiresEmailConfirmation?: boolean
}

export interface PasswordResetResult {
  success: boolean
  error?: string
  errorDetails?: AuthError
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  gender: string
  password: string
  marketingConsent: boolean
}

// Convert Supabase user to our AuthUser format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertUser(user: User, profile?: any): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    firstName: profile?.first_name || user.user_metadata?.first_name || "",
    lastName: profile?.last_name || user.user_metadata?.last_name || "",
    isEmailVerified: user.email_confirmed_at !== null,
  }
}

const notConfiguredError = () =>
  getAuthError({
    message:
      "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  })

export async function checkAuthStatus(): Promise<boolean> {
  try {
    AuthDebug.log("Checking auth status...")

    if (!hasSupabaseEnv) {
      AuthDebug.log("Supabase env missing; treating as logged out")
      return false
    }

    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      AuthDebug.error("Session check error:", error)
      return false
    }

    if (!data.session) {
      AuthDebug.log("No active session found")
      return false
    }

    const isAuthenticated = true
    AuthDebug.log("Auth status:", { isAuthenticated, userId: data.session.user.id })

    return isAuthenticated
  } catch (error) {
    AuthDebug.error("Auth status check error:", error)
    return false
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    AuthDebug.log("Getting current user...")

    if (!hasSupabaseEnv) {
      AuthDebug.log("Supabase env missing; returning null user")
      return null
    }

    const supabase = createSupabaseBrowserClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      AuthDebug.log("No session, user is logged out")
      return null
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      AuthDebug.error("Get user error:", userError)
      return null
    }

    if (!user) {
      AuthDebug.log("No user found")
      return null
    }

    // Get profile data, but don't fail if table doesn't exist
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        AuthDebug.error("Profile fetch error:", profileError)
      } else {
        profile = profileData
      }
    } catch (profileError) {
      AuthDebug.error("Profile table might not exist:", profileError)
    }

    const authUser = convertUser(user, profile)
    AuthDebug.log("Converted user:", authUser)

    return authUser
  } catch (error) {
    AuthDebug.error("Get current user error:", error)
    return null
  }
}

export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<LoginResult> {
  try {
    AuthDebug.log("Attempting login for:", { email, rememberMe })

    // Validate inputs
    if (!email || !password) {
      const error = { message: "Email and password are required" }
      return {
        success: false,
        error: "Email and password are required",
        errorDetails: getAuthError(error),
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      const error = { message: "Invalid email address" }
      return {
        success: false,
        error: "Please enter a valid email address",
        errorDetails: getAuthError(error),
      }
    }

    if (!hasSupabaseEnv) {
      const authError = notConfiguredError()
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    const supabase = createSupabaseBrowserClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      AuthDebug.logSupabaseError(error)
      const authError = getAuthError(error)

      // Check if it's an email confirmation issue
      if (error.message?.includes("email not confirmed")) {
        return {
          success: false,
          error: authError.userMessage,
          errorDetails: authError,
          requiresEmailConfirmation: true,
        }
      }

      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    if (!data.session) {
      AuthDebug.error("Login successful but no session returned")
      return {
        success: false,
        error: "Login failed - no session received",
        errorDetails: getAuthError({ message: "No session data" }),
      }
    }

    if (!data.user) {
      AuthDebug.error("Login successful but no user data returned")
      return {
        success: false,
        error: "Login failed - no user data received",
        errorDetails: getAuthError({ message: "No user data" }),
      }
    }

    // Get profile data
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        AuthDebug.error("Profile fetch error after login:", profileError)
      } else {
        profile = profileData
      }
    } catch (profileError) {
      AuthDebug.error("Profile table might not exist:", profileError)
    }

    const authUser = convertUser(data.user, profile)
    AuthDebug.log("Login complete:", authUser)

    return {
      success: true,
      user: authUser,
    }
  } catch (error) {
    AuthDebug.error("Login error:", error)
    const authError = getAuthError(error)
    return {
      success: false,
      error: authError.userMessage,
      errorDetails: authError,
    }
  }
}

export async function registerUser(data: RegisterData): Promise<RegisterResult> {
  try {
    AuthDebug.log("Attempting registration for:", { email: data.email })

    // Validate inputs
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      const error = { message: "All required fields must be filled" }
      return {
        success: false,
        error: "Please fill in all required fields",
        errorDetails: getAuthError(error),
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      const error = { message: "Invalid email address" }
      return {
        success: false,
        error: "Please enter a valid email address",
        errorDetails: getAuthError(error),
      }
    }

    // Validate password strength
    if (data.password.length < 8) {
      const error = { message: "Password too short" }
      return {
        success: false,
        error: "Password must be at least 8 characters long",
        errorDetails: getAuthError(error),
      }
    }

    if (!hasSupabaseEnv) {
      const authError = notConfiguredError()
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    const supabase = createSupabaseBrowserClient()

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          marketing_consent: data.marketingConsent,
        },
      },
    })

    if (error) {
      AuthDebug.logSupabaseError(error)
      const authError = getAuthError(error)
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    if (!authData.user) {
      AuthDebug.error("Registration successful but no user data returned")
      return {
        success: false,
        error: "Registration failed - no user data received",
        errorDetails: getAuthError({ message: "No user data" }),
      }
    }

    AuthDebug.log("Registration successful:", {
      userId: authData.user.id,
      emailConfirmed: authData.user.email_confirmed_at,
      needsConfirmation: !authData.session,
    })

    // Check if email confirmation is required
    const requiresEmailConfirmation = !authData.session

    if (requiresEmailConfirmation) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        error:
          "Please check your email and click the confirmation link to complete your registration.",
      }
    }

    // If we have a session, update profile with additional data
    if (authData.session) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          marketing_consent: data.marketingConsent,
        })
        .eq("id", authData.user.id)

      if (profileError) {
        AuthDebug.error("Profile update error:", profileError)
      }

      // Get updated profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      const authUser = convertUser(authData.user, profile)
      AuthDebug.log("Registration complete with auto-login:", authUser)

      return {
        success: true,
        user: authUser,
      }
    }

    return {
      success: true,
      requiresEmailConfirmation: true,
    }
  } catch (error) {
    AuthDebug.error("Registration error:", error)
    const authError = getAuthError(error)
    return {
      success: false,
      error: authError.userMessage,
      errorDetails: authError,
    }
  }
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  try {
    AuthDebug.log("Requesting password reset for:", { email })

    if (!email) {
      const error = { message: "Email is required" }
      return {
        success: false,
        error: "Email address is required",
        errorDetails: getAuthError(error),
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      const error = { message: "Invalid email address" }
      return {
        success: false,
        error: "Please enter a valid email address",
        errorDetails: getAuthError(error),
      }
    }

    if (!hasSupabaseEnv) {
      const authError = notConfiguredError()
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    const supabase = createSupabaseBrowserClient()

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      },
    )

    if (error) {
      AuthDebug.logSupabaseError(error)
      const authError = getAuthError(error)
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    AuthDebug.log("Password reset email sent successfully")
    return { success: true }
  } catch (error) {
    AuthDebug.error("Password reset error:", error)
    const authError = getAuthError(error)
    return {
      success: false,
      error: authError.userMessage,
      errorDetails: authError,
    }
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<PasswordResetResult> {
  try {
    AuthDebug.log("Resetting password with token")

    if (!newPassword) {
      const error = { message: "Password is required" }
      return {
        success: false,
        error: "New password is required",
        errorDetails: getAuthError(error),
      }
    }

    if (newPassword.length < 8) {
      const error = { message: "Password too short" }
      return {
        success: false,
        error: "Password must be at least 8 characters long",
        errorDetails: getAuthError(error),
      }
    }

    if (!hasSupabaseEnv) {
      const authError = notConfiguredError()
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    const supabase = createSupabaseBrowserClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      AuthDebug.logSupabaseError(error)
      const authError = getAuthError(error)
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    AuthDebug.log("Password reset successful")
    return { success: true }
  } catch (error) {
    AuthDebug.error("Password update error:", error)
    const authError = getAuthError(error)
    return {
      success: false,
      error: authError.userMessage,
      errorDetails: authError,
    }
  }
}

export async function resendConfirmationEmail(email: string): Promise<PasswordResetResult> {
  try {
    AuthDebug.log("Resending confirmation email for:", { email })

    if (!hasSupabaseEnv) {
      const authError = notConfiguredError()
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    const supabase = createSupabaseBrowserClient()

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.toLowerCase().trim(),
    })

    if (error) {
      AuthDebug.logSupabaseError(error)
      const authError = getAuthError(error)
      return {
        success: false,
        error: authError.userMessage,
        errorDetails: authError,
      }
    }

    AuthDebug.log("Confirmation email resent successfully")
    return { success: true }
  } catch (error) {
    AuthDebug.error("Resend confirmation error:", error)
    const authError = getAuthError(error)
    return {
      success: false,
      error: authError.userMessage,
      errorDetails: authError,
    }
  }
}

export async function signOut(): Promise<void> {
  try {
    AuthDebug.log("Signing out user")

    if (!hasSupabaseEnv) {
      AuthDebug.log("Supabase not configured; treating as signed out")
      return
    }

    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    AuthDebug.log("Sign out successful")
  } catch (error) {
    AuthDebug.error("Sign out error:", error)
    throw error
  }
}
