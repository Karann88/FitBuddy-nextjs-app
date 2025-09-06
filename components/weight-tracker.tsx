"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Scale, 
  Plus, 
  Target, 
  TrendingDown, 
  Calendar,
  Award,
  Clock,
  Zap,
  Heart,
  Activity,
  Sparkles,
  Loader2
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { format, subDays, startOfDay, endOfDay } from "date-fns"

const supabase = createSupabaseBrowserClient()

interface WeightData {
  date: string
  weight: number
  bodyFat?: number
  waist?: number
  chest?: number
  hips?: number
}

interface LogEntry {
  id: number
  weight: number
  bodyFat?: number
  time: string
  timestamp: number
}

interface QuickOption {
  amount: number
  label: string
  icon: string
  color: string
}

const quickAddOptions: QuickOption[] = [
  { amount: -0.5, label: "Small Loss", icon: "📉", color: "bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 border-green-200 text-green-800" },
  { amount: -0.2, label: "Minor Loss", icon: "📊", color: "bg-gradient-to-r from-emerald-100 to-teal-100 hover:from-emerald-200 hover:to-teal-200 border-emerald-200 text-emerald-800" },
  { amount: 0.2, label: "Minor Gain", icon: "📈", color: "bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-orange-200 hover:to-yellow-200 border-orange-200 text-orange-800" },
  { amount: 0.5, label: "Weight Gain", icon: "⬆️", color: "bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 border-red-200 text-red-800" },
]

const weightTheme = {
  title: "Weight Management",
  description: "Track your weight and reach your fitness goals",
  icon: "⚖️",
  gradient: "from-purple-100 to-rose-100",
  borderColor: "border-purple-200",
  accentColor: "text-purple-600"
}

export function WeightTracker() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [waist, setWaist] = useState("")
  const [chest, setChest] = useState("")
  const [hips, setHips] = useState("")
  const [weightData, setWeightData] = useState<WeightData[]>([])
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [goalWeight, setGoalWeight] = useState(70.0)
  const [streak] = useState(0)
  const [totalSessions] = useState(0)
  const [todayEntries, setTodayEntries] = useState<LogEntry[]>([])

  const fetchWeightData = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    const today = new Date()
    const thirtyDaysAgo = subDays(today, 30)

    try {
      // Fetch current day's entry
      const { data: todayEntry, error: todayError } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startOfDay(today).toISOString())
        .lte("date", endOfDay(today).toISOString())
        .single()

      if (todayError && todayError.code !== "PGRST116") {
        console.error("Error fetching today's weight entry:", todayError)
      }

      if (todayEntry) {
        setWeight(todayEntry.weight?.toString() || "")
        setBodyFat(todayEntry.body_fat_percentage?.toString() || "")
        setWaist(todayEntry.waist_measurement?.toString() || "")
        setChest(todayEntry.chest_measurement?.toString() || "")
        setHips(todayEntry.hip_measurement?.toString() || "")
        setCurrentEntryId(todayEntry.id)
      } else {
        setWeight("")
        setBodyFat("")
        setWaist("")
        setChest("")
        setHips("")
        setCurrentEntryId(null)
      }

      // Fetch monthly data
      const { data: monthlyEntries, error: monthlyError } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startOfDay(thirtyDaysAgo).toISOString())
        .lte("date", endOfDay(today).toISOString())
        .order("date", { ascending: true })

      if (monthlyError) {
        console.error("Error fetching monthly weight entries:", monthlyError)
      }

      const formattedData: WeightData[] = (monthlyEntries ?? []).map(entry => ({
        date: format(new Date(entry.date), "MMM d"),
        weight: entry.weight || 0,
        bodyFat: entry.body_fat_percentage || undefined,
        waist: entry.waist_measurement || undefined,
        chest: entry.chest_measurement || undefined,
        hips: entry.hip_measurement || undefined,
      })) 

      setWeightData(formattedData)
    } catch (error) {
      console.error("Error fetching weight data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthLoading || !user) {
      setIsLoading(true)
      return
    }

    fetchWeightData()

    const weightChannel = supabase
      .channel("weight_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weight_entries",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchWeightData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(weightChannel)
    }
  }, [user, isAuthLoading, fetchWeightData])

  const handleAddEntry = async () => {
    if (!user || !weight) return

    const today = format(new Date(), "yyyy-MM-dd")

    const entryData = {
      user_id: user.id,
      weight: Number.parseFloat(weight),
      body_fat_percentage: bodyFat ? Number.parseFloat(bodyFat) : null,
      waist_measurement: waist ? Number.parseFloat(waist) : null,
      chest_measurement: chest ? Number.parseFloat(chest) : null,
      hip_measurement: hips ? Number.parseFloat(hips) : null,
      date: today,
    }

    try {
      if (currentEntryId) {
        const { error } = await supabase
          .from("weight_entries")
          .update({ ...entryData, updated_at: new Date().toISOString() })
          .eq("id", currentEntryId)

        if (error) console.error("Error updating weight entry:", error)
      } else {
        const { data, error } = await supabase.from("weight_entries").insert(entryData).select().single()

        if (error) {
          console.error("Error inserting weight entry:", error)
        } else if (data) {
          setCurrentEntryId(data.id)
        }
      }

      // Add to today's log
      const logEntry: LogEntry = {
        id: Date.now(),
        weight: Number.parseFloat(weight),
        bodyFat: bodyFat ? Number.parseFloat(bodyFat) : undefined,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      }
      setTodayEntries(prev => [...prev, logEntry])

      // Reset form
      setWeight("")
      setBodyFat("")
      setWaist("")
      setChest("")
      setHips("")
    } catch (error) {
      console.error("Error saving weight entry:", error)
    }
  }

  const handleQuickAdd = async (amount: number) => {
    if (!user) return

    const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : 70
    const newWeight = Math.max(currentWeight + amount, 30) // Minimum 30kg
    
    const today = format(new Date(), "yyyy-MM-dd")

    const entryData = {
      user_id: user.id,
      weight: Number.parseFloat(newWeight.toFixed(1)),
      body_fat_percentage: null,
      waist_measurement: null,
      chest_measurement: null,
      hip_measurement: null,
      date: today,
    }

    try {
      const { data, error } = await supabase.from("weight_entries").insert(entryData).select().single()

      if (error) {
        console.error("Error inserting quick weight entry:", error)
      } else if (data) {
        // Add to today's log
        const logEntry: LogEntry = {
          id: Date.now(),
          weight: newWeight,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }
        setTodayEntries(prev => [...prev, logEntry])
      }
    } catch (error) {
      console.error("Error saving quick entry:", error)
    }
  }

  const handleGoalChange = (value: number[]) => {
    setGoalWeight(value[0])
  }

  // Calculate metrics
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : 0
  // const previousWeight = weightData.length > 1 ? weightData[weightData.length - 2].weight : currentWeight
  const firstWeight = weightData.length > 0 ? weightData[0].weight : currentWeight
  
  const totalWeightChange = firstWeight - currentWeight
  const progressToGoal = Math.min(Math.max(((firstWeight - currentWeight) / (firstWeight - goalWeight)) * 100, 0), 100)
  const isGoalReached = currentWeight <= goalWeight

  const getMotivationalMessage = () => {
    if (isGoalReached) {
      return "🎉 Congratulations! You've reached your weight goal!"
    } else if (progressToGoal >= 75) {
      return "💪 Almost there! You're so close to your goal!"
    } else if (progressToGoal >= 50) {
      return "🌟 Great progress! Keep up the amazing work!"
    } else if (progressToGoal >= 25) {
      return "📈 Good start! Stay consistent with your journey!"
    } else {
      return "🎯 Begin your transformation! Every step counts!"
    }
  }

  const getWeightStatus = () => {
    const diff = currentWeight - goalWeight
    if (diff <= 0) return { 
      level: "Goal Achieved", 
      color: "bg-emerald-500", 
      textColor: "text-emerald-700",
      bgClass: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200"
    }
    if (diff <= 2) return { 
      level: "Very Close", 
      color: "bg-green-500", 
      textColor: "text-green-700",
      bgClass: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200"
    }
    if (diff <= 5) return { 
      level: "On Track", 
      color: "bg-blue-500", 
      textColor: "text-blue-700",
      bgClass: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200"
    }
    if (diff <= 10) return { 
      level: "In Progress", 
      color: "bg-yellow-500", 
      textColor: "text-yellow-700",
      bgClass: "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200"
    }
    return { 
      level: "Getting Started", 
      color: "bg-orange-500", 
      textColor: "text-orange-700",
      bgClass: "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200"
    }
  }

  const weightStatus = getWeightStatus()

  // Filter out entries with undefined values for chart data
  const chartData = weightData
    .filter(entry => entry.weight !== undefined && entry.weight !== null)
    .map((entry) => ({
      date: entry.date,
      weight: entry.weight,
      bodyFat: entry.bodyFat || null,
      waist: entry.waist || null,
      chest: entry.chest || null,
      hips: entry.hips || null,
    }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Sparkles className="h-6 w-6 text-cyan-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <span className="text-muted-foreground font-medium">Loading your wellness dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-6 overflow-auto">
      <div className="w-full mx-auto space-y-8">
        {/* Header Dashboard - matching stretch sequence style */}
        <Card className="bg-card border border-border shadow-md hover:shadow-xl transition-all backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-3xl">
                  <div className="p-3 rounded-full bg-primary shadow-lg">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <Target className="h-6 w-6 text-cyan-600" />
                  Weight & Wellness Dashboard
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-muted-foreground">Transform your health journey with intelligent tracking</CardDescription>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-primary">{streak}</div>
                  <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-2xl font-bold text-primary">{totalSessions}</div>
                  <div className="text-sm text-muted-foreground font-medium">Sessions</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-teal-600" />
                    Goal Progress
                  </span>
                  {/* <span className="text-muted-foreground">{Math.round(progressToGoal)}%</span> */}
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                    {Math.round(progressToGoal)}%
                  </Badge>
                </div>
                <Progress value={progressToGoal} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-orange-600" />
                    Weight Lost
                  </span>
                  {/* <span className="text-muted-foreground">{totalWeightChange.toFixed(1)} kg</span> */}
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {totalWeightChange.toFixed(1)} kg
                  </Badge>
                </div>
                <Progress value={Math.min((totalWeightChange / 10) * 100, 100)} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-600" />
                    Entries Today
                  </span>
                  {/* <span className="text-muted-foreground">{todayEntries.length}</span> */}
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                    {todayEntries.length}
                  </Badge>
                </div>
                <Progress value={(todayEntries.length / 5) * 100} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-600" />
                    Health Score
                  </span>
                  {/* <span className="text-muted-foreground">85%</span> */}
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800"> 
                    85%
                  </Badge>
                </div>
                <Progress value={85} className="h-3 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Weight Tracking Card - matching stretch sequence layout */}
          <Card className="lg:col-span-2 bg-card border-border shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <span className="text-4xl">{weightTheme.icon}</span>
                    <div>
                      <div>Weight Tracking</div>
                      <div className="text-sm font-normal text-muted-foreground">{weightTheme.title}</div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">{weightTheme.description}</CardDescription>
                </div>
                <Badge variant="secondary" className={`${weightStatus.bgClass} text-lg px-4 py-2 rounded-full`}>
                  {weightStatus.level}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Enhanced Circular Progress Display - matching stretch sequence timer */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative flex h-64 w-64 items-center justify-center">
                  {/* Outer ring with gradient */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-full w-full rounded-full overflow-hidden border-8 border-border shadow-2xl"
                      style={{
                        background: `conic-gradient(from 0deg, #a855f7 0deg, #ec4899 ${progressToGoal * 3.6}deg, #f1f5f9 ${progressToGoal * 3.6}deg, #f1f5f9 360deg)`,
                      }}
                    />
                  </div>
                  {/* Inner circle with enhanced styling */}
                  <div className="relative flex flex-col items-center justify-center rounded-full bg-muted h-52 w-52 shadow-2xl border-4 border-border">
                    <Scale className={`h-16 w-16 mb-3 ${isGoalReached ? 'text-emerald-500' : 'text-purple-500'}`} />
                    <span className={`text-5xl font-bold ${weightTheme.accentColor}`}>
                      {currentWeight}<span className="text-2xl text-muted-foreground">kg</span>
                    </span>
                    <span className="text-base text-muted-foreground font-medium">
                      current weight
                    </span>
                    {isGoalReached && (
                      <div className="mt-3 px-4 py-2 rounded-full bg-gradient-r from-emerald-100 to-green-100 text-muted text-sm font-medium shadow-md">
                        Goal Achieved!
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="w-full max-w-md space-y-4">
                  <Progress value={progressToGoal} className="h-6 rounded-full shadow-inner" />
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground font-medium">Start: {firstWeight.toFixed(1)} kg</span>
                    <span className={`${weightTheme.accentColor}`}>{Math.round(progressToGoal)}% to goal</span>
                    <span className="text-muted-foreground font-medium">Goal: {goalWeight} kg</span>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="text-center p-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-600 text-white rounded-2xl shadow-inner">
                <p className="font-bold text-lg text-purple-800">{getMotivationalMessage()}</p>
              </div>

              {/* Enhanced Quick Add Buttons */}
              <div className="space-y-6">
                <h4 className="font-bold text-lg text-center text-primary flex items-center justify-center gap-2">
                  <Zap className="h-6 w-6" />
                  Quick Weight Updates
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {quickAddOptions.map((option) => (
                    <Button
                      key={option.amount}
                      variant="outline"
                      className={`flex flex-col items-center gap-4 h-auto p-6 transition-all duration-300 hover:scale-110 hover:shadow-lg ${option.color} border-2 rounded-2xl`}
                      onClick={() => handleQuickAdd(option.amount)}
                    >
                      <span className="text-4xl">{option.icon}</span>
                      <div className="text-center">
                        <div className="text-sm font-bold">{option.label}</div>
                        <div className="text-xs font-medium">{option.amount > 0 ? '+' : ''}{option.amount} kg</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Enhanced Manual Entry Form */}
              <div className="space-y-6 p-6 bg-muted rounded-2xl border-2 border-border shadow-xl">
                <h4 className="font-bold text-xl text-center text-primary flex items-center justify-center gap-2">
                  <Plus className="h-6 w-6" />
                  Manual Entry
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="weight" className="text-base font-bold">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Enter weight"
                      className="h-12 text-lg border-2 border-border focus:border-purple-400"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="bodyFat" className="text-base font-bold">Body Fat %</Label>
                    <Input
                      id="bodyFat"
                      type="number"
                      step="0.1"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                      placeholder="Optional"
                      className="h-12 text-lg border-2 border-border focus:border-purple-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="waist" className="text-sm font-bold">Waist (cm)</Label>
                    <Input
                      id="waist"
                      type="number"
                      step="0.1"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      placeholder="Waist"
                      className="h-10 border-2 border-border focus:border-purple-400"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="chest" className="text-sm font-bold">Chest (cm)</Label>
                    <Input
                      id="chest"
                      type="number"
                      step="0.1"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      placeholder="Chest"
                      className="h-10 border-2 border-border focus:border-purple-400"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="hips" className="text-sm font-bold">Hips (cm)</Label>
                    <Input
                      id="hips"
                      type="number"
                      step="0.1"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      placeholder="Hips"
                      className="h-10 border-2 border-border focus:border-purple-400"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddEntry} 
                  disabled={!weight} 
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Plus className="mr-3 h-6 w-6" />
                  Add Entry
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-6 bg-background rounded-b-2xl p-6">
              <div className="flex justify-between w-full items-center">
                <span className="text-lg font-bold text-purple-800">Weight Goal: {goalWeight} kg</span>
                <span className="text-base text-muted-foreground">Adjust Your Goal</span>
              </div>
              <Slider 
                value={[goalWeight]} 
                max={100} 
                min={50} 
                step={0.5} 
                onValueChange={handleGoalChange}
                className="w-full"
              />
              <div className="flex justify-between w-full text-sm text-muted-foreground font-medium">
                <span>50 kg (minimum)</span>
                <span>100 kg (maximum)</span>
              </div>
            </CardFooter>
          </Card>

          {/* Enhanced Sidebar - matching stretch sequence style */}
          <div className="space-y-6">
            {/* Session Stats */}
            <Card className="bg-card border-border shadow-lg backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-emerald-600" />
                  Session Stats
                  <Sparkles className="h-5 w-5 text-teal-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border backdrop-blur-sm shadow-md">
                  <span className="text-base text-muted-foreground flex items-center gap-2 font-medium">
                    <Zap className="h-4 w-4 text-orange-500" />
                    Current Streak
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-lg text-emerald-700">{streak}</span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-500" />
                    Total Sessions
                  </span>
                  <span className="font-bold text-lg text-emerald-700">{totalSessions}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    Entries Today
                  </span>
                  {/* <span className="font-bold text-lg text-emerald-700">{todayEntries.length}</span> */}
                  <Badge className="bg-blue-500 text-muted text-sm px-4 py-2">
                    {todayEntries.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badge */}
            <Card className="bg-card border-border shadow-2xl backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-xl text-yellow-800 mb-2">Weight Loss Champion</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  You&apos;re building amazing healthy habits! Keep up the fantastic work.
                </p>
                <Badge className="bg-yellow-500 text-muted text-sm px-4 py-2">
                  {streak} Day Streak 🔥
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Charts Section */}
        <Card className="bg-card border-border shadow-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-full bg-gradient-to-br from-indigo-500 to-green-500 shadow-lg">
                <Activity className="h-6 w-6 text-primary animated-pulse" />
              </div>
              Weight & Measurement Trends
            </CardTitle>
            <CardDescription>Visualize your progress over time with detailed analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weight" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted text-muted-foreground rounded-md shadow-sm">
                <TabsTrigger value="weight" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Weight</TabsTrigger>
                <TabsTrigger value="bodyFat" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Body Fat</TabsTrigger>
                <TabsTrigger value="measurements" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Measurements</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weight" className="mt-8">
                <div className="w-full h-[400px] sm:h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 40, left: 30, bottom: 20 }}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 'bold' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 'bold' }}
                        domain={['dataMin - 1', 'dataMax + 1']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#a855f7"
                        strokeWidth={4}
                        fill="url(#weightGradient)"
                        name="Weight (kg)"
                        dot={{ r: 6, fill: '#a855f7', strokeWidth: 3, stroke: 'white' }}
                        activeDot={{ r: 8, fill: '#a855f7', strokeWidth: 3, stroke: 'white' }}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="bodyFat" className="mt-8">
                <div className="w-full h-[400px] sm:h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 40, left: 30, bottom: 20 }}>
                      <defs>
                        <linearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 'bold' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 'bold' }}
                        domain={['dataMin - 1', 'dataMax + 1']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="bodyFat"
                        stroke="#10b981"
                        strokeWidth={4}
                        fill="url(#bodyFatGradient)"
                        name="Body Fat (%)"
                        dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: 'white' }}
                        activeDot={{ r: 8, fill: '#10b981', strokeWidth: 3, stroke: 'white' }}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="measurements" className="mt-8">
                <div className="w-full h-[400px] sm:h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 40, left: 30, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 'bold' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 'bold' }}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="waist"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
                        activeDot={{ r: 7, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
                        name="Waist (cm)"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="chest"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: 'white' }}
                        activeDot={{ r: 7, fill: '#10b981', strokeWidth: 2, stroke: 'white' }}
                        name="Chest (cm)"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="hips"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                        activeDot={{ r: 7, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                        name="Hips (cm)"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

