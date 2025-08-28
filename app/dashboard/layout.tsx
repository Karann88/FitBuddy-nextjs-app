import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
              <div className="flex min-h-screen">
                <AppSidebar />
                <main className="flex-1 p-4 md:p-6">
                  <SidebarTrigger />
                  {children}</main>
              </div>
            </SidebarProvider>
    </ProtectedRoute>
  )
}
