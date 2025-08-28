"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { createSupabaseBrowserClient, type MoodEntry } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { format, subDays } from "date-fns"
import { Loader2, Heart, Calendar as CalendarIcon, TrendingUp, Sparkles, Brain, Target, BarChart3, Smile, Award, Star } from "lucide-react"

const supabase = createSupabaseBrowserClient()

const moodEmojis = ["😞", "😐", "😊", "😁", "🤩"]
// const moodLabels = ["Very Bad", "Bad", "Neutral", "Good", "Excellent"]

// Enhanced mood configuration with therapeutic colors
const moodConfig = {
    0: { label: "Very Bad", emoji: "😞", color: "#ef4444", bgClass: "bg-red-100 text-red-800 border-red-200", chartColor: "#fca5a5" },
    1: { label: "Bad", emoji: "😐", color: "#f97316", bgClass: "bg-orange-100 text-orange-800 border-orange-200", chartColor: "#fdba74" },
    2: { label: "Neutral", emoji: "😊", color: "#eab308", bgClass: "bg-yellow-100 text-yellow-800 border-yellow-200", chartColor: "#fde047" },
    3: { label: "Good", emoji: "😁", color: "#84cc16", bgClass: "bg-lime-100 text-lime-800 border-lime-200", chartColor: "#bef264" },
    4: { label: "Excellent", emoji: "🤩", color: "#10b981", bgClass: "bg-emerald-100 text-emerald-800 border-emerald-200", chartColor: "#6ee7b7" }
}

export function MoodTracker() {
    const { user, isLoading: isAuthLoading } = useAuth()
    const [moodValue, setMoodValue] = useState(2) // Default to neutral (index 2 for 😊)
    const [notes, setNotes] = useState("")
    const [moodData, setMoodData] = useState<Array<{ date: string; mood: number | null; emoji: string | null }>>([])
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [moodStats, setMoodStats] = useState<{
        average: number
        mostCommon: string
        streak: number
        totalEntries: number
    }>({
        average: 0,
        mostCommon: "😊",
        streak: 0,
        totalEntries: 0,
    })
    const [historyPeriod, setHistoryPeriod] = useState<"week" | "month">("week")
    const [moodDistribution, setMoodDistribution] = useState<Array<{ mood: string; count: number; emoji: string }>>([])

    useEffect(() => {
        if (isAuthLoading || !user) {
            setIsLoading(true)
            return
        }

        const fetchMoodData = async () => {
            setIsLoading(true)
            const today = new Date()
            const periodDays = historyPeriod === "week" ? 6 : 29
            const periodStart = subDays(today, periodDays)

            // Fetch current day's entry
            const { data: todayEntry, error: todayError } = await supabase
                .from("mood_entries")
                .select("*")
                .eq("user_id", user.id)
                // .gte("date", format(startOfDay(today), "yyyy-MM-dd"))
                // .lte("date", format(endOfDay(today), "yyyy-MM-dd"))
                .eq("date", format(today, "yyyy-MM-dd"))
                .single()

            if (todayError && todayError.code !== "PGRST116") {
                console.error("Error fetching today's mood entry:", todayError)
            }

            if (todayEntry) {
                setMoodValue(todayEntry.mood_value - 1)
                setNotes(todayEntry.notes || "")
                setCurrentEntryId(todayEntry.id)
            } else {
                setMoodValue(2)
                setNotes("")
                setCurrentEntryId(null)
            }

            // Fetch period data
            const { data: periodEntries, error: periodError } = await supabase
                .from("mood_entries")
                .select("date, mood_value, mood_emoji")
                .eq("user_id", user.id)
                .gte("date", format(periodStart, "yyyy-MM-dd"))
                .lte("date", format(today, "yyyy-MM-dd"))
                .order("date", { ascending: true })

            if (periodError) {
                console.error("Error fetching period mood entries:", periodError)
            }

            // Calculate mood statistics
            if (periodEntries && periodEntries.length > 0) {
                const average = periodEntries.reduce((sum, entry) => sum + entry.mood_value, 0) / periodEntries.length

                // Find most common mood
                const moodCounts = periodEntries.reduce(
                    (acc, entry) => {
                        acc[entry.mood_emoji] = (acc[entry.mood_emoji] || 0) + 1
                        return acc
                    },
                    {} as Record<string, number>,
                )
                const mostCommon = Object.entries(moodCounts).reduce((a, b) => (moodCounts[a[0]] > moodCounts[b[0]] ? a : b))[0]

                // Calculate current streak (consecutive days with mood entries)
                let streak = 0
                for (let i = 0; i < 30; i++) {
                    const checkDate = format(subDays(today, i), "yyyy-MM-dd")
                    const hasEntry = periodEntries.some((entry) => format(new Date(entry.date), "yyyy-MM-dd") === checkDate)
                    if (hasEntry) {
                        streak++
                    } else {
                        break
                    }
                }

                setMoodStats({
                    average: Math.round(average * 10) / 10,
                    mostCommon,
                    streak,
                    totalEntries: periodEntries.length,
                })

                // Calculate mood distribution for pie chart
                const distribution = Object.entries(moodCounts).map(([emoji, count]) => ({
                    mood: emoji,
                    count,
                    emoji,
                }))
                setMoodDistribution(distribution)
            }

            // Format data for line chart
            const formattedData = Array.from({ length: periodDays + 1 }).map((_, i) => {
                const date = subDays(today, periodDays - i)
                const entry = periodEntries?.find((e) => format(new Date(e.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
                return {
                    date: format(date, "yyyy-MM-dd"),
                    mood: entry?.mood_value || null,
                    emoji: entry?.mood_emoji || null,
                }
            })
            setMoodData(formattedData)
            setIsLoading(false)
        }

        const moodChannel = supabase
            .channel("mood_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "mood_entries",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newEntry = payload.new as MoodEntry | null
                    const oldEntry = payload.old as MoodEntry | null
                    const today = format(new Date(), "yyyy-MM-dd")

                    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                        if (newEntry && format(new Date(newEntry.date), "yyyy-MM-dd") === today) {
                            setMoodValue(newEntry.mood_value)
                            setNotes(newEntry.notes || "")
                            setCurrentEntryId(newEntry.id)
                        }
                        setMoodData((prev) => {
                            const updated = prev.map((item) =>
                                format(new Date(item.date), "yyyy-MM-dd") === format(new Date(newEntry?.date || ""), "yyyy-MM-dd")
                                    ? {
                                        ...item,
                                        mood: newEntry?.mood_value || 2,
                                        emoji: newEntry?.mood_emoji || moodEmojis[2],
                                    }
                                    : item,
                            )
                            return updated
                        })
                    } else if (payload.eventType === "DELETE") {
                        if (oldEntry && format(new Date(oldEntry.date), "yyyy-MM-dd") === today) {
                            setMoodValue(2)
                            setNotes("")
                            setCurrentEntryId(null)
                        }
                        setMoodData((prev) => {
                            return prev.map((item) =>
                                format(new Date(item.date), "yyyy-MM-dd") === format(new Date(oldEntry?.date || ""), "yyyy-MM-dd")
                                    ? { ...item, mood: 2, emoji: moodEmojis[2] } // Reset to default if deleted
                                    : item,
                            )
                        })
                    }
                },
            )
            .subscribe()

        fetchMoodData()

        return () => {
            supabase.removeChannel(moodChannel)
        }
    }, [user, isAuthLoading, historyPeriod])

    const handleSaveMood = async () => {
        if (!user) return

        const today = format(new Date(), "yyyy-MM-dd")

        // Map moodValue (0-4) -> DB mood_value (1-5)
        const dbMoodValue = moodValue + 1
        const moodEmoji = moodEmojis[moodValue]

        if (currentEntryId) {
            const { error } = await supabase
                .from("mood_entries")
                .update({
                    mood_value: dbMoodValue,
                    mood_emoji: moodEmoji,
                    notes: notes,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", currentEntryId)

            if (error) console.error("Error updating mood entry:", error)
        } else {
            const { data, error } = await supabase
                .from("mood_entries")
                .insert({
                    user_id: user.id,
                    mood_value: dbMoodValue,
                    mood_emoji: moodEmoji,
                    notes: notes,
                    date: today,
                })
                .select()
                .single()

            if (error) {
                console.error("Error inserting mood entry:", error)
            } else if (data) {
                setCurrentEntryId(data.id)
            }
        }
    }

    const handlePeriodChange = (period: "week" | "month") => {
        setHistoryPeriod(period)
    }

    // Calculate additional mood statistics for dashboard
    const averageMood = moodStats.average
    const recentAverage = moodStats.average
    const positiveStreak = moodStats.streak

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
                        <Sparkles className="h-6 w-6 text-pink-400 absolute -top-2 -right-2 animate-pulse" />
                    </div>
                    <span className="text-pink-700 font-medium">Loading your mood data...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 overflow-auto">
            <div className="w-full space-y-8">
                {/* Enhanced Emotional Wellness Overview */}
                <Card className="bg-gradient-to-r from-pink-100 via-rose-50 to-purple-100 border-pink-200 shadow-2xl backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-3xl">
                                    <div className="p-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg">
                                        <Sparkles className="h-8 w-8 text-white" />
                                    </div>
                                    <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                                        Emotional Wellness Dashboard
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-lg mt-2">Track your emotional journey and mental well-being with mindful awareness</CardDescription>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-pink-100 shadow-md">
                                    <div className="text-3xl font-bold text-pink-600">{averageMood.toFixed(1)}</div>
                                    <div className="text-sm text-muted-foreground font-medium">Avg Mood</div>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-pink-100 shadow-md">
                                    <div className="text-3xl font-bold text-pink-600">{moodStats.totalEntries}</div>
                                    <div className="text-sm text-muted-foreground font-medium">Days Tracked</div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-3 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-pink-100 shadow-md">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-pink-600" />
                                        Average Mood
                                    </span>
                                    <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                                        {averageMood.toFixed(1)}/4
                                    </Badge>
                                </div>
                                <Progress value={(averageMood / 4) * 100} className="h-3 rounded-full" />
                                <p className="text-xs text-muted-foreground">Overall emotional state</p>
                            </div>
                            <div className="space-y-3 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-100 shadow-md">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                                        Days Tracked
                                    </span>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        {moodStats.totalEntries}
                                    </Badge>
                                </div>
                                <Progress value={Math.min(moodStats.totalEntries * 3.33, 100)} className="h-3 rounded-full" />
                                <p className="text-xs text-muted-foreground">Tracking consistency</p>
                            </div>
                            <div className="space-y-3 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-green-100 shadow-md">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        Recent Trend
                                    </span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        {recentAverage.toFixed(1)}/4
                                    </Badge>
                                </div>
                                <Progress value={(recentAverage / 4) * 100} className="h-3 rounded-full" />
                                <p className="text-xs text-muted-foreground">Recent average</p>
                            </div>
                            <div className="space-y-3 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-purple-100 shadow-md">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-2">
                                        <Target className="h-4 w-4 text-purple-600" />
                                        Current Streak
                                    </span>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                        {positiveStreak} days
                                    </Badge>
                                </div>
                                <Progress value={Math.min(positiveStreak * 14.3, 100)} className="h-3 rounded-full" />
                                <p className="text-xs text-muted-foreground">Tracking streak</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Enhanced Mood Entry Card */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-2xl backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                    <Smile className="h-6 w-6 text-white" />
                                </div>
                                How are you feeling today?
                            </CardTitle>
                            <CardDescription className="text-base">
                                Take a moment to reflect on your current emotional state and practice mindful awareness
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Enhanced Mood Display */}
                            <div className="flex flex-col items-center space-y-6">
                                <div className="relative">
                                    <div className="text-8xl animate-pulse">{moodEmojis[moodValue]}</div>
                                    <div className="absolute -bottom-2 -right-2">
                                        <Badge className={`${moodConfig[moodValue as keyof typeof moodConfig].bgClass} text-lg px-4 py-2 rounded-full shadow-md`}>
                                            {moodConfig[moodValue as keyof typeof moodConfig].label}
                                        </Badge>
                                    </div>
                                </div>
                                
                                {/* Enhanced Mood Slider */}
                                <div className="w-full space-y-4">
                                    <Slider
                                        value={[moodValue]}
                                        max={4}
                                        step={1}
                                        onValueChange={(value) => setMoodValue(value[0])}
                                        className="w-full"
                                        // trackClassName="bg-gradient-to-r from-red-200 via-yellow-200 to-green-200"
                                        // rangeClassName="bg-gradient-to-r from-pink-500 to-purple-600"
                                        // thumbClassName="bg-white border-4 border-pink-500 shadow-lg"
                                    />
                                    <div className="flex justify-between w-full text-sm text-muted-foreground">
                                        <span className="flex flex-col items-center">
                                            <span className="text-lg">😞</span>
                                            <span>Very Bad</span>
                                        </span>
                                        <span className="flex flex-col items-center">
                                            <span className="text-lg">😐</span>
                                            <span>Bad</span>
                                        </span>
                                        <span className="flex flex-col items-center">
                                            <span className="text-lg">😊</span>
                                            <span>Neutral</span>
                                        </span>
                                        <span className="flex flex-col items-center">
                                            <span className="text-lg">😁</span>
                                            <span>Good</span>
                                        </span>
                                        <span className="flex flex-col items-center">
                                            <span className="text-lg">🤩</span>
                                            <span>Excellent</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Notes Section */}
                            <div className="space-y-3">
                                <Label htmlFor="mood-notes" className="text-base font-medium flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-purple-600" />
                                    What&apos;s on your mind?
                                </Label>
                                <Textarea
                                    id="mood-notes"
                                    placeholder="Share your thoughts, feelings, or what influenced your mood today..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="bg-white border-blue-200 focus:border-blue-400 text-base"
                                />
                            </div>

                            {/* Enhanced Save Button */}
                            <Button 
                                onClick={handleSaveMood} 
                                className="w-full h-14 bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white rounded-xl shadow-lg text-lg font-semibold"
                            >
                                <Heart className="mr-3 h-5 w-5" />
                                Save Today&apos;s Mood
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Enhanced Mood Statistics Card */}
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-2xl backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                                    <BarChart3 className="h-6 w-6 text-white" />
                                </div>
                                Mood Statistics Overview
                            </CardTitle>
                            <CardDescription className="text-base">
                                Your emotional patterns and insights at a glance
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Mood Statistics Cards */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-md">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Award className="h-4 w-4 text-emerald-600" />
                                            Average Mood
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600">{moodStats.average}/4</div>
                                        <p className="text-xs text-muted-foreground">
                                            {moodStats.average >= 3 ? "Great!" : moodStats.average >= 2 ? "Good" : "Needs attention"}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-md">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Star className="h-4 w-4 text-blue-600" />
                                            Most Common
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600">{moodStats.mostCommon}</div>
                                        <p className="text-xs text-muted-foreground">Your typical mood</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-md">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Target className="h-4 w-4 text-purple-600" />
                                            Current Streak
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-purple-600">{moodStats.streak}</div>
                                        <p className="text-xs text-muted-foreground">Days tracked</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 backdrop-blur-sm border-pink-200 shadow-md">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-pink-600" />
                                            Total Entries
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-pink-600">{moodStats.totalEntries}</div>
                                        <p className="text-xs text-muted-foreground">This {historyPeriod}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Enhanced Mood History Charts */}
                <div className="grid gap-8 lg:grid-cols-2">
                    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-2xl backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                                        Mood Trend
                                    </CardTitle>
                                    <CardDescription>Your mood over time</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={historyPeriod === "week" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePeriodChange("week")}
                                        className="text-xs"
                                    >
                                        Week
                                    </Button>
                                    <Button
                                        variant={historyPeriod === "month" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePeriodChange("month")}
                                        className="text-xs"
                                    >
                                        Month
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={moodData.filter((d) => d.mood !== null)}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(tick) => format(new Date(tick), historyPeriod === "week" ? "EEE" : "MM/dd")}
                                            tick={{ fontSize: 12, fill: "#64748b" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={[0, 4]} 
                                            tickFormatter={(value) => moodEmojis[value]} 
                                            tick={{ fontSize: 12, fill: "#64748b" }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={40}
                                        />
                                        <Tooltip
                                            formatter={(value, name, props) => [`${value} entries`, props.payload.emoji || moodEmojis[value as number]]}
                                            labelFormatter={(label) => format(new Date(label), "PPP")}
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="mood"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            dot={{ r: 6, fill: "#8b5cf6", strokeWidth: 2, stroke: "#ffffff" }}
                                            activeDot={{ r: 8, fill: "#8b5cf6", strokeWidth: 3, stroke: "#ffffff" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 shadow-2xl backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <BarChart3 className="h-5 w-5 text-rose-600" />
                                Mood Distribution
                            </CardTitle>
                            <CardDescription>Breakdown of your moods this {historyPeriod}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={moodDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ emoji, percent }) => `${emoji} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {moodDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 60%)`} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value, name, props) => [`${value} entries`, props.payload.emoji]} 
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}



