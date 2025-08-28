import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { StretchSequence } from "@/components/stretch-sequence"

export default function StretchingPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Stretch Sequence" text="Follow guided stretching routines to improve flexibility" />
      <StretchSequence />
    </DashboardShell>
  )
}