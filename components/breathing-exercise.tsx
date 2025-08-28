"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Pause, Play, RotateCcw, Wind, Heart, Moon, Zap, Target, Sparkles } from "lucide-react"
import { createSupabaseBrowserClient, type ExerciseEntry } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

const supabase = createSupabaseBrowserClient()

type BreathingPattern = {
  name: string
  inhale: number
  hold1: number
  exhale: number
  hold2: number
  description: string
  icon: React.ReactNode
  color: string
  bgGradient: string
  benefits: string[]
  difficulty: "Beginner" | "Intermediate" | "Advanced"
}

const breathingPatterns: BreathingPattern[] = [
  {
    name: "Box Breathing",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    description: "Equal parts inhale, hold, exhale, and hold. Perfect for stress relief and mental clarity.",
    icon: <Wind className="h-4 w-4" />,
    color: "bg-sky-500",
    bgGradient: "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200",
    benefits: ["Reduces stress", "Improves focus", "Calms nervous system"],
    difficulty: "Beginner"
  },
  {
    name: "4-7-8 Breathing",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    description: "Inhale for 4, hold for 7, exhale for 8. Powerful technique for anxiety and sleep.",
    icon: <Moon className="h-4 w-4" />,
    color: "bg-indigo-500",
    bgGradient: "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200",
    benefits: ["Reduces anxiety", "Promotes sleep", "Lowers heart rate"],
    difficulty: "Intermediate"
  },
  {
    name: "Relaxing Breath",
    inhale: 5,
    hold1: 2,
    exhale: 7,
    hold2: 0,
    description: "Longer exhale activates the parasympathetic nervous system for deep relaxation.",
    icon: <Heart className="h-4 w-4" />,
    color: "bg-teal-500",
    bgGradient: "bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200",
    benefits: ["Deep relaxation", "Stress relief", "Better sleep"],
    difficulty: "Beginner"
  },
  {
    name: "Energizing Breath",
    inhale: 3,
    hold1: 1,
    exhale: 3,
    hold2: 1,
    description: "Quick, rhythmic breathing to boost energy, alertness, and mental clarity.",
    icon: <Zap className="h-4 w-4" />,
    color: "bg-amber-500",
    bgGradient: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
    benefits: ["Increases energy", "Improves alertness", "Boosts mood"],
    difficulty: "Advanced"
  },
]

const difficultyConfig = {
  Beginner: { color: "bg-green-100 text-green-800 border-green-200" },
  Intermediate: { color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  Advanced: { color: "bg-rose-100 text-rose-800 border-rose-200" }
}

export function BreathingExercise() {
  const [isActive, setIsActive] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(breathingPatterns[0])
  const [phase, setPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale")
  const [timeLeft, setTimeLeft] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [sessionGoal, setSessionGoal] = useState(5)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [completedSessions, setCompletedSessions] = useState<ExerciseEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const animationRef = useRef<HTMLDivElement>(null)
  const { user, isLoading: isAuthLoading } = useAuth()
  // const audioContextRef = useRef<AudioContext | null>(null)

  // Calculate total cycle time
  const cycleTime = selectedPattern.inhale + selectedPattern.hold1 + selectedPattern.exhale + selectedPattern.hold2
  const sessionProgress = (cycles / sessionGoal) * 100

  useEffect(() => {
    if (isAuthLoading || !user) {
      setIsLoading(true)
      return
    }

    const fetchBreathingSessions = async () => {
      setIsLoading(true)
      const today = format(new Date(), "yyyy-MM-dd")

      const { data, error } = await supabase 
        .from("exercise_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .ilike("exercise_name", "%breathing%")
        .order("created_at", { ascending: false})

      if (error) {
        console.error("Error fetching breathing sessions:", error)
      } else {
        setCompletedSessions((data as ExerciseEntry[]) ?? [])
      } 
      setIsLoading(false)
    }

    const breathingChannel = supabase
      .channel("breathing_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exercise_entries",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEntry = payload.new as ExerciseEntry | null
          const oldEntry = payload.old as ExerciseEntry | null
          const today = format(new Date(), "yyyy-MM-dd")

          if (payload.eventType === "INSERT") {
            if (
              newEntry && 
              format(new Date(newEntry.date), "yyyy-MM-dd") === today &&
              newEntry.exercise_name.toLowerCase().includes("breathing")
            ) {
              setCompletedSessions((prev) => [newEntry, ...prev])
            } 
          } else if (payload.eventType === "DELETE") {
            if (
              oldEntry && 
              format(new Date(oldEntry.date), "yyyy-MM-dd") === today && 
              oldEntry.exercise_name.toLowerCase().includes("breathing")
            ) {
              setCompletedSessions((prev) => prev.filter((session) => session.id !== oldEntry.id))
            }
          }
        },
      )
      .subscribe()

    fetchBreathingSessions()

    return () => {
      supabase.removeChannel(breathingChannel)
    }
  }, [user, isAuthLoading])

  const saveBreathingSession = async () => {
    if (!user || cycles === 0) return 

    const sessionName = `${selectedPattern.name} Breathing`
    const durationMinutes = Math.ceil(
      (cycles * (selectedPattern.inhale + selectedPattern.hold1 + selectedPattern.exhale + selectedPattern.hold2)) / 60,
    )

    const { error } = await supabase.from("exercise_entries").insert({
      user_id: user.id,
      exercise_name: sessionName,
      duration: durationMinutes,
      date: format(new Date(), "yyyy-MM-dd"),
    })

    if (error) {
      console.error("Error saving breathing session:", error)
    }
  }

  useEffect(() => {
    if (!isActive) return

    const phaseTime =
      phase === "inhale"
        ? selectedPattern.inhale
        : phase === "hold1"
          ? selectedPattern.hold1
          : phase === "exhale"
            ? selectedPattern.exhale
            : selectedPattern.hold2

    if (timeLeft === 0) {
      setTimeLeft(phaseTime)
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === "inhale") {
            setPhase(selectedPattern.hold1 > 0 ? "hold1" : "exhale")
          } else if (phase === "hold1") {
            setPhase("exhale")
          } else if (phase === "exhale") {
            if (selectedPattern.hold2 > 0) {
              setPhase("hold2")
            } else {
              setPhase("inhale")
              setCycles((c) => c + 1)
            }
          } else {
            setPhase("inhale")
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, phase, selectedPattern, timeLeft])

  useEffect(() => {
    if (isActive) {
      setTotalTime((prev) => prev + 1)
    }
  }, [timeLeft, isActive])

  useEffect(() => {
    if (!animationRef.current) return

    const element = animationRef.current

    if (phase === "inhale") {
      element.style.transform = "scale(1.8)"
      element.style.transition = `transform ${selectedPattern.inhale}s cubic-bezier(0.4, 0, 0.2, 1)`
      element.style.opacity = "1"
      element.style.filter = "blur(0px)"
    } else if (phase === "exhale") {
      element.style.transform = "scale(1)"
      element.style.transition = `transform ${selectedPattern.exhale}s cubic-bezier(0.4, 0, 0.2, 1)`
      element.style.opacity = "0.7"
      element.style.filter = "blur(2px)"
    } else {
      // Hold phases
      element.style.transition = "opacity 0.5s ease, filter 0.5s ease"
      element.style.opacity = phase === "hold1" ? "0.9" : "0.8"
      element.style.filter = "blur(1px)"
    }
  }, [phase, selectedPattern])

  const handleStart = () => {
    setIsActive(true)
    setPhase("inhale")
    setCycles(0)
    setTotalTime(0)
    setTimeLeft(selectedPattern.inhale)
  }

  const handleStop = () => {
    setIsActive(false)
    if (cycles > 0) {
      saveBreathingSession()
    }
  }

  const handleReset = () => {
    setIsActive(false)
    setCycles(0)
    setTotalTime(0)
    setTimeLeft(0)
    setPhase("inhale")
  }

  const handlePatternChange = (pattern: BreathingPattern) => {
    setSelectedPattern(pattern)
    if (isActive) {
      setIsActive(false)
      setTimeout(() => {
        setIsActive(true)
        setPhase("inhale")
        setTimeLeft(pattern.inhale)
      }, 100)
    }
  }

  const getPhaseInstructions = () => {
    switch (phase) {
      case "inhale":
        return "Breathe in deeply through your nose"
      case "hold1":
        return "Hold your breath gently"
      case "exhale":
        return "Breathe out slowly through your mouth"
      case "hold2":
        return "Hold with empty lungs, stay relaxed"
      default:
        return "Prepare to begin your mindful breathing"
    }
  }

  const getPhaseProgress = () => {
    const phaseTime =
      phase === "inhale"
        ? selectedPattern.inhale
        : phase === "hold1"
          ? selectedPattern.hold1
          : phase === "exhale"
            ? selectedPattern.exhale
            : selectedPattern.hold2

    return ((phaseTime - timeLeft) / phaseTime) * 100
  }

  const getMotivationalMessage = () => {
    if (cycles >= sessionGoal) {
      return "🎉 Excellent! You've completed your breathing session!"
    } else if (cycles >= sessionGoal * 0.75) {
      return "💪 Almost there! You're doing wonderfully!"
    } else if (cycles >= sessionGoal * 0.5) {
      return "🌟 Great progress! Keep breathing mindfully!"
    } else if (cycles > 0) {
      return "🧘‍♀️ Beautiful! You're finding your rhythm!"
    } else {
      return "🌸 Welcome to your mindful breathing practice!"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <span className="sr-only">Loading breathing exercise...</span>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-slate-50 to-stone-50 text-gray-800">
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-8">
        {/* Header */}
        <header className="text-center py-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-sky-500 to-teal-400 text-transparent bg-clip-text">
            Mindful Breathing
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">Your personal space for calm, focus, and well-being.</p>
        </header>

        {/* Pattern Selection */}
        <Card className="w-full bg-white/60 backdrop-blur-xl border border-gray-200/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-semibold">
              <Sparkles className="h-6 w-6 text-indigo-500" />
              Choose Your Breathing Pattern
            </CardTitle>
            <CardDescription>Select a breathing technique that aligns with your current needs and experience level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {breathingPatterns.map((pattern) => (
                <div
                  key={pattern.name}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 transform-gpu ${
                    selectedPattern.name === pattern.name
                      ? `${pattern.bgGradient} border-opacity-100 shadow-md`
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => !isActive && handlePatternChange(pattern)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-full ${pattern.color} text-white shadow-lg`}>
                      {pattern.icon}
                    </div>
                    <Badge variant="secondary" className={`${difficultyConfig[pattern.difficulty].color} font-medium`}>
                      {pattern.difficulty}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{pattern.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 h-12 line-clamp-2">
                    {pattern.description}
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div>
                      {pattern.inhale}s in • {pattern.hold1 > 0 ? `${pattern.hold1}s hold • ` : ''}{pattern.exhale}s out{pattern.hold2 > 0 ? ` • ${pattern.hold2}s hold` : ''}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {pattern.benefits.map((benefit, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-gray-300/80 bg-gray-50/50">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Exercise Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 w-full bg-white/60 backdrop-blur-xl border border-gray-200/80 shadow-sm">
            <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-8">
              {/* Visualizer */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                <div
                  ref={animationRef}
                  className={`absolute w-full h-full rounded-full opacity-70 ${selectedPattern.bgGradient}`}
                />
                
                {/* Inner content */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center bg-white/80 rounded-full p-8 shadow-xl backdrop-blur-md w-48 h-48 sm:w-56 sm:h-56">
                  <div className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-2 text-gray-800 tracking-tighter">{timeLeft}</div>
                  <div className="text-xl sm:text-2xl capitalize mb-2 font-semibold text-gray-700">
                    {phase.replace("1", "").replace("2", "")}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 max-w-xs leading-snug">
                    {getPhaseInstructions()}
                  </div>
                  {isActive && (
                    <div className="mt-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 text-white text-xs font-medium shadow-md">
                      Practice in Progress
                    </div>
                  )}
                </div>
              </div>

              {/* Phase Progress */}
              <div className="w-full max-w-md space-y-3">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>Phase Progress</span>
                  <span>{Math.round(getPhaseProgress())}%</span>
                </div>
                <Progress value={getPhaseProgress()} className="h-2.5 rounded-full bg-gray-200" />
              </div>

              {/* Motivational Message */}
              <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-sky-50 text-indigo-800 rounded-xl shadow-inner max-w-md border border-indigo-100">
                <p className="font-medium">{getMotivationalMessage()}</p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                {!isActive ? (
                  <Button onClick={handleStart} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 text-white px-10 py-6 rounded-full shadow-lg text-lg font-semibold transition-transform transform hover:scale-105">
                    <Play className="mr-2 h-5 w-5" />
                    Begin Practice
                  </Button>
                ) : (
                  <Button onClick={handleStop} variant="outline" size="lg" className="w-full sm:w-auto border-2 border-gray-300 px-10 py-6 rounded-full">
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" size="lg" className="w-full sm:w-auto border-2 border-gray-300 px-10 py-6 rounded-full">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Panel */}
          <Card className="w-full bg-white/60 backdrop-blur-xl border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3 font-semibold">
                <Target className="h-6 w-6 text-teal-500" />
                Session Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Progress */}
              <div className="text-center p-4 rounded-lg bg-gray-50/80 border border-gray-200/80 shadow-inner">
                <div className="text-4xl font-bold text-teal-600 mb-1">{cycles}</div>
                <div className="text-sm text-gray-600 mb-2">Cycles Completed</div>
                <Progress value={sessionProgress} className="h-2.5" />
                <div className="text-xs text-gray-500 mt-1.5">Goal: {sessionGoal} cycles</div>
              </div>

              {/* Time Tracking */}
              <div className="text-center p-4 rounded-lg bg-gray-50/80 border border-gray-200/80 shadow-inner">
                <div className="text-3xl font-bold text-teal-600 mb-1">
                  {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">Practice Time</div>
              </div>

              {/* Pattern Details */}
              <div className="space-y-3">
                <h4 className="font-semibold text-md flex items-center gap-2 text-gray-700">
                  <Wind className="h-5 w-5" />
                  Pattern Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between p-2.5 rounded-lg bg-gray-50/80 border border-gray-200/80">
                    <span className="text-gray-600">Inhale:</span>
                    <span className="font-medium text-gray-800">{selectedPattern.inhale}s</span>
                  </div>
                  {selectedPattern.hold1 > 0 && (
                    <div className="flex justify-between p-2.5 rounded-lg bg-gray-50/80 border border-gray-200/80">
                      <span className="text-gray-600">Hold:</span>
                      <span className="font-medium text-gray-800">{selectedPattern.hold1}s</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5 rounded-lg bg-gray-50/80 border border-gray-200/80">
                    <span className="text-gray-600">Exhale:</span>
                    <span className="font-medium text-gray-800">{selectedPattern.exhale}s</span>
                  </div>
                  {selectedPattern.hold2 > 0 && (
                    <div className="flex justify-between p-2.5 rounded-lg bg-gray-50/80 border border-gray-200/80">
                      <span className="text-gray-600">Hold:</span>
                      <span className="font-medium text-gray-800">{selectedPattern.hold2}s</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-200/80">
                  <div className="flex justify-between text-sm font-medium p-2.5 rounded-lg bg-teal-50 text-teal-800">
                    <span>Total Cycle Time:</span>
                    <span>{cycleTime}s</span>
                  </div>
                </div>
              </div>

              {/* Session Goal Adjustment */}
              <div className="space-y-3">
                <h4 className="font-semibold text-md flex items-center gap-2 text-gray-700">
                  <Target className="h-5 w-5" />
                  Adjust Goal
                </h4>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSessionGoal(Math.max(1, sessionGoal - 1))}
                    disabled={isActive}
                    className="rounded-full w-10 h-10"
                  >
                    -
                  </Button>
                  <span className="flex-1 text-center font-semibold text-lg text-gray-800">{sessionGoal} cycles</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSessionGoal(Math.min(20, sessionGoal + 1))}
                    disabled={isActive}
                    className="rounded-full w-10 h-10"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="text-center text-sm text-gray-600 p-3 rounded-lg bg-gray-50/80 border border-gray-200/80">
                {isActive ? "🧘‍♀️ Practice in progress... find your calm." : "🌸 Ready to begin your mindful session"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}




