import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { WaterTracker } from "@/components/water-tracker"

export default function WaterPage() {
  return (
        <DashboardShell>
          <DashboardHeader
            heading="Water Intake"
            text="Stay hydrated and track your daily water intake"
          />
          <WaterTracker />
        </DashboardShell>
  )
}
