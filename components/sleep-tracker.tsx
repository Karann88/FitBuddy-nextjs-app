"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Moon, Plus, Star, Clock, Target, TrendingUp, CloudMoon, Sun, Calendar as CalendarIcon, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { format, parseISO, subDays, addDays } from "date-fns"
import { createSupabaseBrowserClient, type SleepEntry } from "@/lib/supabase"
// import { createClient } from '@supabase/supabase-js'

interface SleepData {
  date: string
  hours: number
  quality: number
  bedtime: string
  wake_time: string
}

// Sleep goals and recommendations
const SLEEP_GOALS = {
  targetHours: 8,
  minHours: 7,
  maxHours: 9,
  targetQuality: 4
}

export function SleepTracker() {

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  // State management
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [bedtime, setBedtime] = useState("22:30")
  const [wakeTime, setWakeTime] = useState("07:00")
  const [quality, setQuality] = useState(4)
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([])
  const [sleepData, setSleepData] = useState<SleepData[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  // Calculate sleep duration
  const calculateSleepHours = useCallback((bedtimeStr: string, waketimeStr: string) => {
    const bedtimeParts = bedtimeStr.split(":").map(Number)
    const waketimeParts = waketimeStr.split(":").map(Number)

    const bedtimeHours = bedtimeParts[0] + bedtimeParts[1] / 60
    const waketimeHours = waketimeParts[0] + waketimeParts[1] / 60

    // Adjust if bedtime is PM and waketime is AM
    if (bedtimeHours > waketimeHours) {
      return 24 - bedtimeHours + waketimeHours
    }

    return waketimeHours - bedtimeHours
  }, [])

  // Fetch sleep entries from database
  const fetchSleepEntries = useCallback(async () => {
    if (!currentUser) return

    setLoading(true)
    setError(null)

    try {
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const endDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', currentUser)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) throw error

      setSleepEntries(data || [])

      // Transform data for charts
      const transformedData = (data || []).map(entry => ({
        date: format(parseISO(entry.date), 'MMM dd'),
        hours: calculateSleepHours(entry.bedtime, entry.wake_time),
        quality: entry.sleep_quality,
        bedtime: entry.bedtime,
        wake_time: entry.wake_time
      })).reverse()

      setSleepData(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sleep data')
    } finally {
      setLoading(false)
    }
  }, [currentUser, supabase, calculateSleepHours])

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user?.id || 'demo-user-id') // Fallback for demo
    }
    getCurrentUser()
  }, [supabase])

  // Fetch data when user is available
  useEffect(() => {
    if (currentUser) {
      fetchSleepEntries()
    }

    // Add real-time subscription
    const channel = supabase
      .channel(`dashboard_sleep_${currentUser}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sleep_entries',
          filter: `user_id=eq.${currentUser}`
        },
        () => {
          fetchSleepEntries()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [currentUser, fetchSleepEntries, supabase])

  // Get sleep entry for selected date
  const getSelectedDateEntry = useCallback(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return sleepEntries.find(entry => entry.date === dateStr)
  }, [selectedDate, sleepEntries])

  // Update form when selected date changes
  useEffect(() => {
    const entry = getSelectedDateEntry()
    if (entry) {
      setBedtime(entry.bedtime)
      setWakeTime(entry.wake_time)
      setQuality(entry.sleep_quality ?? 4)   // Safe fallback
    } else {
      // Reset to defaults for new entries
      setBedtime("22:30")
      setWakeTime("07:00")
      setQuality(4)
    }
  }, [getSelectedDateEntry])

  // Handle sleep logging
  const handleLogSleep = async () => {
    if (!currentUser) {
      setError('User not authenticated')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const existingEntry = getSelectedDateEntry()

      const sleepData = {
        user_id: currentUser,
        bedtime,
        wake_time: wakeTime,
        sleep_quality: quality,
        date: dateStr
      }

      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('sleep_entries')
          .update({ ...sleepData, updated_at: new Date().toISOString() })
          .eq('id', existingEntry.id)

        if (error) throw error
      } else {
        // Create new entry
        const { error } = await supabase
          .from('sleep_entries')
          .insert([sleepData])

        if (error) throw error
      }

      // Refresh data
      await fetchSleepEntries()

      // Show success message
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sleep data')
    } finally {
      setSaving(false)
    }
  }

  // Calculate current sleep hours and averages
  const sleepHours = calculateSleepHours(bedtime, wakeTime)
  const averageSleepHours = sleepData.length > 0
    ? sleepData.reduce((sum, day) => sum + day.hours, 0) / sleepData.length
    : 0
  const averageQuality = sleepData.length > 0
    ? sleepData.reduce((sum, day) => sum + day.quality, 0) / sleepData.length
    : 0

  const handleQualityChange = (value: number[]) => {
    setQuality(value[0])
  }

  const getSleepQualityLabel = (rating: number) => {
    if (rating >= 5) return { label: "Excellent", color: "bg-green-100 text-green-800 border-green-200" }
    if (rating >= 4) return { label: "Good", color: "bg-blue-100 text-blue-800 border-blue-200" }
    if (rating >= 3) return { label: "Fair", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
    if (rating >= 2) return { label: "Poor", color: "bg-orange-100 text-orange-800 border-orange-200" }
    return { label: "Very Poor", color: "bg-red-100 text-red-800 border-red-200" }
  }

  const getSleepDurationStatus = (hours: number) => {
    if (hours >= SLEEP_GOALS.minHours && hours <= SLEEP_GOALS.maxHours) {
      return { status: "Optimal", color: "text-green-600", icon: Target }
    }
    if (hours < SLEEP_GOALS.minHours) {
      return { status: "Too Short", color: "text-red-600", icon: TrendingUp }
    }
    return { status: "Too Long", color: "text-orange-600", icon: Clock }
  }

  // Check if date has sleep data
  const hasDataForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return sleepEntries.some(entry => entry.date === dateStr)
  }

  // Get quality for date (for calendar styling)
  const getQualityForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const entry = sleepEntries.find(entry => entry.date === dateStr)
    return entry?.sleep_quality || 0
  }

  const qualityInfo = getSleepQualityLabel(quality)
  const durationStatus = getSleepDurationStatus(sleepHours)
  const StatusIcon = durationStatus.icon
  const selectedEntry = getSelectedDateEntry()

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-background text-forground">
  //       <div className="flex flex-col items-center space-y-4">
  //         <div className="relative">
  //           <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //           <Sparkles className="h-6 w-6 text-cyan-400 absolute -top-2 -right-2 animate-pulse" />
  //         </div>
  //         <span className="text-muted-foreground font-medium">Loading sleep data...</span>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen w-full bg-background p-6 overflow-auto">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-300/10 to-indigo-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full mx-auto space-y-8">
        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sleep Goals Overview */}
        <Card className="bg-card border border-border shadow-md hover:shadow-xl transition-all backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-3xl font-bold">
                  <div className="p-3 rounded-full bg-primary shadow-lg">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  Sleep Wellness Dashboard
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-muted-foreground">Track your progress towards optimal sleep health and recovery</CardDescription>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-primary">{averageQuality.toFixed(1)}/5</div>
                  <div className="text-sm text-muted-foreground font-medium">Sleep Quality</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full bg-indigo-200/30 animate-ping mx-auto"></div>
                </div>
                <span className="ml-4 text-lg font-medium text-indigo-700">Loading sleep data...</span>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Sleep Duration
                    </span>
                    <span className="text-muted-foreground font-medium">{averageSleepHours.toFixed(1)}h / {SLEEP_GOALS.targetHours}h</span>
                  </div>
                  <Progress
                    value={Math.min((averageSleepHours / SLEEP_GOALS.targetHours) * 100, 100)}
                    className="h-3 rounded-full"
                  />
                </div>
                <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Sleep Quality
                    </span>
                    <span className="text-muted-foreground font-medium">{averageQuality.toFixed(1)} / 5</span>
                  </div>
                  <Progress
                    value={(averageQuality / 5) * 100}
                    className="h-3 rounded-full"
                  />
                </div>
                <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Consistency
                    </span>
                    <span className="text-muted-foreground font-medium">{sleepEntries.length > 0 ? Math.round((sleepEntries.length / 30) * 100) : 0}%</span>
                  </div>
                  <Progress value={sleepEntries.length > 0 ? (sleepEntries.length / 30) * 100 : 0} className="h-3 rounded-full" />
                </div>
                <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      Weekly Score
                    </span>
                    <span className="text-muted-foreground font-medium">{averageQuality > 0 ? (averageQuality >= 4 ? 'A' : averageQuality >= 3 ? 'B' : 'C') : 'N/A'}</span>
                  </div>
                  <Progress value={averageQuality > 0 ? (averageQuality / 5) * 100 : 0} className="h-3 rounded-full" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sleep Calendar */}
          <Card className="bg-card border-border shadow-2xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-muted rounded-all shadow-lg">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                Sleep Calendar
              </CardTitle>
              <CardDescription className="text-base mt-2">Select a date to view or log sleep data</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-xl border border-border bg-muted backdrop-blur-sm shadow-lg"
                modifiers={{
                  hasData: (date) => hasDataForDate(date),
                  excellent: (date) => getQualityForDate(date) === 5,
                  good: (date) => getQualityForDate(date) === 4,
                  fair: (date) => getQualityForDate(date) === 3,
                  poor: (date) => getQualityForDate(date) <= 2 && getQualityForDate(date) > 0,
                }}
                modifiersStyles={{
                  hasData: { fontWeight: 'bold' },
                  excellent: { backgroundColor: '#dcfce7', color: '#166534' },
                  good: { backgroundColor: '#dbeafe', color: '#1e40af' },
                  fair: { backgroundColor: '#fef3c7', color: '#92400e' },
                  poor: { backgroundColor: '#fee2e2', color: '#dc2626' },
                }}
              />
              <div className="mt-6 space-y-3">
                <div className="text-sm font-semibold text-emerald-700">Sleep Quality Legend:</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-200 border border-green-300"></div>
                    <span className="font-medium">Excellent (5)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-200 border border-blue-300"></div>
                    <span className="font-medium">Good (4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-200 border border-yellow-300"></div>
                    <span className="font-medium">Fair (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-200 border border-red-300"></div>
                    <span className="font-medium">Poor (1-2)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sleep Logging Card */}
          <Card className="bg-card border-border shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-full bg-gradient-to-br from-slate-500 to-indigo-500 rounded-lg">
                  <CloudMoon className="h-6 w-6 text-white" />
                </div>
                {selectedEntry ? 'Edit Sleep Entry' : 'Log Sleep Entry'}
              </CardTitle>
              <CardDescription className="text-lg">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                {selectedEntry && <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-800 border-indigo-200">Existing Entry</Badge>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="bedtime" className="text-sm font-semibold flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    Bedtime
                  </Label>
                  <Input
                    id="bedtime"
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full h-12 text-lg bg-muted backdrop-blur-sm border-border focus:border-indigo-400 focus:ring-indigo-400/20 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="waketime" className="text-sm font-semibold flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    Wake Time
                  </Label>
                  <Input
                    id="waketime"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full h-12 text-lg bg-muted backdrop-blur-sm border-border focus:border-indigo-400 focus:ring-indigo-400/20 rounded-xl"
                  />
                </div>
              </div>

              {/* Sleep Quality Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Sleep Quality
                  </Label>
                  <Badge className={`${qualityInfo.color} font-semibold`}>
                    {qualityInfo.label} ({quality}/5)
                  </Badge>
                </div>
                <div className="px-3">
                  <Slider
                    value={[quality]}
                    onValueChange={handleQualityChange}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Very Poor</span>
                    <span>Poor</span>
                    <span>Fair</span>
                    <span>Good</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>

              {/* Sleep Duration Display */}
              <div className="p-4 bg-mute backdrop-blur-sm rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-5 w-5 ${durationStatus.color}`} />
                    <span className="font-medium">Sleep Duration</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{sleepHours.toFixed(1)}h</div>
                    <div className={`text-sm ${durationStatus.color} font-medium`}>{durationStatus.status}</div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleLogSleep}
                disabled={saving}
                className="w-full h-12 text-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    {selectedEntry ? 'Update Sleep Entry' : 'Log Sleep Entry'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sleep Analytics Card */}
          <Card className="bg-card border-border shadow-2xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-muted rounded-full shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                Sleep Analytics
              </CardTitle>
              <CardDescription className="text-lg">
                {sleepData.length > 0 ? (
                  <>30-day average: {averageSleepHours.toFixed(1)} hours • Quality: {averageQuality.toFixed(1)}/5</>
                ) : (
                  'No data available yet'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : sleepData.length > 0 ? (
                <>
                  {/* Sleep Hours Chart */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Sleep Duration Trend
                      </h4>
                      <Badge variant="outline" className="text-xs bg-muted-foreground backdrop-blur-sm">
                        Last {sleepData.length} days
                      </Badge>
                    </div>
                    <div className="h-[200px] w-full p-4 bg-muted backdrop-blur-sm rounded-xl border shadow-lg">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sleepData.slice(-7)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <defs>
                            <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            stroke="#64748b"
                          />
                          <YAxis
                            domain={[0, 10]}
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                            stroke="#64748b"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              fontSize: '12px',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                            formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Sleep Duration']}
                          />
                          <Area
                            type="monotone"
                            dataKey="hours"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="url(#sleepGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sleep Quality Chart */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Sleep Quality Trend
                      </h4>
                    </div>
                    <div className="h-[140px] w-full p-4 bg-muted backdrop-blur-sm rounded-xl border shadow-lg">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sleepData.slice(-7)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <defs>
                            <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            stroke="#64748b"
                          />
                          <YAxis
                            domain={[0, 5]}
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={20}
                            stroke="#64748b"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              fontSize: '12px',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                            formatter={(value: number) => [`${value}/5`, 'Quality']}
                          />
                          <Bar
                            dataKey="quality"
                            fill="url(#qualityGradient)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CloudMoon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Start logging your sleep to see analytics</p>
                  <p className="text-sm mt-2">Track your sleep patterns and improve your wellness journey</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  )
}


