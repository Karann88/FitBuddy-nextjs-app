"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export const dynamic = "force-dynamic"

function LoginPageContent() {
  const searchParams = useSearchParams()
  const oauthError = searchParams.get("error") || undefined

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={oauthError ? `Sign-in error: ${oauthError}` : "Sign in to your wellness account"}
      showToggle={true}
      toggleText="Don't have an account?"
      toggleLink="/auth/signup"
      toggleLinkText="Sign up"
    >
      <LoginForm initialError={oauthError} />
    </AuthLayout>
  )
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <Suspense fallback={
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to your wellness account"
        showToggle={true}
        toggleText="Don't have an account?"
        toggleLink="/auth/signup"
        toggleLinkText="Sign up"
      >
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    }>
      <div suppressHydrationWarning>
        {mounted ? <LoginPageContent /> : null}
      </div>
    </Suspense>
  )
}


// import { LoginForm } from "@/components/auth/login-form"
// import { getServerUser } from "@/lib/auth-server"
// import { redirect } from "next/navigation"
// // import { LoginForm } from './../../../components/auth/login-form';

// export default async function LoginPage() {
//   const user = await getServerUser()

//   if (user) {
//     redirect("/dashboard")
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-8">
//       <LoginForm />
//     </div>
//   )
// }
