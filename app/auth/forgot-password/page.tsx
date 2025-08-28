// import dynamic from "next/dynamic";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/auth-server"
import { AuthLayout } from "@/components/auth/auth-layout"

// const ForgotPasswordForm = dynamic(() => import("@/components/auth/forgot-password-form").then((mod) => mod.ForgotPasswordForm), { ssr: true })
export default async function ForgotPasswordPage() {
  const serverUser = await getServerUser()

  if (serverUser) {
    // User is already logged in, redirect to dashboard
    redirect("/dashboard")
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email to receive a password reset link"
      showToggle={true}
      toggleText="Remember your password?"
      toggleLink="/auth/login"
      toggleLinkText="Sign in"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
