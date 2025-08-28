// "use client"
// import dynamic from "next/dynamic";
import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/auth-server"
import { LoginForm } from "@/components/auth/login-form"
import { AuthLayout } from "@/components/auth/auth-layout"

// Render LoginForm only on the client (no SSR), so no hydration mismatch disappears
// const LoginForm = dynamic(() => import("@/components/auth/login-form").then((mod) => mod.LoginForm), { ssr: false })

export default async function LoginPage() {

  const serverUser = await getServerUser()

  if (serverUser) {
    // User is already logged in, redirect to dashboard
    redirect("/dashboard")
  }
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your wellness account"
      showToggle={true}
      toggleText="Don't have an account?"
      toggleLink="/auth/signup"
      toggleLinkText="Sign up"
    >
      <LoginForm />
    </AuthLayout>
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
