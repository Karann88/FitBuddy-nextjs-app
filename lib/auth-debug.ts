/* eslint-disable @typescript-eslint/no-explicit-any */
// Debug utilities for authentication troubleshooting
export const AuthDebug = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUTH DEBUG] ${message}`, data || "")
    }
  },

  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[AUTH ERROR] ${message}`, error || "")
    }
  },

  logSupabaseError: (error: any) => {
    if (process.env.NODE_ENV === "development") {
      if (typeof error === "object" && error !== null) {
        const errObj = error as {
          message?: string;
          status?: string;
          statusCode?: string;
          details?: string;
          hint?: string;
          code?: string;
        };
        console.error("[SUPABASE ERROR]", {
          message: errObj.message,
          status: errObj.status,
          statusCode: errObj.statusCode,
          details: errObj.details,
          hint: errObj.hint,
          code: errObj.code,
        })
      } else {
        console.error("[SUPABASE ERROR]", { error })
      }
    }
  },
}
