"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { AuthUser } from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = !!user

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = pathname.startsWith("/auth")
      const isPublicPage = pathname === "/privacy" || pathname === "/terms"

      if (!isAuthenticated && !isAuthPage && !isPublicPage) {
        router.push("/auth/login")
      } else if (isAuthenticated && isAuthPage) {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const login = (userData: AuthUser) => {
    setUser(userData)
    router.push("/dashboard")
  }

  const logout = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error signing out:", error.message)
      }
      setUser(null)
      router.push("/auth/login")
      router.refresh()
    } catch (err) {
      console.error("Error signing out:", err)
      setUser(null)
      router.push("/auth/login")
      router.refresh()
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

