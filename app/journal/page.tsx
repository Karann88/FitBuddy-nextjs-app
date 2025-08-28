import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MentalHealthJournal } from "@/components/mental-health-journal"

export default function JournalPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Mental Health Journal" text="Track your thoughts, feelings, and emotional well-being" />
      <MentalHealthJournal />
    </DashboardShell>
  )
}
