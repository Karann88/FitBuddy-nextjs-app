// import { createClient } from "@supabase/supabase-js"
import { createServerClient, createBrowserClient } from "@supabase/ssr"

/* ------------------------------------------------------------------
   Environment variables
   ------------------------------------------------------------------ */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

/* ------------------------------
   BROWSER CLIENT (React components)
   ------------------------------ */
export const createSupabaseBrowserClient = () => {
  if (!hasSupabaseEnv) {
    // Do not throw at import time; callers should guard with hasSupabaseEnv
    // Returning a client here without proper env would throw internally
    // so we explicitly throw with a clear message when invoked
    throw new Error(
      [
        "Supabase is not configured.",
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
      ].join("\n"),
    )
  }
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}

/* ------------------------------
   SERVER CLIENT (SSR, API routes, middleware)
   ------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSupabaseServerClient = (cookies: any) => {
  if (!hasSupabaseEnv) {
    throw new Error(
      [
        "Supabase is not configured.",
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
      ].join("\n"),
    )
  }
  return createServerClient(supabaseUrl!, supabaseAnonKey!, { cookies })
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
