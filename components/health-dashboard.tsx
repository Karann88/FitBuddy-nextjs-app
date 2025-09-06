"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Droplets,
  Heart,
  Moon,
  Scale,
  Utensils,
  TrendingUp,
  Target,
  Award,
  Zap,
  Calendar,
  Loader2,
  Sparkles,
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { format, subDays, startOfDay, endOfDay } from "date-fns"

const supabase = createSupabaseBrowserClient()

interface DashboardData {
  date: string
  day: string
  mood: number | null
  water: number
  sleep: number
  weight: number | null
  calories: number
  exercise: number
}

interface TodayStats {
  mood: { value: number; emoji: string; status: string }
  water: { current: number; goal: number; percentage: number }
  sleep: { hours: number; quality: number | null; status: string }
  weight: { current: number | null; change: number | null }
  calories: { consumed: number; remaining: number }
  exercise: { duration: number; sessions: number }
}

export function HealthDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({
    mood: { value: 2, emoji: "😊", status: "Neutral" },
    water: { current: 0, goal: 8, percentage: 0 },
    sleep: { hours: 0, quality: null, status: "No data" },
    weight: { current: null, change: null },
    calories: { consumed: 0, remaining: 2200 },
    exercise: { duration: 0, sessions: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthLoading || !user) {
      setIsLoading(true)
      return
    }

    const fetchDashboardData = async () => {
      setIsLoading(true)
      const today = new Date()
      const sevenDaysAgo = subDays(today, 6)

      try {
        // Fetch all data for the past week
        const [moodData, waterData, sleepData, weightData, mealData, exerciseData] = await Promise.all([
          supabase
            .from("mood_entries")
            .select("date, mood_value, mood_emoji")
            .eq("user_id", user.id)
            .gte("date", format(startOfDay(sevenDaysAgo), "yyyy-MM-dd"))
            .lte("date", format(endOfDay(today), "yyyy-MM-dd")),

          supabase
            .from("water_entries")
            .select("date, cups_consumed, daily_goal")
            .eq("user_id", user.id)
            .gte("date", format(startOfDay(sevenDaysAgo), "yyyy-MM-dd"))
            .lte("date", format(endOfDay(today), "yyyy-MM-dd")),

          supabase
            .from("sleep_entries")
            .select("date, bedtime, wake_time, sleep_quality")
            .eq("user_id", user.id)
            .gte("date", format(startOfDay(sevenDaysAgo), "yyyy-MM-dd"))
            .lte("date", format(endOfDay(today), "yyyy-MM-dd")),

          supabase
            .from("weight_entries")
            .select("date, weight")
            .eq("user_id", user.id)
            .gte("date", format(startOfDay(sevenDaysAgo), "yyyy-MM-dd"))
            .lte("date", format(endOfDay(today), "yyyy-MM-dd")),

          supabase
            .from("meal_entries")
            .select("date, calories")
            .eq("user_id", user.id)
            .gte("date", format(startOfDay(sevenDaysAgo), "yyyy-MM-dd"))
            .lte("date", format(endOfDay(today), "yyyy-MM-dd")),

          supabase
            .from("exercise_entries")
            .select("date, duration")
            .eq("user_id", user.id)
            .not("exercise_name", "ilike", "%breathing%")
            .gte("date", format(startOfDay(sevenDaysAgo), "yyyy-MM-dd"))
            .lte("date", format(endOfDay(today), "yyyy-MM-dd")),
        ])

        // Process data for charts
        const chartData: DashboardData[] = Array.from({ length: 7 }).map((_, i) => {
          const date = subDays(today, 6 - i)
          const dateStr = format(date, "yyyy-MM-dd")
          const dayStr = format(date, "EEE")

          // Get mood data
          const moodEntry = moodData.data?.find((m) => format(new Date(m.date), "yyyy-MM-dd") === dateStr)

          // Get water data
          const waterEntry = waterData.data?.find((w) => format(new Date(w.date), "yyyy-MM-dd") === dateStr)

          // Get sleep data and calculate duration
          const sleepEntry = sleepData.data?.find((s) => format(new Date(s.date), "yyyy-MM-dd") === dateStr)
          let sleepHours = 0
          if (sleepEntry?.bedtime && sleepEntry?.wake_time) {
            try {
              const bedtime = new Date(`${dateStr}T${sleepEntry.bedtime}`)
              let wakeTime = new Date(`${dateStr}T${sleepEntry.wake_time}`)
              if (wakeTime < bedtime) {
                wakeTime = new Date(wakeTime.setDate(wakeTime.getDate() + 1))
              }
              sleepHours = Math.round(((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60)) * 10) / 10
            } catch (e) {
              console.error("Error calculating sleep duration:", e)
            }
          }

          // Get weight data
          const weightEntry = weightData.data?.find((w) => format(new Date(w.date), "yyyy-MM-dd") === dateStr)

          // Get calories data
          const dailyCalories =
            mealData.data
              ?.filter((m) => format(new Date(m.date), "yyyy-MM-dd") === dateStr)
              .reduce((sum, meal) => sum + meal.calories, 0) || 0

          // Get exercise data
          const dailyExercise =
            exerciseData.data
              ?.filter((e) => format(new Date(e.date), "yyyy-MM-dd") === dateStr)
              .reduce((sum, exercise) => sum + exercise.duration, 0) || 0

          return {
            date: dateStr,
            day: dayStr,
            mood: moodEntry?.mood_value || null,
            water: waterEntry?.cups_consumed || 0,
            sleep: sleepHours,
            weight: weightEntry?.weight || null,
            calories: dailyCalories,
            exercise: dailyExercise,
          }
        })

        setDashboardData(chartData)

        // Calculate today's stats
        const todayData = chartData[chartData.length - 1]
        const yesterdayWeight = chartData[chartData.length - 2]?.weight

        const todayMoodEntry = moodData.data?.find(
          (m) => format(new Date(m.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
        )
        const todayWaterEntry = waterData.data?.find(
          (w) => format(new Date(w.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
        )
        const todaySleepEntry = sleepData.data?.find(
          (s) => format(new Date(s.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
        )

        const exerciseSessions =
          exerciseData.data?.filter((e) => format(new Date(e.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
            .length || 0

        setTodayStats({
          mood: {
            value: todayMoodEntry?.mood_value || 2,
            emoji: todayMoodEntry?.mood_emoji || "😊",
            status: todayMoodEntry ? getMoodStatus(todayMoodEntry.mood_value) : "No entry today",
          },
          water: {
            current: todayWaterEntry?.cups_consumed || 0,
            goal: todayWaterEntry?.daily_goal || 8,
            percentage: Math.round(((todayWaterEntry?.cups_consumed || 0) / (todayWaterEntry?.daily_goal || 8)) * 100),
          },
          sleep: {
            hours: todayData.sleep,
            quality: todaySleepEntry?.sleep_quality || null,
            status: todayData.sleep > 0 ? getSleepStatus(todayData.sleep) : "No data",
          },
          weight: {
            current: todayData.weight,
            change:
              todayData.weight && yesterdayWeight ? Math.round((todayData.weight - yesterdayWeight) * 10) / 10 : null,
          },
          calories: {
            consumed: todayData.calories,
            remaining: Math.max(0, 2200 - todayData.calories),
          },
          exercise: {
            duration: todayData.exercise,
            sessions: exerciseSessions,
          },
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Set up real-time subscriptions for all tables
    const channels = [
      supabase
        .channel("dashboard_mood")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "mood_entries", filter: `user_id=eq.${user.id}` },
          () => fetchDashboardData(),
        ),
      supabase
        .channel("dashboard_water")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "water_entries", filter: `user_id=eq.${user.id}` },
          () => fetchDashboardData(),
        ),
      supabase
        .channel("dashboard_sleep")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "sleep_entries", filter: `user_id=eq.${user.id}` },
          () => fetchDashboardData(),
        ),
      supabase
        .channel("dashboard_weight")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "weight_entries", filter: `user_id=eq.${user.id}` },
          () => fetchDashboardData(),
        ),
      supabase
        .channel("dashboard_meals")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "meal_entries", filter: `user_id=eq.${user.id}` },
          () => fetchDashboardData(),
        ),
      supabase
        .channel("dashboard_exercises")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "exercise_entries", filter: `user_id=eq.${user.id}` },
          () => fetchDashboardData(),
        ),
    ]

    channels.forEach((channel) => channel.subscribe())
    fetchDashboardData()

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel))
    }
  }, [user, isAuthLoading])

  const getMoodStatus = (moodValue: number): string => {
    if (moodValue >= 4) return "Excellent mood today!"
    if (moodValue >= 3) return "Good mood today"
    if (moodValue >= 2) return "Neutral mood"
    if (moodValue >= 1) return "Low mood today"
    return "Very low mood"
  }

  const getSleepStatus = (hours: number): string => {
    if (hours >= 8) return "Great sleep!"
    if (hours >= 7) return "Good sleep"
    if (hours >= 6) return "Adequate sleep"
    return "Need more sleep"
  }

  // Calculate current values and progress
  // const currentData = dashboardData[dashboardData.length - 1]

  // Calculate overall health score
  const healthMetrics = [
    { value: todayStats.mood.value, target: 5, weight: 0.2 },
    { value: todayStats.water.current, target: todayStats.water.goal, weight: 0.15 },
    { value: todayStats.sleep.hours, target: 8, weight: 0.2 },
    { value: todayStats.calories.consumed, target: 2200, weight: 0.2, inverse: true },
    { value: todayStats.exercise.duration, target: 30, weight: 0.15 },
    { value: todayStats.weight.current || 70, target: 70, weight: 0.1, inverse: true }, // Assuming target weight is 70kg
  ]

  const healthScore = healthMetrics.reduce((score, metric) => {
    const progress = metric.inverse
      ? Math.max(0, 100 - Math.abs((metric.value - metric.target) / metric.target * 100))
      : Math.min((metric.value / metric.target) * 100, 100)
    return score + (progress * metric.weight)
  }, 0)

  const goalsMetToday = [
    todayStats.mood.value >= 4,
    todayStats.water.percentage >= 100,
    todayStats.sleep.hours >= 7,
    todayStats.exercise.duration >= 30,
    todayStats.calories.consumed >= 1800 && todayStats.calories.consumed <= 2400,
    // todayStats.breathing.duration >= 5
  ].filter(Boolean).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <Sparkles className="h-6 w-6 text-cyan-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <span className="text-muted-forground font-medium">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background p-6 overflow-auto">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full space-y-6">
        {/* Health Overview Dashboard */}
        <Card className="bg-card border-border shadow-md hover:shadow-xl transition-all backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 rounded-full bg-primary shadow-lg">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  Health Overview Dashboard
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-muted-foreground">Your comprehensive health metrics and wellness tracking</CardDescription>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-purple-600">{Math.round(healthScore)}%</div>
                  <div className="text-sm text-muted-foreground font-medium">Health Score</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
                    Health Score
                  </span>
                  {/* <span className="text-muted-foreground">{Math.round(healthScore)}%</span> */}
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {Math.round(healthScore)}%
                  </Badge>
                </div>
                <Progress value={healthScore} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Goals Met Today
                  </span>
                  {/* <span className="text-muted-foreground">{goalsMetToday}/6</span> */}
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                    {goalsMetToday}/6
                  </Badge>
                </div>
                <Progress value={(goalsMetToday / 6) * 100} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Weekly Trend
                  </span>
                  {/* <span className="text-muted-foreground">+{Math.round(healthScore - 65)}%</span> */}
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +{Math.round(healthScore - 65)}%
                  </Badge>
                </div>
                <Progress value={Math.min(healthScore + 10, 100)} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Active Streak
                  </span>
                  {/* <span className="text-muted-foreground">{Math.max(1, goalsMetToday)} days</span> */}
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {Math.max(1, goalsMetToday)} days
                  </Badge>
                </div>
                <Progress value={Math.min(goalsMetToday * 16.7, 100)} className="h-3 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <Card className="bg-card border-border shadow-2xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Analytics & Trends
            </CardTitle>
            <CardDescription>Detailed view of your health metrics over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="activity" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6 bg-muted text-muted-foreground rounded-md shadow-sm">
                <TabsTrigger value="activity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Activity className="h-4 w-4 mr-1" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="sleep" className="data-[state=active]:bg-gray-100 data-[state=active]:text-primary">
                  <Moon className="h-4 w-4 mr-1" />
                  Sleep
                </TabsTrigger>
                <TabsTrigger value="water" className="data-[state=active]:bg-gray-100 data-[state=active]:text-primary">
                  <Droplets className="h-4 w-4 mr-1" />
                  Water
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Utensils className="h-4 w-4 mr-1" />
                  Nutrition
                </TabsTrigger>
                <TabsTrigger value="weight" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Scale className="h-4 w-4 mr-1" />
                  Weight
                </TabsTrigger>
                <TabsTrigger value="mood" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Heart className="h-4 w-4 mr-1" />
                  Mood
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-4">
                <div className="h-[350px] p-4 rounded-lg border shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData}>
                      <defs>
                        <linearGradient id="exerciseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="exercise"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#exerciseGradient)"
                        name="Exercise (min)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="sleep" className="space-y-4">
                <div className="h-[350px] p-4 rounded-lg border shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData}>
                      <defs>
                        <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sleep" 
                        name="Sleep (hours)" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        fill="url(#sleepGradient)" 
                        // dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="water" className="space-y-4">
                <div className="h-[350px] p-4 rounded-lg border shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData}>
                      <defs>
                        <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="water" 
                        fill="url(#waterGradient)" 
                        name="Water (cups)" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="nutrition" className="space-y-4">
                <div className="h-[350px] p-4 rounded-lg border shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData}>
                      <defs>
                        <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="calories"
                        stroke="#f97316"
                        strokeWidth={3}
                        fill="url(#caloriesGradient)"
                        name="Calories"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="weight" className="space-y-4">
                <div className="h-[350px] p-4 rounded-lg border shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#weightGradient)"
                        name="Weight (kg)"
                        // dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="mood" className="space-y-4">
                <div className="h-[350px] p-4 rounded-lg border shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis domain={[0, 5]} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        fill="url(#moodGradient)"
                        name="Mood (1-5)"
                        // dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Today's Mood */}
          <Card className="bg-card border-border shadow-xl hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Today&apos;s Mood</CardTitle>
              <Heart className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{todayStats.mood.emoji} {todayStats.mood.status}</div>
                <Badge className="bg-rose-100 text-rose-800 border-border">{todayStats.mood.value}/5</Badge>
              </div>
              <Progress value={(todayStats.mood.value / 5) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {todayStats.mood.value >= 4 ? "Positive mood streak!" : "Track your mood daily for insights"}
              </p>
            </CardContent>
          </Card>

          {/* Water Intake */}
          <Card className="bg-card border-border shadow-xl hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
              <Droplets className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{todayStats.water.current}/{todayStats.water.goal}</div>
                <Badge className="bg-blue-100 text-blue-800 border-border">{todayStats.water.percentage}%</Badge>
              </div>
              <Progress value={todayStats.water.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {todayStats.water.percentage >= 100
                  ? "Great hydration today!"
                  : `${todayStats.water.goal - todayStats.water.current} more cups to reach daily goal`}
              </p>
            </CardContent>
          </Card>

          {/* Sleep Quality */}
          <Card className="bg-card border-border shadow-xl hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleep Quality</CardTitle>
              <Moon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{todayStats.sleep.hours}h</div>
                <Badge className="bg-indigo-100 text-indigo-800 border-border">
                  {todayStats.sleep.quality ? `${todayStats.sleep.quality}/5` : "No data"}
                </Badge>
              </div>
              <Progress value={(todayStats.sleep.hours / 8) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{todayStats.sleep.status}</p>
            </CardContent>
          </Card>

          {/* Weight Tracking */}
          <Card className="bg-card border-border shadow-xl hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weight Tracking</CardTitle>
              <Scale className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  <Badge className="bg-orange-100 text-orange-800 border-border">
                    {todayStats.weight.current ? `${todayStats.weight.current}kg` : "No data"}
                  </Badge>
                </div>
                {todayStats.weight.change !== null && (
                  <Badge className={`${todayStats.weight.change > 0
                    ? "bg-red-100 text-red-800 border-red-200"
                    : todayStats.weight.change < 0
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}>
                    {todayStats.weight.change > 0 ? "+" : ""}{todayStats.weight.change}kg
                  </Badge>
                )}
              </div>
              <Progress value={todayStats.weight.current ? 75 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {todayStats.weight.change !== null
                  ? `${Math.abs(todayStats.weight.change)}kg ${todayStats.weight.change > 0 ? "increase" : "decrease"} from yesterday`
                  : "Track your weight daily for trends"}
              </p>
            </CardContent>
          </Card>

          {/* Nutrition */}
          <Card className="bg-card border-border shadow-xl hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nutrition</CardTitle>
              <Utensils className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{todayStats.calories.consumed}</div>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  {Math.round((todayStats.calories.consumed / 2200) * 100)}%
                </Badge>
              </div>
              <Progress value={(todayStats.calories.consumed / 2200) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {todayStats.calories.remaining > 0
                  ? `${todayStats.calories.remaining} calories remaining today`
                  : "Daily calorie goal reached!"}
              </p>
            </CardContent>
          </Card>

          {/* Exercise & Activity */}
          <Card className="bg-card border-border shadow-xl hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exercise & Activity</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{todayStats.exercise.duration}min</div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  {todayStats.exercise.sessions} sessions
                </Badge>
              </div>
              <Progress value={(todayStats.exercise.duration / 60) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {todayStats.exercise.duration >= 30
                  ? "Great workout today!"
                  : `${60 - todayStats.exercise.duration} more minutes to reach daily goal`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
