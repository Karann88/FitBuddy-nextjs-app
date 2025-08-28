import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { WeightTracker } from "@/components/weight-tracker"

export default function WeightPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Weight Tracker" text="Track your weight and body measurements over time" />
      <WeightTracker />
    </DashboardShell>
  )
}
