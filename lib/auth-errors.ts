// Centralized error handling and user-friendly messages
export interface AuthError {
  code: string
  message: string
  userMessage: string
  action?: string
}

export const AUTH_ERRORS: Record<string, AuthError> = {
  // Supabase specific errors
  invalid_credentials: {
    code: "invalid_credentials",
    message: "Invalid login credentials",
    userMessage: "The email or password you entered is incorrect. Please check your credentials and try again.",
    action: "verify_credentials",
  },
  email_not_confirmed: {
    code: "email_not_confirmed",
    message: "Email not confirmed",
    userMessage: "Please check your email and click the confirmation link before signing in.",
    action: "resend_confirmation",
  },
  too_many_requests: {
    code: "too_many_requests",
    message: "Too many requests",
    userMessage: "Too many sign-in attempts. Please wait a few minutes before trying again.",
    action: "wait_and_retry",
  },
  signup_disabled: {
    code: "signup_disabled",
    message: "Signup disabled",
    userMessage: "New account registration is currently disabled. Please contact support.",
    action: "contact_support",
  },
  email_address_invalid: {
    code: "email_address_invalid",
    message: "Invalid email address",
    userMessage: "Please enter a valid email address.",
    action: "fix_email",
  },
  password_too_short: {
    code: "password_too_short",
    message: "Password too short",
    userMessage: "Password must be at least 8 characters long.",
    action: "strengthen_password",
  },
  user_not_found: {
    code: "user_not_found",
    message: "User not found",
    userMessage: "No account found with this email address. Please check your email or create a new account.",
    action: "check_email_or_signup",
  },
  weak_password: {
    code: "weak_password",
    message: "Weak password",
    userMessage:
      "Please choose a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.",
    action: "strengthen_password",
  },
  email_already_registered: {
    code: "email_already_registered",
    message: "Email already registered",
    userMessage: "An account with this email already exists. Please sign in instead or use a different email.",
    action: "sign_in_instead",
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAuthError(error: any): AuthError {
  const errorMessage = error?.message?.toLowerCase() || ""
  const errorCode = error?.code || error?.error_code || ""

  // Map Supabase errors to our error codes
  if (errorMessage.includes("invalid login credentials") || errorCode === "invalid_credentials") {
    return AUTH_ERRORS.invalid_credentials
  }

  if (errorMessage.includes("email not confirmed") || errorCode === "email_not_confirmed") {
    return AUTH_ERRORS.email_not_confirmed
  }

  if (errorMessage.includes("too many requests") || errorCode === "too_many_requests") {
    return AUTH_ERRORS.too_many_requests
  }

  if (errorMessage.includes("signup disabled") || errorCode === "signup_disabled") {
    return AUTH_ERRORS.signup_disabled
  }

  if (errorMessage.includes("invalid email") || errorCode === "email_address_invalid") {
    return AUTH_ERRORS.email_address_invalid
  }

  if (errorMessage.includes("password is too short") || errorCode === "password_too_short") {
    return AUTH_ERRORS.password_too_short
  }

  if (errorMessage.includes("user not found") || errorCode === "user_not_found") {
    return AUTH_ERRORS.user_not_found
  }

  if (errorMessage.includes("weak password") || errorCode === "weak_password") {
    return AUTH_ERRORS.weak_password
  }

  if (errorMessage.includes("already registered") || errorCode === "email_already_registered") {
    return AUTH_ERRORS.email_already_registered
  }

  // Default error for unknown cases
  return {
    code: "unknown_error",
    message: error?.message || "Unknown error",
    userMessage: "An unexpected error occurred. Please try again or contact support if the problem persists.",
    action: "retry_or_contact_support",
  }
}

