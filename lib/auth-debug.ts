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
      const toPlainObject = (err: any) => {
        if (!err) return { message: "Unknown error" }
        if (err instanceof Error) {
          return {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
        }
        const obj = typeof err === "object" ? err : { value: String(err) }
        return {
          message: obj.message ?? obj.error_description ?? obj.error ?? String(err),
          code: obj.code ?? obj.error_code ?? "",
          status: obj.status ?? obj.statusCode ?? "",
          details: obj.details ?? obj.hint ?? "",
          raw: (() => {
            try {
              return JSON.stringify(obj)
            } catch {
              return String(obj)
            }
          })(),
        }
      }

      const payload = toPlainObject(error)
      try {
        console.error(`[AUTH ERROR] ${message} ${JSON.stringify(payload)}`)
      } catch {
        console.error(`[AUTH ERROR] ${message}`, payload)
      }
    }
  },

  logSupabaseError: (error: any) => {
    if (process.env.NODE_ENV === "development") {
      const toPlainObject = (err: any) => {
        if (!err) return { message: "Unknown error" }
        if (err instanceof Error) {
          return {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
        }
        const obj = typeof err === "object" ? err : { value: String(err) }
        return {
          message: obj.message ?? obj.error_description ?? obj.error ?? "",
          code: obj.code ?? obj.error_code ?? "",
          status: obj.status ?? obj.statusCode ?? "",
          details: obj.details ?? obj.hint ?? "",
          raw: (() => {
            try {
              return JSON.stringify(obj)
            } catch {
              return String(obj)
            }
          })(),
        }
      }

      const payload = toPlainObject(error)
      try {
        console.error(`[SUPABASE ERROR] ${JSON.stringify(payload)}`)
      } catch {
        console.error("[SUPABASE ERROR]", payload)
      }
    }
  },
}
