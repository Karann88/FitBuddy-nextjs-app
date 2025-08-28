import type React from "react"
interface dashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: dashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col span-y-6">
        <div className="grid flex-1 gap-6">{children}</div>
    </div>
  )
}
