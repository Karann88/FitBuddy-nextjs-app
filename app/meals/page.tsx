import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MealTracker } from "@/components/meal-tracker"

export default function MealsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Meal Log" text="Track your meals and monitor your calorie intake" />
      <MealTracker />
    </DashboardShell>
  )
}
