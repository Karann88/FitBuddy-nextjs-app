"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Loader2, AlertCircle, Check, X } from "lucide-react"
import { registerUser } from "@/lib/auth"
import { validatePassword } from "@/lib/validation"
import { useAuth } from "./auth-provider"

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
    marketingConsent: false,
  })
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Validate password strength
    const passwordCheck = validatePassword(formData.password)
    if (!passwordCheck.isValid) {
      setError("Password does not meet security requirements")
      setIsLoading(false)
      return
    }

    // Validate required consents
    if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
      setError("You must agree to the Terms of Service and Privacy Policy")
      setIsLoading(false)
      return
    }

    try {
      const result = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        password: formData.password,
        marketingConsent: formData.marketingConsent,
      })

      if (result.success && result.user) {
        // Auto-login after successful registration
        login(result.user)
      } else {
        setError(result.error || "Registration failed")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Validate password in real-time
    if (name === "password") {
      const validation = validatePassword(value)
      setPasswordValidation(validation.checks)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="John"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Doe"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="john.doe@example.com"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender (optional)</Label>
          <Select onValueChange={(value) => handleSelectChange("gender", value)} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a strong password"
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

        {/* Password strength indicator */}
        {formData.password && (
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
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
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
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreeToTerms"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeToTerms: checked as boolean }))}
            disabled={isLoading}
            required
          />
          <Label htmlFor="agreeToTerms" className="text-sm leading-5">
            I agree to the{" "}
            <a href="/terms" target="_blank" className="text-primary hover:underline" rel="noreferrer">
              Terms of Service
            </a>
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreeToPrivacy"
            name="agreeToPrivacy"
            checked={formData.agreeToPrivacy}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeToPrivacy: checked as boolean }))}
            disabled={isLoading}
            required
          />
          <Label htmlFor="agreeToPrivacy" className="text-sm leading-5">
            I agree to the{" "}
            <a href="/privacy" target="_blank" className="text-primary hover:underline" rel="noreferrer">
              Privacy Policy
            </a>{" "}
            and consent to the processing of my health data
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="marketingConsent"
            name="marketingConsent"
            checked={formData.marketingConsent}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, marketingConsent: checked as boolean }))}
            disabled={isLoading}
          />
          <Label htmlFor="marketingConsent" className="text-sm leading-5">
            I would like to receive wellness tips and product updates (optional)
          </Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  )
}
