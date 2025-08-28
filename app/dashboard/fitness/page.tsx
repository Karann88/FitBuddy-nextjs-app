import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { FitnessTracker } from "@/components/fitness-tracker"

export default function FitnessPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Fitness Routine" text="Track your workouts and stay on top of your fitness goals" />
      <FitnessTracker />
    </DashboardShell>
  )
}
