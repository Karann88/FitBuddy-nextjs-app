import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { BreathingExercise } from "@/components/breathing-exercise"

export default function BreathingPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Breathing Exercise"
        text="Practice mindful breathing techniques to reduce stress, improve focus, and enhance your well-being"
      />
      <BreathingExercise />
    </DashboardShell>
  )
}
