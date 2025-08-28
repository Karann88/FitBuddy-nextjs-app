/* eslint-disable @typescript-eslint/no-unused-vars */
// import { createClient } from "@supabase/supabase-js"
import { createServerClient, createBrowserClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"

/* ------------------------------------------------------------------
   Runtime validation of required environment variables
   ------------------------------------------------------------------ */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    [
      "Missing Supabase environment variables.",
      // "Add the following to `.env.local`",
      "  NEXT_PUBLIC_SUPABASE_URL=https://ssmzwnytlhypiufpyarf.supabase.co",
      "  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbXp3bnl0bGh5cGl1ZnB5YXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDM1NTYsImV4cCI6MjA2NTg3OTU1Nn0.85fAw1OcIoCeehlvhf0-3kWUK6YCxyf5oVBbEaaectQ",
    ].join("\n"),
  )
}
/* ------------------------------------------------------------------ */

// export const supabase = createPagesBrowserClient()
// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     persistSession: true,
//     autoRefreshToken: true,
//     detectSessionInUrl: true,
//     // flowType: "pkce"
//   }
// })

/* ------------------------------
   BROWSER CLIENT (React components)
   ------------------------------ */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}

/* ------------------------------
   SERVER CLIENT (SSR, API routes, middleware)
   ------------------------------ */
export function createSupabaseServerClient() {
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return undefined
      },
      set(name: string, value: string, options: CookieOptions) {

      },
      remove(name: string, options: CookieOptions) {

      },
    }
  }
)
}



/* ---------- Type helpers (unchanged, keep below as needed) -------- */
export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  date_of_birth?: string
  gender?: "male" | "female" | "other" | "prefer-not-to-say"
  marketing_consent: boolean
  created_at: string
  updated_at: string
}

export interface MoodEntry {
  id: string
  user_id: string
  mood_value: number
  mood_emoji: string
  notes?: string
  date: string
  created_at: string
  updated_at: string
}

export interface WaterEntry {
  id: string
  user_id: string
  cups_consumed: number
  daily_goal: number
  date: string
  created_at: string
  updated_at: string
}

export interface SleepEntry {
  quality_rating: number
  id: string
  user_id: string
  bedtime: string
  wake_time: string
  sleep_quality?: number
  sleep_duration?: string
  date: string
  created_at: string
  updated_at: string
}

export interface WeightEntry {
  id: string
  user_id: string
  weight: number
  body_fat_percentage?: number
  waist_measurement?: number
  chest_measurement?: number
  hip_measurement?: number
  date: string
  created_at: string
  updated_at: string
}

export interface MealEntry {
  id: string
  user_id: string
  meal_name: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  date: string
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood_emoji: string
  tags: string[]
  date: string
  created_at: string
  updated_at: string
}

export interface ExerciseEntry {
  id: string
  user_id: string
  exercise_name: string
  duration: number
  date: string
  created_at: string
  updated_at: string
}

export interface StretchEntry {
  id : string
  user_id: string
  stretch_name: string
  duration: number
  date: string
  created_at: string
}


// lib/supabase.ts
// import { cookies } from "next/headers"
// import {
//   createServerClient,
//   type CookieOptions,
// } from "@supabase/ssr"
// import { createBrowserClient } from "@supabase/ssr"
// import { createSupabaseServerClient } from './supabase';

// // ------------------------------
// // BROWSER CLIENT (React components)
// // ------------------------------
// export function createSupabaseBrowserClient() {
//   return createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   )
// }

// // ------------------------------
// // SERVER CLIENT (SSR, API routes, middleware)
// // ------------------------------
// export async function createSupabaseServerClient() {
//   const cookieStore = await cookies()

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return cookieStore.get(name)?.value
//         },
//         set(name: string, value: string, options: CookieOptions) {
//           try {
//             cookieStore.set({ name, value, ...options })
//           } catch {
//             // Ignore "read-only" cookies in some contexts
//           }
//         },
//         remove(name: string, options: CookieOptions) {
//           try {
//             cookieStore.set({ name, value: "", ...options })
//           } catch {
//             // Ignore
//           }
//         },
//       },
//     }
//   )
// }
