import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/auth-server"

export default async function HomePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams
  
  // Check if this is an OAuth callback (has code parameter)
  if (resolvedSearchParams.code) {
    // Redirect to the proper callback handler
    const callbackUrl = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    callbackUrl.searchParams.set("code", resolvedSearchParams.code as string)
    if (resolvedSearchParams.state) {
      callbackUrl.searchParams.set("state", resolvedSearchParams.state as string)
    }
    redirect(callbackUrl.toString())
  }
  
  const user = await getServerUser()
  
  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
}
