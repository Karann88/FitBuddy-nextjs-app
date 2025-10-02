import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// Public dashboard layout; authentication is optional

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6">
          <SidebarTrigger />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
