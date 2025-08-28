// "use client"
import { Suspense } from "react"
// import dynamic from "next/dynamic";
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/auth-server"
import { AuthLayout } from "@/components/auth/auth-layout"

// const ResetPasswordForm = dynamic(() => import("@/components/auth/reset-password-form").then((mod) => mod.ResetPasswordForm), { ssr: true })
export default async function ResetPasswordPage() {
  const serverUser = await getServerUser()

  if (!serverUser) {
    // User is not logged in, redirect to login
    redirect("/auth/login")
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter your new password below"
      showToggle={true}
      toggleText="Back to"
      toggleLink="/auth/login"
      toggleLinkText="Sign in"
    >
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
