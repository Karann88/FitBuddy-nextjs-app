"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Timer,
  Target,
  Zap,
  Award,
  Calendar,
  Activity,
  Heart,
  Sparkles,
  Loader2,
  X
} from "lucide-react"
import { createSupabaseBrowserClient, type StretchEntry } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { format, parseISO } from "date-fns"
import type { DropResult } from "@hello-pangea/dnd"

const supabase = createSupabaseBrowserClient()

// Mock data for available stretch sequences
const stretchSequences = {
  morning: [
    {
      id: "m1",
      name: "Neck Rolls",
      duration: 30,
      description: "Gently roll your neck in a circular motion, 5 times in each direction. Keep movements slow and controlled.",
      image: "/placeholder.svg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Neck & Shoulders"
    },
    {
      id: "m2",
      name: "Shoulder Stretch",
      duration: 30,
      description: "Pull each arm across your chest and hold for 15 seconds. Feel the stretch in your shoulder and upper back.",
      image: "/images/shoulder-stretch.jpg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Shoulders"
    },
    {
      id: "m3",
      name: "Standing Side Bend",
      duration: 40,
      description: "Reach up and over to each side, holding for 20 seconds per side. Keep your core engaged.",
      image: "/placeholder.svg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Core & Sides"
    },
    {
      id: "m4",
      name: "Forward Fold",
      duration: 45,
      description: "Bend forward from the hips, keeping a slight bend in the knees. Let gravity help you stretch.",
      image: "/images/forward-fold.jpg?height=300&width=300",
      difficulty: "Medium" as const,
      targetArea: "Hamstrings & Back"
    },
  ],
  evening: [
    {
      id: "e1",
      name: "Child's Pose",
      duration: 60,
      description: "Kneel and extend arms forward, resting your forehead on the mat. Focus on deep breathing.",
      image: "/images/child-pose.jpg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Back & Hips"
    },
    {
      id: "e2",
      name: "Seated Forward Bend",
      duration: 45,
      description: "Sit with legs extended and reach for your toes. Keep your spine long and breathe deeply.",
      image: "/images/seated-forward-bend.jpg?height=300&width=300",
      difficulty: "Medium" as const,
      targetArea: "Hamstrings & Back"
    },
    {
      id: "e3",
      name: "Supine Twist",
      duration: 60,
      description: "Lie on your back and twist your knees to each side. Hold for 30 seconds each direction.",
      image: "/images/supine-twist.jpg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Spine & Core"
    },
    {
      id: "e4",
      name: "Legs Up The Wall",
      duration: 90,
      description: "Lie on your back with legs extended up a wall. This helps with circulation and relaxation.",
      image: "/placeholder.svg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Legs & Circulation"
    },
  ],
  desk: [
    {
      id: "d1",
      name: "Wrist Stretches",
      duration: 30,
      description: "Extend your arm and gently pull back on your fingers. Essential for computer users.",
      image: "/images/wrist-stetch.jpg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Wrists & Forearms"
    },
    {
      id: "d2",
      name: "Seated Twist",
      duration: 30,
      description: "Sit tall and twist to each side, holding for 15 seconds. Keep your feet flat on the floor.",
      image: "/images/seated-twist.jpg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Spine & Core"
    },
    {
      id: "d3",
      name: "Neck Stretch",
      duration: 30,
      description: "Tilt your ear toward your shoulder, 15 seconds each side. Perfect for tech neck relief.",
      image: "/images/neck-stretch.jpg?height=300&width=300",
      difficulty: "Easy" as const,
      targetArea: "Neck & Shoulders"
    },
    {
      id: "d4",
      name: "Seated Figure Four",
      duration: 40,
      description: "Cross ankle over opposite knee and lean forward slightly. Great for hip flexibility.",
      image: "/placeholder.svg?height=300&width=300",
      difficulty: "Medium" as const,
      targetArea: "Hips & Glutes"
    },
  ],
}

const sequenceInfo = {
  morning: {
    title: "Morning Energizer",
    description: "Wake up your body with gentle stretches",
    totalTime: 145,
    icon: "🌅",
    gradient: "from-orange-100 via-yellow-50 to-amber-100",
    borderColor: "border-orange-200",
    accentColor: "text-orange-600"
  },
  evening: {
    title: "Evening Wind-Down",
    description: "Relax and prepare for restful sleep",
    totalTime: 255,
    icon: "🌙",
    gradient: "from-indigo-100 via-purple-50 to-blue-100",
    borderColor: "border-indigo-200",
    accentColor: "text-indigo-600"
  },
  desk: {
    title: "Desk Break",
    description: "Combat sitting fatigue and tension",
    totalTime: 130,
    icon: "💻",
    gradient: "from-emerald-100 via-teal-50 to-cyan-100",
    borderColor: "border-emerald-200",
    accentColor: "text-emerald-600"
  }
}

export function StretchSequence() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [sequences, setSequences] = useState(stretchSequences)
  const [activeSequence, setActiveSequence] = useState<"morning" | "evening" | "desk">("morning")
  const [currentStretchIndex, setCurrentStretchIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [completedStretches, setCompletedStretches] = useState<StretchEntry[]>([])
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set())
  const [streak] = useState(0)
  const [totalSessions] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const currentSequence = sequences[activeSequence]
  const currentStretch = currentSequence[currentStretchIndex]
  const sequenceData = sequenceInfo[activeSequence]

  const handleStartSequence = () => {
    if (timeLeft === 0) {
      setTimeLeft(currentStretch.duration)
    }
    setIsActive(true)
  }

  const handlePauseSequence = () => {
    setIsActive(false)
  }

  const handleResetSequence = () => {
    setCurrentStretchIndex(0)
    setTimeLeft(currentSequence[0].duration)
    setIsActive(false)
    setCompletedIndices(new Set())
  }

  const handleNextStretch = () => {
    if (currentStretchIndex < currentSequence.length - 1) {
      setCompletedIndices(prev => new Set([...prev, currentStretchIndex]))
      if (currentStretch) {
        handleAddCompletedStretch(currentStretch.name, currentStretch.duration)
      }
      setCurrentStretchIndex((prev) => prev + 1)
      setTimeLeft(currentSequence[currentStretchIndex + 1].duration)
    }
  }

  const handlePrevStretch = () => {
    if (currentStretchIndex > 0) {
      setCurrentStretchIndex((prev) => prev - 1)
      setTimeLeft(currentSequence[currentStretchIndex - 1].duration)
      setCompletedIndices(prev => {
        const newSet = new Set(prev)
        newSet.delete(currentStretchIndex - 1)
        return newSet
      })
    }
  }

  const handleSelectStretch = (index: number) => {
    setCurrentStretchIndex(index)
    setTimeLeft(currentSequence[index].duration)
    setIsActive(false)
  }

  const handleSequenceChange = (value: string) => {
    const newSequence = value as "morning" | "evening" | "desk"
    setActiveSequence(newSequence)
    setCurrentStretchIndex(0)
    setTimeLeft(sequences[newSequence][0].duration)
    setIsActive(false)
    setCompletedIndices(new Set())
  }

  const handleAddCompletedStretch = useCallback(async (name: string, duration: number) => {
    if (!user) return

    const today = format(new Date(), "yyyy-MM-dd")
    const { error } = await supabase.from("stretches_entries").insert({
      user_id: user.id,
      stretch_name: name,
      duration: duration,
      date: today,
    })

    if (error) {
      console.error("Error adding completed stretch:", error)
    }
  }, [user])

  const handleDeleteCompletedStretch = async (id: string) => {
    setIsLoading(true)
    const { error } = await supabase.from("stretches_entries").delete().eq("id", id)
    if (error) {
      console.error("Error deleting completed stretch:", error)
    }
    setIsLoading(false)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    const sequenceCopy = [...sequences[activeSequence]]
    const [removed] = sequenceCopy.splice(sourceIndex, 1)
    sequenceCopy.splice(destinationIndex, 0, removed)

    setSequences({
      ...sequences,
      [activeSequence]: sequenceCopy,
    })

    // Adjust current stretch index if needed
    if (currentStretchIndex === sourceIndex) {
      setCurrentStretchIndex(destinationIndex)
    } else if (currentStretchIndex > sourceIndex && currentStretchIndex <= destinationIndex) {
      setCurrentStretchIndex((prev) => prev - 1)
    } else if (currentStretchIndex < sourceIndex && currentStretchIndex >= destinationIndex) {
      setCurrentStretchIndex((prev) => prev + 1)
    }
  }

  useEffect(() => {
    if (isAuthLoading || !user) {
      setIsLoading(true)
      return
    }

    const fetchCompletedStretches = async () => {
      setIsLoading(true)
      const today = format(new Date(), "yyyy-MM-dd")
      const { data, error } = await supabase
        .from("stretches_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching completed stretches:", error)
      } else {
        setCompletedStretches(data)
      }
      setIsLoading(false)
    }

    const stretchChannel = supabase
      .channel("completed_stretch_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stretches_entries",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEntry = payload.new as StretchEntry | null
          const oldEntry = payload.old as StretchEntry | null
          const today = format(new Date(), "yyyy-MM-dd")

          setCompletedStretches((prev) => {
            let updatedStretches = [...prev]
            if (payload.eventType === "INSERT") {
              if (newEntry && format(parseISO(newEntry.date), "yyyy-MM-dd") === today) {
                updatedStretches = [...updatedStretches, newEntry]
              }
            } else if (payload.eventType === "UPDATE") {
              if (newEntry && format(parseISO(newEntry.date), "yyyy-MM-dd") === today) {
                updatedStretches = updatedStretches.map((st) => (st.id === newEntry.id ? newEntry : st))
              }
            } else if (payload.eventType === "DELETE") {
              if (oldEntry) {
                updatedStretches = updatedStretches.filter((st) => st.id !== oldEntry.id)
              }
            }
            return updatedStretches.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          })
        },
      )
      .subscribe()

    fetchCompletedStretches()

    return () => {
      supabase.removeChannel(stretchChannel)
    }
  }, [user, isAuthLoading])

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Mark current stretch as completed
          setCompletedIndices(prev => new Set([...prev, currentStretchIndex]))

          // Add to database
          if (currentStretch) {
            handleAddCompletedStretch(currentStretch.name, currentStretch.duration)
          }

          // Move to next stretch
          if (currentStretchIndex < currentSequence.length - 1) {
            setCurrentStretchIndex((prev) => prev + 1)
            return currentSequence[currentStretchIndex + 1].duration
          } else {
            // End of sequence
            setIsActive(false)
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, timeLeft, currentStretchIndex, currentSequence, currentStretch, handleAddCompletedStretch])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = currentStretch ? ((currentStretch.duration - timeLeft) / currentStretch.duration) * 100 : 0
  const overallProgress = (completedIndices.size / currentSequence.length) * 100

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 border-green-200"
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Hard": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Sparkles className="h-6 w-6 text-cyan-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <span className="text-muted-foreground font-medium">Loading your stretch data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-6 overflow-auto">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full space-y-8">
        {/* Enhanced Header Dashboard */}
        <Card className="bg-card border border-border shadow-md hover:shadow-xl transition-all backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-3xl">
                  <div className="p-3 rounded-full bg-muted-foreground shadow-lg">
                    <Sparkles className="h-8 w-8 text-purple-500" />
                  </div>
                  {/* <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> */}
                  Stretch & Wellness Dashboard
                  {/* </span> */}
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-muted-foreground">Transform your day with mindful movement and flexibility</CardDescription>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-primary">{streak}</div>
                  <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-primary">{totalSessions}</div>
                  <div className="text-sm text-muted-foreground font-medium">Sessions</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-teal-600" />
                    Session Progress
                  </span>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                    {Math.round(overallProgress)}%
                  </Badge>
                </div>
                <Progress value={overallProgress} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground">Stretches completed</p>
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4 text-purple-600" />
                    Time Remaining
                  </span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {formatTime(timeLeft)}
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground">Current stretch</p>
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Completed
                  </span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {completedIndices.size}/{currentSequence.length}
                  </Badge>
                </div>
                <Progress value={(completedIndices.size / currentSequence.length) * 100} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground">Today&apos;s stretches</p>
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-yellow-600" />
                    Wellness Score
                  </span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    85%
                  </Badge>
                </div>
                <Progress value={85} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground">Overall health</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Sequence Selection */}
        <Card className="bg-card backdrop-blur-sm border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="h-6 w-6 text-slate-600" />
              Choose Your Stretch Sequence
            </CardTitle>
            <CardDescription className="text-base">Select the perfect routine for your current needs</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeSequence} onValueChange={handleSequenceChange}>
              <TabsList className="grid w-full grid-cols-3 p-1 rounded-xl">
                <TabsTrigger
                  value="morning"
                  className="data-[state=active]:bg-muted-foreground data-[state=active]:text-orange-800 rounded-lg"
                >
                  <span className="mr-2">🌅</span>
                  Morning Energizer
                </TabsTrigger>
                <TabsTrigger
                  value="evening"
                  className="data-[state=active]:bg-muted-foreground data-[state=active]:text-indigo-800 rounded-lg"
                >
                  <span className="mr-2">🌙</span>
                  Evening Wind-Down
                </TabsTrigger>
                <TabsTrigger
                  value="desk"
                  className="data-[state=active]:bg-muted-foreground data-[state=active]:text-emerald-800 rounded-lg"
                >
                  <span className="mr-2">💻</span>
                  Desk Break
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-6 p-6 rounded-xl bg-purple-100 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-purple-800">{sequenceData.title}</h3>
                  <p className="text-md font-semibold text-slate-600 mt-1">{sequenceData.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-700">{Math.floor(sequenceData.totalTime / 60)}:{(sequenceData.totalTime % 60).toString().padStart(2, '0')}</div>
                  <div className="text-sm text-purple-500">Total Duration</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Current Stretch Display */}
          <Card className="lg:col-span-2 bg-card border-border shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 rounded-full shadow-lg">
                      <Activity className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {currentStretch?.name || "Select a stretch"}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {currentStretch?.description || "Start the sequence to begin stretching"}
                  </CardDescription>
                </div>
                {currentStretch?.difficulty && (
                  <Badge variant="secondary" className={`${getDifficultyColor(currentStretch.difficulty)} text-base px-3 py-1`}>
                    {currentStretch.difficulty}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center space-y-8">
              {/* Enhanced Image Display */}
              <div className="relative w-full aspect-square max-w-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-muted">
                {currentStretch && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentStretch.image || "/placeholder.svg"}
                    alt={currentStretch.name}
                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                  />
                )}
                {completedIndices.has(currentStretchIndex) && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-16 w-16 text-green-600 bg-white rounded-full p-2 shadow-lg" />
                  </div>
                )}
              </div>

              {/* Enhanced Progress Display */}
              <div className="w-full max-w-md space-y-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Time remaining</span>
                  <span className="text-2xl font-bold text-indigo-600">{formatTime(timeLeft)}</span>
                </div>
                <Progress value={progressPercentage} className="h-4 rounded-full shadow-inner" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0:00</span>
                  <span>{formatTime(currentStretch?.duration || 0)}</span>
                </div>
              </div>

              {/* Enhanced Control Buttons */}
              <div className="flex justify-between items-center w-full max-w-md">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrevStretch}
                  disabled={currentStretchIndex === 0}
                  className="h-14 w-14 rounded-full border-2 border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>

                {!isActive ? (
                  <Button
                    onClick={handleStartSequence}
                    className="px-12 h-16 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Play className="mr-3 h-6 w-6" />
                    <span className="text-lg font-semibold">Start</span>
                  </Button>
                ) : (
                  <Button
                    onClick={handlePauseSequence}
                    variant="outline"
                    className="px-12 h-16 border-2 border-orange-300 hover:bg-orange-50 rounded-full shadow-lg"
                  >
                    <Pause className="mr-3 h-6 w-6" />
                    <span className="text-lg font-semibold">Pause</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleNextStretch}
                  disabled={currentStretchIndex === currentSequence.length - 1}
                  className="h-14 w-14 rounded-full border-2 border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center rounded-b-2xl border-t border-border">
              <Button
                variant="outline"
                onClick={handleResetSequence}
                className="flex items-center gap-2 hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Sequence
              </Button>

              <div className="text-base text-foreground font-medium">
                {currentStretchIndex + 1} of {currentSequence.length} stretches
              </div>
            </CardFooter>
          </Card>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Sequence Overview */}
            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="h-6 w-6 text-indigo-600" />
                  Sequence Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="stretches">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3 max-h-[400px] overflow-y-auto"
                      >
                        {currentSequence.map((stretch, index) => (
                          <Draggable key={stretch.id} draggableId={stretch.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${index === currentStretchIndex
                                    ? "bg-indigo-100 border-indigo-300 shadow-md"
                                    : completedIndices.has(index)
                                      ? "bg-green-100 border-green-300"
                                      : "bg-white border-slate-200 hover:bg-slate-50"
                                  } ${snapshot.isDragging ? "shadow-2xl scale-105" : ""}`}
                                onClick={() => handleSelectStretch(index)}
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-slate-400" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800">{stretch.name}</span>
                                    {completedIndices.has(index) && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-600">{stretch.targetArea}</div>
                                </div>

                                <div className="text-right">
                                  <div className="text-sm font-medium text-slate-700">{formatTime(stretch.duration)}</div>
                                  {stretch.difficulty && (
                                    <Badge variant="outline" className={`text-xs ${getDifficultyColor(stretch.difficulty)}`}>
                                      {stretch.difficulty}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>

            {/* Completed Stretches Today */}
            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Award className="h-6 w-6 text-emerald-600" />
                  Completed Today
                </CardTitle>
                <CardDescription>Review your completed stretches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {completedStretches.length > 0 ? (
                    completedStretches.map((stretch) => (
                      <div key={stretch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted-foreground backdrop-blur-sm border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="font-medium text-emerald-800">{stretch.stretch_name}</div>
                          <div className="text-sm text-emerald-600">{formatTime(stretch.duration)}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCompletedStretch(stretch.id)}
                          className="hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>No stretches completed today.</p>
                      <p className="text-sm">Start your first session!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


