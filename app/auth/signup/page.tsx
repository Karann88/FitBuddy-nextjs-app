// import dynamic from "next/dynamic";
import { SignupForm } from "@/components/auth/signup-form"
import { getServerUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"

// const SignupForm = dynamic(() => import("@/components/auth/signup-form").then((mod) => mod.SignupForm), { ssr: true })
export default async function SignupPage() {
  const serverUser = await getServerUser()

  if (serverUser) {
    // User is already logged in, redirect to dashboard
    redirect("/dashboard")
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your wellness journey today"
      showToggle={true}
      toggleText="Already have an account?"
      toggleLink="/auth/login"
      toggleLinkText="Sign in"
    >
      <SignupForm />
    </AuthLayout>
  )
}


// import { RegisterForm } from "@/components/server/register-form"
// import { getServerUser } from "@/lib/server-auth"
// import { redirect } from "next/navigation"

// export default async function SignupPage() {
//   const user = await getServerUser()

//   if (user) {
//     redirect("/dashboard")
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-8">
//       <RegisterForm />
//     </div>
//   )
// }
