import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SleepTracker } from "@/components/sleep-tracker"

export default function SleepPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Sleep Tracker" text="Track your sleep patterns and improve your sleep quality" />
      <SleepTracker />
    </DashboardShell>
  )
}
