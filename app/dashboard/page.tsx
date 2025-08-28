import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { HealthDashboard } from "@/components/health-dashboard"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Health Dashboard" text="Track and monitor your overall health and wellness" />
      <HealthDashboard />
    </DashboardShell>
  )
}
