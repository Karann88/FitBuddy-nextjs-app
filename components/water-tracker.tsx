"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Droplets, 
  Plus, 
  Minus, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Clock,
  Zap,
  Heart,
  Thermometer,
  Sun,
  Activity,
  Sparkles,
  Loader2
} from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts"
import { createSupabaseBrowserClient, type WaterEntry } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { format, subDays, startOfDay, endOfDay, subWeeks, startOfWeek, endOfWeek } from "date-fns"

const supabase = createSupabaseBrowserClient()
// Enhanced quick add options with attractive styling
const quickAddOptions = [
  { amount: 0.5, label: "Small Glass", icon: "🥃", color: "bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 border-blue-300 shadow-md hover:scale-105 transition-all duration-200" },
  { amount: 1, label: "Regular Cup", icon: "☕", color: "bg-gradient-to-br from-cyan-100 to-cyan-200 hover:from-cyan-200 hover:to-cyan-300 border-cyan-300 shadow-md hover:scale-105 transition-all duration-200" },
  { amount: 1.5, label: "Large Glass", icon: "🥤", color: "bg-gradient-to-br from-teal-100 to-teal-200 hover:from-teal-200 hover:to-teal-300 border-teal-300 shadow-md hover:scale-105 transition-all duration-200" },
  { amount: 2, label: "Water Bottle", icon: "🍼", color: "bg-gradient-to-br from-sky-100 to-sky-200 hover:from-sky-200 hover:to-sky-300 border-sky-300 shadow-md hover:scale-105 transition-all duration-200" },
]

type LogEntry = {
  id: number
  amount: number
  time: string
  timestamp: number
}

export function WaterTracker() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [cups, setCups] = useState(0)
  const [goal, setGoal] = useState(8)
  const [streak, setStreak] = useState(0)
  const [todayEntries, setTodayEntries] = useState<LogEntry[]>([])
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; cups: number; goal: number; percentage: number; temperature: number }>>([])
  const [monthlyData, setMonthlyData] = useState<Array<{ week: string; average: number; goal: number; consistency: number }>>([])
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [waterStats, setWaterStats] = useState<{
    average: number
    totalCups: number
    streak: number
    consistency: number
  }>({
    average: 0,
    totalCups: 0,
    streak: 0,
    consistency: 0,
  })

  const percentage = Math.min(Math.round((cups / goal) * 100), 100)
  const isGoalReached = cups >= goal
  const remainingCups = Math.max(goal - cups, 0)

  useEffect(() => {
    if (isAuthLoading || !user) {
      setIsLoading(true)
      return
    }

    const fetchWaterData = async () => {
      setIsLoading(true)
      const today = new Date()
      const sevenDaysAgo = subDays(today, 6)
      const thirtyDaysAgo = subDays(today, 29)

      // Fetch current day's entry
      const { data: todayEntry, error: todayError } = await supabase
        .from("water_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", format(startOfDay(today), "yyyy-MM-dd"))
        .lte("date", format(endOfDay(today), "yyyy-MM-dd"))
        .single()

      if (todayError && todayError.code !== "PGRST116") {
        console.error("Error fetching today's water entry:", todayError)
      }

      if (todayEntry) {
        setCups(todayEntry.cups_consumed)
        setGoal(todayEntry.daily_goal)
        setCurrentEntryId(todayEntry.id)
      } else {
        setCups(0)
        setCurrentEntryId(null)
      }

      // Fetch weekly data for chart
      const { data: weeklyEntries, error: weeklyError } = await supabase
        .from("water_entries")
        .select("date, cups_consumed, daily_goal")
        .eq("user_id", user.id)
        .gte("date", format(startOfDay(sevenDaysAgo), "yyyy-MM-dd"))
        .lte("date", format(endOfDay(today), "yyyy-MM-dd"))
        .order("date", { ascending: true })

      if (weeklyError) {
        console.error("Error fetching weekly water entries:", weeklyError)
      }

      // Format weekly data for chart
      if (weeklyEntries) {
        const formattedWeeklyData = Array.from({ length: 7 }).map((_, i) => {
          const date = subDays(today, 6 - i)
          const entry = weeklyEntries.find((e) => format(new Date(e.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
          return {
            day: format(date, "EEE"),
            cups: entry?.cups_consumed || 0,
            goal: entry?.daily_goal || 8,
            percentage: entry ? Math.round((entry.cups_consumed / entry.daily_goal) * 100) : 0,
            temperature: 22 + Math.floor(Math.random() * 8), // Mock temperature data
          }
        })
        setWeeklyData(formattedWeeklyData)
      }

      // Fetch monthly data for statistics
      const { data: monthlyEntries, error: monthlyError } = await supabase
        .from("water_entries")
        .select("date, cups_consumed, daily_goal")
        .eq("user_id", user.id)
        .gte("date", format(startOfDay(thirtyDaysAgo), "yyyy-MM-dd"))
        .lte("date", format(endOfDay(today), "yyyy-MM-dd"))
        .order("date", { ascending: true })

      if (monthlyError) {
        console.error("Error fetching monthly water entries:", monthlyError)
      }

      // Calculate monthly data by weeks
      if (monthlyEntries && monthlyEntries.length > 0) {
        const weeks = []
        for (let i = 0; i < 4; i++) {
          const weekStart = subWeeks(today, 3 - i)
          const weekStartDate = startOfWeek(weekStart)
          const weekEndDate = endOfWeek(weekStart)
          
          const weekEntries = monthlyEntries.filter(entry => {
            const entryDate = new Date(entry.date)
            return entryDate >= weekStartDate && entryDate <= weekEndDate
          })
          
          const average = weekEntries.length > 0 
            ? weekEntries.reduce((sum, entry) => sum + entry.cups_consumed, 0) / weekEntries.length
            : 0
          
          const consistency = weekEntries.length > 0
            ? (weekEntries.filter(entry => entry.cups_consumed >= entry.daily_goal).length / weekEntries.length) * 100
            : 0

          weeks.push({
            week: `Week ${i + 1}`,
            average: Math.round(average * 10) / 10,
            goal: 8,
            consistency: Math.round(consistency)
          })
        }
        setMonthlyData(weeks)

        // Calculate overall statistics
        const totalCups = monthlyEntries.reduce((sum, entry) => sum + entry.cups_consumed, 0)
        const average = totalCups / monthlyEntries.length
        const consistency = (monthlyEntries.filter(entry => entry.cups_consumed >= entry.daily_goal).length / monthlyEntries.length) * 100

        // Calculate streak (consecutive days with goal met)
        let currentStreak = 0
        for (let i = 0; i < 30; i++) {
          const checkDate = format(subDays(today, i), "yyyy-MM-dd")
          const entry = monthlyEntries.find(e => format(new Date(e.date), "yyyy-MM-dd") === checkDate)
          if (entry && entry.cups_consumed >= entry.daily_goal) {
            currentStreak++
          } else {
            break
          }
        }

        setWaterStats({
          average: Math.round(average * 10) / 10,
          totalCups,
          streak: currentStreak,
          consistency: Math.round(consistency)
        })
        setStreak(currentStreak)
      }

      setIsLoading(false)
    }

    const waterChannel = supabase
      .channel("water_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "water_entries",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEntry = payload.new as WaterEntry | null
          const oldEntry = payload.old as WaterEntry | null
          const today = format(new Date(), "yyyy-MM-dd")

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            if (newEntry && format(new Date(newEntry.date), "yyyy-MM-dd") === today) {
              setCups(newEntry.cups_consumed)
              setGoal(newEntry.daily_goal)
              setCurrentEntryId(newEntry.id)
            }
            
            // Update weekly data
            setWeeklyData((prev) => {
              return prev.map((item) => {
                // Create a proper date from the day string for comparison
                const today = new Date()
                const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(item.day)
                const currentDayIndex = today.getDay()
                const daysBack = (currentDayIndex - dayIndex + 7) % 7
                const itemDate = subDays(today, daysBack)
                const entryDate = newEntry?.date ? new Date(newEntry.date) : null

                if (entryDate && format(itemDate, "yyyy-MM-dd") === format(entryDate, "yyyy-MM-dd")) {
                  return { 
                    ...item, 
                    cups: newEntry?.cups_consumed || 0, 
                    goal: newEntry?.daily_goal || 8,
                    percentage: newEntry ? Math.round((newEntry.cups_consumed / newEntry.daily_goal) * 100) : 0
                  }
                }
                return item
              })
            })
          } else if (payload.eventType === "DELETE") {
            if (oldEntry && format(new Date(oldEntry.date), "yyyy-MM-dd") === today) {
              setCups(0)
              setCurrentEntryId(null)
            }
            
            setWeeklyData((prev) => {
              return prev.map((item) => {
                const today = new Date()
                const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(item.day)
                const currentDayIndex = today.getDay()
                const daysBack = (currentDayIndex - dayIndex + 7) % 7
                const itemDate = subDays(today, daysBack)
                const entryDate = oldEntry?.date ? new Date(oldEntry.date) : null

                if (entryDate && format(itemDate, "yyyy-MM-dd") === format(entryDate, "yyyy-MM-dd")) {
                  return { ...item, cups: 0, percentage: 0 }
                }
                return item
              })
            })
          }
        },
      )
      .subscribe()

    fetchWaterData()

    return () => {
      supabase.removeChannel(waterChannel)
    }
  }, [user, isAuthLoading, setWaterStats])

  const handleAddCup = async (amount: number = 1) => {
    if (!user) return

    const today = format(new Date(), "yyyy-MM-dd")
    const newCups = Math.min(cups + amount, 20)

    // Optimistically update UI
    setCups(newCups)

    // Add entry to today's log
    const newEntry: LogEntry = {
      id: Date.now(),
      amount,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }
    setTodayEntries(prev => [...prev, newEntry])

    try {
      if (currentEntryId) {
        // Update existing entry
        const { error } = await supabase
          .from("water_entries")
          .update({ cups_consumed: newCups, daily_goal: goal, updated_at: new Date().toISOString() })
          .eq("id", currentEntryId)
          // .eq("user_id", user.id)
          .select()

        if (error) {
          console.error("Error updating water entry:", error)
          // Revert optimistic update on error
          setCups(newCups - amount)
          setTodayEntries(prev => prev.slice(0, -1))
        }
      } else {
        // Insert new entry
        const { data, error } = await supabase
          .from("water_entries")
          .insert({
            user_id: user.id,
            cups_consumed: newCups,
            daily_goal: goal,
            date: today,
          })
          .select()
          .single()

        if (error) {
          console.error("Error inserting water entry:", error)
          // Revert optimistic update on error
          setCups(newCups - amount)
          setTodayEntries(prev => prev.slice(0, -1))
        } else if (data) {
          setCurrentEntryId(data.id)
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      // Revert optimistic update on error
      setCups(newCups - amount)
      setTodayEntries(prev => prev.slice(0, -1))
    }
  }

  const handleRemoveCup = async () => {
    if (!user || cups === 0) return

    const newCups = Math.max(cups - 1, 0)

    // Optimistically update UI
    setCups(newCups)
    setTodayEntries(prev => prev.slice(0, -1))

    try {
      if (currentEntryId) {
        if (newCups === 0) {
          const { error } = await supabase.from("water_entries").delete().eq("id", currentEntryId)

          if (error) {
            console.error("Error deleting water entry:", error)
            // Revert optimistic update on error
            setCups(newCups + 1)
          } else {
            setCurrentEntryId(null)
          }
        } else {
          const { error } = await supabase
            .from("water_entries")
            .update({ cups_consumed: newCups, daily_goal: goal, updated_at: new Date().toISOString() })
            .eq("id", currentEntryId)

          if (error) {
            console.error("Error updating water entry:", error)
            // Revert optimistic update on error
            setCups(newCups + 1)
          }
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      // Revert optimistic update on error
      setCups(newCups + 1)
    }
  }

  const handleGoalChange = async (value: number[]) => {
    const newGoal = value[0]
    setGoal(newGoal)

    if (!user) return

    const today = format(new Date(), "yyyy-MM-dd")

    try {
      if (currentEntryId) {
        const { error } = await supabase
          .from("water_entries")
          .update({ daily_goal: newGoal, updated_at: new Date().toISOString() })
          .eq("id", currentEntryId)
        if (error) console.error("Error updating water goal:", error)
      } else if (cups > 0) {
        // Only create entry if there are cups consumed
        const { data, error } = await supabase
          .from("water_entries")
          .insert({
            user_id: user.id,
            cups_consumed: cups,
            daily_goal: newGoal,
            date: today,
          })
          .select()
          .single()
        if (error) console.error("Error inserting water entry with new goal:", error)
        else if (data) {
          setCurrentEntryId(data.id)
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    }
  }

  const getMotivationalMessage = () => {
    if (isGoalReached) {
      return "🎉 Fantastic! You've reached your daily hydration goal!"
    } else if (percentage >= 75) {
      return "💪 Almost there! Just a few more sips to go!"
    } else if (percentage >= 50) {
      return "🌊 Great progress! Your body is loving the hydration!"
    } else if (percentage >= 25) {
      return "💧 Good start! Keep the momentum going!"
    } else {
      return "🚰 Time to hydrate! Your wellness journey starts now!"
    }
  }

  const getHydrationLevel = () => {
    if (percentage >= 100) return { 
      level: "Excellent", 
      color: "bg-emerald-500", 
      textColor: "text-emerald-700",
      bgClass: "bg-emerald-100 text-emerald-800 border-emerald-200"
    }
    if (percentage >= 75) return { 
      level: "Good", 
      color: "bg-blue-500", 
      textColor: "text-blue-700",
      bgClass: "bg-blue-100 text-blue-800 border-blue-200"
    }
    if (percentage >= 50) return { 
      level: "Fair", 
      color: "bg-yellow-500", 
      textColor: "text-yellow-700",
      bgClass: "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
    if (percentage >= 25) return { 
      level: "Low", 
      color: "bg-orange-500", 
      textColor: "text-orange-700",
      bgClass: "bg-orange-100 text-orange-800 border-orange-200"
    }
    return { 
      level: "Very Low", 
      color: "bg-red-500", 
      textColor: "text-red-700",
      bgClass: "bg-red-100 text-red-800 border-red-200"
    }
  }

  const hydrationStatus = getHydrationLevel()

  // Calculate weekly average and consistency
  const weeklyAverage = weeklyData.length > 0 ? weeklyData.reduce((sum, day) => sum + day.cups, 0) / weeklyData.length : 0
  const weeklyConsistency = weeklyData.length > 0 ? weeklyData.filter(day => day.cups >= day.goal).length / weeklyData.length * 100 : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Sparkles className="h-6 w-6 text-cyan-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <span className="text-muted-foreground font-medium">Loading your hydration data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-6 overflow-auto">
      <div className="w-full space-y-8">
        {/* Enhanced Header with Gradient */}
        {/* <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-full bg- shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Hydration Dashboard
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your daily water intake, build healthy habits, and achieve optimal hydration for peak wellness
          </p>
        </div> */}

        {/* Enhanced Overview Dashboard */}
        <Card className="bg-card border border-border shadow-md hover:shadow-xl transition-all backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-3xl">
                  <div className="p-3 rounded-full bg-primary shadow-lg">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <Target className="h-6 w-6 text-cyan-600" />
                  Hydration Overview
                  {isGoalReached && <Award className="h-6 w-6 text-yellow-500 animate-bounce" />}
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-muted-foreground">Your comprehensive hydration metrics and progress tracking</CardDescription>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-primary">{percentage}%</div>
                  <div className="text-sm text-muted-foreground font-medium">Daily Goal</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-primary">{streak}</div>
                  <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Daily Progress
                  </span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {percentage}%
                  </Badge>
                </div>
                <Progress value={percentage} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground">{remainingCups} cups remaining</p>
              </div>
              
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    Weekly Average
                  </span>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                    {weeklyAverage.toFixed(1)}
                  </Badge>
                </div>
                <Progress value={(weeklyAverage / goal) * 100} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground">cups per day</p>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Consistency
                  </span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {Math.round(weeklyConsistency)}%
                  </Badge>
                </div>
                <Progress value={weeklyConsistency} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground">Goal achievement rate</p>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-600" />
                    Current Streak
                  </span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {streak} days
                  </Badge>
                </div>
                <Progress value={Math.min(streak * 10, 100)} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground">Consecutive goal days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Enhanced Main Water Intake Card */}
          <Card className="lg:col-span-2 bg-card border-border shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                      <Droplets className="h-6 w-6 text-muted" />
                    </div>
                    Today&apos;s Hydration Journey
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Track your daily water intake and reach your wellness goals with mindful hydration</CardDescription>
                </div>
                <Badge variant="secondary" className={`${hydrationStatus.bgClass} text-lg px-4 py-2 rounded-full`}>
                  {hydrationStatus.level}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Enhanced Circular Progress Display */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative flex h-64 w-64 items-center justify-center">
                  {/* Outer ring with enhanced gradient */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-full w-full rounded-full overflow-hidden border-8 border-border shadow-2xl"
                      style={{
                        background: `conic-gradient(from 0deg, #06b6d4 0deg, #0891b2 ${percentage * 3.6}deg, #e0f7fa ${percentage * 3.6}deg, #e0f7fa 360deg)`,
                      }}
                    />
                  </div>
                  {/* Enhanced inner circle */}
                  <div className="relative flex flex-col items-center justify-center rounded-full bg-muted h-52 w-52 shadow-2xl border-4 border-border backdrop-blur-sm">
                    <Droplets className={`h-16 w-16 mb-3 ${isGoalReached ? 'text-emerald-500' : 'text-cyan-500'} drop-shadow-lg`} />
                    <span className="text-5xl font-bold text-cyan-700">
                      {cups}<span className="text-2xl text-muted-foreground">/{goal}</span>
                    </span>
                    <span className="text-base text-muted-foreground font-medium">cups today</span>
                    {isGoalReached && (
                      <div className="mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 text-muted text-sm font-medium shadow-md">
                        🎉 Goal Achieved!
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-full max-w-md space-y-4">
                  <Progress value={percentage} className="h-6 rounded-full shadow-inner" />
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground font-medium">{percentage}% complete</span>
                    <span className="text-muted-foreground font-medium">
                      {remainingCups > 0 ? `${remainingCups} cups remaining` : '🎉 Goal achieved!'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Motivational Message */}
              <div className="text-center p-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-600 text-white rounded-2xl shadow-2xl backdrop-blur-sm">
                <p className="font-medium text-lg">{getMotivationalMessage()}</p>
              </div>

              {/* Enhanced Quick Add Buttons */}
              <div className="space-y-6">
                <h4 className="font-bold text-center text-cyan-800 text-lg">Quick Add Options</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {quickAddOptions.map((option) => (
                    <Button
                      key={option.amount}
                      variant="outline"
                      className={`flex flex-col items-center gap-4 h-auto p-6 transition-all duration-300 hover:shadow-lg ${option.color} border-2 rounded-2xl`}
                      onClick={() => handleAddCup(option.amount)}
                    >
                      <span className="text-4xl">{option.icon}</span>
                      <div className="text-center">
                        <div className="text-sm font-bold text-primary-foreground">{option.label}</div>
                        <div className="text-xs text-primary-foreground">{option.amount} cup{option.amount !== 1 ? 's' : ''}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Enhanced Manual Controls */}
              <div className="flex justify-center items-center space-x-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleRemoveCup} 
                  disabled={cups === 0}
                  className="h-16 w-16 rounded-full border-3 border-red-200 hover:bg-red-50 hover:scale-110 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-7 w-7 text-red-500" />
                </Button>
                <Button 
                  variant="default" 
                  className="px-10 h-16 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-200 text-lg font-semibold" 
                  onClick={() => handleAddCup(1)}
                >
                  <Plus className="mr-3 h-6 w-6" />
                  Add Cup
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => handleAddCup(1)}
                  className="h-16 w-16 rounded-full border-3 border-cyan-200 hover:bg-cyan-50 hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <Plus className="h-7 w-7 text-cyan-500" />
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-6 rounded-b-lg p-6">
              <div className="flex justify-between w-full items-center">
                <span className="text-base font-semibold text-cyan-800">Daily Goal: {goal} cups</span>
                <span className="text-base text-muted-foreground font-medium">Adjust Your Goal</span>
              </div>
              <Slider 
                value={[goal]} 
                max={15} 
                min={4} 
                step={1} 
                onValueChange={handleGoalChange}
                className="w-full"
              />
              <div className="flex justify-between w-full text-sm text-muted-foreground font-medium">
                <span>4 cups (minimum)</span>
                <span>15 cups (maximum)</span>
              </div>
            </CardFooter>
          </Card>

          {/* Enhanced Stats Sidebar */}
          <div className="space-y-8">
            {/* Enhanced Today's Stats */}
            <Card className="bg-card border-border shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                    <Clock className="h-5 w-5 text-muted" />
                  </div>
                  Today&apos;s Hydration Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <span className="text-base text-muted-foreground flex items-center gap-2 font-medium">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Current Streak
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-2xl text-teal-700">{streak}</span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <span className="text-base text-muted-foreground flex items-center gap-2 font-medium">
                    <Heart className="h-5 w-5 text-destructive" />
                    Health Benefits
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-border text-sm px-3 py-1">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <span className="text-base text-muted-foreground flex items-center gap-2 font-medium">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Achievement
                  </span>
                  <Badge className={hydrationStatus.bgClass}>
                    {hydrationStatus.level}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Health Benefits */}
            <Card className="bg-card border-border shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-full bg-muted shadow-lg">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  Hydration Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted backdrop-blur-sm border border-border">
                  <Activity className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-800">Improved Energy</p>
                    <p>Proper hydration boosts energy levels and reduces fatigue</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted backdrop-blur-sm border border-border">
                  <Sun className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-800">Better Skin</p>
                    <p>Hydration helps maintain healthy, glowing skin</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted backdrop-blur-sm border border-border">
                  <Thermometer className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-800">Temperature Control</p>
                    <p>Water helps regulate your body temperature</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Today's Log */}
            <Card className="bg-card border-border shadow-2xl border-0 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-full b-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  Today&apos;s Hydration Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayEntries.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {todayEntries.slice(-5).reverse().map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted backdrop-blur-sm border border-border shadow-sm">
                        <div className="flex items-center gap-3">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">{entry.amount} cup{entry.amount !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{entry.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No entries yet today. Start hydrating!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Analytics Section */}
        <Card className="bg-card border-border shadow-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              Hydration Analytics
            </CardTitle>
            <CardDescription className="text-base">Visualize your hydration patterns and track progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="weekly" className="text-base">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-base">Monthly</TabsTrigger>
                <TabsTrigger value="insights" className="text-base">Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="space-y-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colorCups" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-10" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cups" 
                        stroke="#06b6d4" 
                        fillOpacity={1} 
                        fill="url(#colorCups)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="monthly" className="space-y-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-10" />
                      <XAxis 
                        dataKey="week" 
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Bar dataKey="average" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="bg-card backdrop-blur-sm border-border shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-cyan-600" />
                        Weekly Goal Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-muted-forground">{Math.round(weeklyConsistency)}%</div>
                      <p className="text-sm text-muted-foreground">Days you met your goal</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card backdrop-blur-sm border-border shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Average Daily
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{weeklyAverage.toFixed(1)}</div>
                      <p className="text-sm text-muted-foreground">Cups per day this week</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card backdrop-blur-sm border-border shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-emerald-600" />
                        Best Day
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {weeklyData.length > 0 ? weeklyData.reduce((max, day) => day.cups > max.cups ? day : max, weeklyData[0]).day : 'N/A'}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {weeklyData.length > 0 ? `${weeklyData.reduce((max, day) => day.cups > max.cups ? day : max, weeklyData[0]).cups} cups` : 'No data yet'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

