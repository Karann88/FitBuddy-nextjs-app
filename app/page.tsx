import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/auth-server"

export default async function HomePage() {
  const user = await getServerUser()
  redirect(user ? "/dashboard" : "/auth/login")
}
