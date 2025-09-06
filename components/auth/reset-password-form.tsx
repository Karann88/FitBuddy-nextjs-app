"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, AlertCircle, Check, X } from "lucide-react"
// import { resetPassword } from "@/lib/auth"
import { validatePassword } from "@/lib/validation"
import { createSupabaseBrowserClient } from "@/lib/supabase"

export function ResetPasswordForm() {
  const supabase = createSupabaseBrowserClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })


  const router = useRouter()
  // const searchParams = useSearchParams()
  // const token = searchParams.get("token")

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          // Handle password recovery event
          router.push(`/auth/reset-password?token=${session.access_token}`)
        }
      }
    )
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  //   if (!token) {
  //     setError("Invalid or missing reset token")
  //   }
  // }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // if (!token) {
    //   setError("Invalid reset token")
    //   setIsLoading(false)
    //   return
    // }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.isValid) {
      setError("Password does not meet security requirements")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password
      })

      if (!error) {
        // Force fresh login after reset
        await supabase.auth.signOut()
        router.push("/auth/login?message=password-reset-success")
      } else {
        // catch invalid refresh token errors 
        setError(error.message)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.message?.includes("refresh_token_not_found") || err.message?.includes("Invalid Refresh Token")) {
        await supabase.auth.signOut()
        router.push("/auth/login?error=invalid-token")
        return
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)

    const validation = validatePassword(value)
    setPasswordValidation(validation.checks)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter your new password"
            required
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {password && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              {passwordValidation.length ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span className={passwordValidation.length ? "text-green-600" : "text-red-600"}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {passwordValidation.uppercase ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span className={passwordValidation.uppercase ? "text-green-600" : "text-red-600"}>
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              {passwordValidation.lowercase ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span className={passwordValidation.lowercase ? "text-green-600" : "text-red-600"}>
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              {passwordValidation.number ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span className={passwordValidation.number ? "text-green-600" : "text-red-600"}>One number</span>
            </div>
            <div className="flex items-center gap-2">
              {passwordValidation.special ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span className={passwordValidation.special ? "text-green-600" : "text-red-600"}>
                One special character
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            required
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting password...
          </>
        ) : (
          "Reset password"
        )}
      </Button>
    </form>
  )
}
