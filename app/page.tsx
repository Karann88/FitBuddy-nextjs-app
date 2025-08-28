import { redirect } from "next/navigation"
import { checkAuthStatus } from "@/lib/auth"

export default async function HomePage() {
  const isAuthenticated = await checkAuthStatus()

  if (isAuthenticated) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
}
