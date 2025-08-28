import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MoodTracker } from "@/components/mood-tracker"

export default function MoodPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Mood Tracker"
        text="Track your daily mood with emoji buttons and view your mood patterns"
      />
      <MoodTracker />
    </DashboardShell>
  )
}
