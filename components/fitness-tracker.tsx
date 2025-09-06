"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Target,
  Trophy,
  Clock,
  CheckCircle2,
  Activity,
  Flame,
  Timer,
  Heart,
  Sparkles,
  Award,
  Loader2,
  X,
  TrendingUp
} from "lucide-react"
import { createSupabaseBrowserClient, type ExerciseEntry } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { format, parseISO } from "date-fns"

const supabase = createSupabaseBrowserClient()

type Exercise = {
  id: string
  name: string
  duration: number
  completed?: boolean
}

type Workout = {
  id: string
  name: string
  exercises: Exercise[]
  category: "strength" | "cardio" | "core"
  difficulty: "beginner" | "intermediate" | "advanced"
}

// Enhanced workout routines with categories
const workoutRoutines: Workout[] = [
  {
    id: "1",
    name: "Full Body Workout",
    category: "strength",
    difficulty: "intermediate",
    exercises: [
      { id: "push-ups", name: "Push-ups", duration: 60 },
      { id: "squats", name: "Squats", duration: 60 },
      { id: "plank", name: "Plank", duration: 30 },
      { id: "lunges", name: "Lunges", duration: 60 },
      { id: "mountain-climbers", name: "Mountain Climbers", duration: 45 },
    ],
  },
  {
    id: "2",
    name: "Upper Body Focus",
    category: "strength",
    difficulty: "advanced",
    exercises: [
      { id: "bicep-curls", name: "Bicep Curls", duration: 45 },
      { id: "tricep-dips", name: "Tricep Dips", duration: 45 },
      { id: "shoulder-press", name: "Shoulder Press", duration: 60 },
      { id: "pull-ups", name: "Pull-ups", duration: 30 },
    ],
  },
  {
    id: "3",
    name: "Core Strength",
    category: "core",
    difficulty: "beginner",
    exercises: [
      { id: "crunches", name: "Crunches", duration: 60 },
      { id: "russian-twists", name: "Russian Twists", duration: 45 },
      { id: "leg-raises", name: "Leg Raises", duration: 45 },
      { id: "side-planks", name: "Side Planks", duration: 30 },
    ],
  },
  {
    id: "4",
    name: "Cardio Blast",
    category: "cardio",
    difficulty: "intermediate",
    exercises: [
      { id: "jumping-jacks", name: "Jumping Jacks", duration: 60 },
      { id: "burpees", name: "Burpees", duration: 45 },
      { id: "high-knees", name: "High Knees", duration: 30 },
      { id: "butt-kicks", name: "Butt Kicks", duration: 30 },
    ],
  }
]

// All available exercises for custom workouts
const availableExercises: Exercise[] = workoutRoutines.flatMap(workout => workout.exercises)
  .filter((exercise, index, self) => self.findIndex(e => e.id === exercise.id) === index)

const categoryConfig = {
  strength: {
    icon: Dumbbell,
    color: "bg-red-100 text-red-800 border-red-200",
    chartColor: "#ef4444",
    gradient: "from-red-100 via-orange-50 to-pink-100",
    borderColor: "border-red-200",
    accentColor: "text-red-600"
  },
  cardio: {
    icon: Activity,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    chartColor: "#3b82f6",
    gradient: "from-blue-100 via-cyan-50 to-sky-100",
    borderColor: "border-blue-200",
    accentColor: "text-blue-600"
  },
  core: {
    icon: Target,
    color: "bg-green-100 text-green-800 border-green-200",
    chartColor: "#10b981",
    gradient: "from-green-100 via-emerald-50 to-teal-100",
    borderColor: "border-green-200",
    accentColor: "text-green-600"
  }
}

const difficultyConfig = {
  beginner: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Beginner" },
  intermediate: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Intermediate" },
  advanced: { color: "bg-red-100 text-red-800 border-red-200", label: "Advanced" }
}

export function FitnessTracker() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [completedExercises, setCompletedExercises] = useState<ExerciseEntry[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(workoutRoutines[0])
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseDuration, setNewExerciseDuration] = useState(30)
  const [isLoading, setIsLoading] = useState(true)
  const [streak] = useState(0)
  const [totalSessions] = useState(0)

  const handleSelectWorkout = useCallback((workout: Workout) => {
    setSelectedWorkout(workout)
    setActiveExercise(null)
    setIsActive(false)
  }, [])

  const handleStartExercise = useCallback((exercise: Exercise) => {
    setActiveExercise(exercise)
    setTimeLeft(exercise.duration)
    setIsActive(true)
  }, [])

  const handlePauseExercise = useCallback(() => {
    setIsActive(false)
  }, [])

  const handleResetExercise = useCallback(() => {
    if (activeExercise) {
      setTimeLeft(activeExercise.duration)
      setIsActive(false)
    }
  }, [activeExercise])

  const handleAddCompletedExercise = useCallback(
    async (name: string, duration: number) => {
      if (!user) return

      const today = format(new Date(), "yyyy-MM-dd")
      const { error } = await supabase.from("exercise_entries").insert({
        user_id: user.id,
        exercise_name: name,
        duration: duration,
        date: today,
      })
      if (error) {
        console.error("Error adding completed exercise:", error)
      }
    },
    [user]
  )

  const handleDeleteCompletedExercise = useCallback(async (id: string) => {
    const { error } = await supabase.from("exercise_entries").delete().eq("id", id)
    if (error) {
      console.error("Error deleting completed exercise:", error)
    }
  }, [])

  const handleAddCustomExercise = useCallback(async () => {
    if (!user || !newExerciseName) return

    await handleAddCompletedExercise(newExerciseName, newExerciseDuration)
    setNewExerciseName("")
    setNewExerciseDuration(30)
  }, [user, newExerciseName, newExerciseDuration, handleAddCompletedExercise])

  useEffect(() => {
    if (isAuthLoading || !user) {
      setIsLoading(true)
      return
    }

    const fetchCompletedExercises = async () => {
      setIsLoading(true)
      const today = format(new Date(), "yyyy-MM-dd")
      const { data, error } = await supabase
        .from("exercise_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching completed exercises:", error)
      } else {
        setCompletedExercises(data)
      }
      setIsLoading(false)
    }

    const exerciseChannel = supabase
      .channel("completed_exercise_changes")
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

          setCompletedExercises((prev) => {
            let updatedExercises = [...prev]
            if (payload.eventType === "INSERT") {
              if (newEntry && format(parseISO(newEntry.date), "yyyy-MM-dd") === today) {
                updatedExercises = [...updatedExercises, newEntry]
              }
            } else if (payload.eventType === "UPDATE") {
              if (newEntry && format(parseISO(newEntry.date), "yyyy-MM-dd") === today) {
                updatedExercises = updatedExercises.map((ex) => (ex.id === newEntry.id ? newEntry : ex))
              }
            } else if (payload.eventType === "DELETE") {
              if (oldEntry) {
                updatedExercises = updatedExercises.filter((ex) => ex.id !== oldEntry.id)
              }
            }
            return updatedExercises.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          })
        },
      )
      .subscribe()

    fetchCompletedExercises()

    return () => {
      supabase.removeChannel(exerciseChannel)
    }
  }, [user, isAuthLoading])

  useEffect(() => {
    if (!isActive || !activeExercise) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          if (activeExercise) {
            handleAddCompletedExercise(activeExercise.name, activeExercise.duration)
          }
          setActiveExercise(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, activeExercise, handleAddCompletedExercise])

  const calculateProgress = (workout: Workout) => {
    if (workout.exercises.length === 0) return 0
    const completedCount = workout.exercises.filter(ex =>
      completedExercises.some(completed => completed.exercise_name === ex.name)
    ).length
    return Math.round((completedCount / workout.exercises.length) * 100)
  }

  const getTotalDuration = (workout: Workout) => {
    return workout.exercises.reduce((total, exercise) => total + exercise.duration, 0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getMotivationalMessage = () => {
    const completedToday = completedExercises.length
    if (completedToday >= 10) {
      return "🔥 Incredible! You're on fire today!"
    } else if (completedToday >= 5) {
      return "💪 Amazing progress! Keep pushing!"
    } else if (completedToday >= 3) {
      return "⚡ Great momentum! You're doing fantastic!"
    } else if (completedToday >= 1) {
      return "🌟 Good start! Every rep counts!"
    } else {
      return "🚀 Ready to crush your fitness goals?"
    }
  }

  // Calculate overall fitness stats
  const totalWorkouts = workoutRoutines.length
  const totalExercises = availableExercises.length
  const completedToday = completedExercises.length

  const currentWorkoutCategory = selectedWorkout?.category || "strength"
  const currentCategoryConfig = categoryConfig[currentWorkoutCategory]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Sparkles className="h-6 w-6 text-cyan-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <span className="text-muted-foreground font-medium">Loading fitness data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background p-6 overflow-auto">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full space-y-6">
        {/* Header Dashboard */}
        <Card className="bg-card border border-border shadow-md hover:shadow-xl transition-all backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 shadow-lg">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  Fitness & Training Dashboard
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-muted-foreground">Transform your body with structured workouts</CardDescription>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-purple-600">{streak}</div>
                  <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                  <div className="text-3xl font-bold text-purple-600">{totalSessions}</div>
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
                    <Trophy className="h-4 w-4 text-purple-500" />
                    Workouts
                  </span>
                  {/* <span className="bg-teal-100 text-teal-800">{totalWorkouts}</span> */}
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {totalWorkouts}
                  </Badge>
                </div>
                <Progress value={Math.min(totalWorkouts * 20, 100)} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-pink-500" />
                    Available Exercises
                  </span>
                  {/* <span className="bg-teal-100 text-teal-800">{totalExercises}</span> */}
                  <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                    {totalExercises}
                  </Badge>
                </div>
                <Progress value={Math.min(totalExercises * 5, 100)} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Completed Today
                  </span>
                  {/* <span className="bg-teal-100 text-teal-800">{completedToday}</span> */}
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {completedToday}
                  </Badge>
                </div>
                <Progress value={Math.min(completedToday * 10, 100)} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted backdrop-blur-sm border border-border shadow-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-green-500" />
                    Fitness Score
                  </span>
                  {/* <span className="bg-teal-100 text-teal-800">{Math.min(78 + completedToday * 2, 100)}%</span> */}
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {Math.min(78 + completedToday * 2, 100)}%
                  </Badge>
                </div>
                <Progress value={Math.min(78 + completedToday * 2, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Motivational Message */}
        <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl shadow-lg">
          <p className="font-medium text-lg">{getMotivationalMessage()}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 w-full">
          {/* Workout Routines */}
          <Card className="lg:col-span-2 bg-card border border-border shadow-md backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className={`h-6 w-6 ${currentCategoryConfig.accentColor}`} />
                Workout Routines
              </CardTitle>
              <CardDescription>Choose your workout and start training</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue={workoutRoutines[0].id}>
                <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-6">
                  {workoutRoutines.map((workout) => (
                    <TabsTrigger
                      key={workout.id}
                      value={workout.id}
                      onClick={() => handleSelectWorkout(workout)}
                      className="text-xs"
                    >
                      {workout.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {workoutRoutines.map((workout) => {
                  const CategoryIcon = categoryConfig[workout.category].icon
                  const workoutConfig = categoryConfig[workout.category]
                  const progress = calculateProgress(workout)

                  return (
                    <TabsContent key={workout.id} value={workout.id} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CategoryIcon className={`h-6 w-6 ${workoutConfig.accentColor}`} />
                          <div>
                            <h3 className="text-xl font-bold">{workout.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={workoutConfig.color}>
                                {workout.category}
                              </Badge>
                              <Badge variant="outline" className={difficultyConfig[workout.difficulty].color}>
                                {difficultyConfig[workout.difficulty].label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {formatTime(getTotalDuration(workout))} total
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {workout.exercises.length} exercises
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Workout Progress</span>
                            <span className="text-muted-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-3 rounded-full" />
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {workout.exercises.map((exercise, index) => {
                          const isCompleted = completedExercises.some(completed =>
                            completed.exercise_name === exercise.name
                          )

                          return (
                            <div
                              key={exercise.id}
                              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${isCompleted
                                ? 'bg-green-50 border-green-200'
                                : 'bg-muted border-border hover:border-pink-300'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted ? 'bg-green-500 text-primary' : 'bg-muted-foreground text-accent'
                                  }`}>
                                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                                </div>
                                <div>
                                  <Label className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                    {exercise.name}
                                  </Label>
                                  <div className="text-sm text-muted-foreground">
                                    {formatTime(exercise.duration)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isCompleted && (
                                  <Badge className="bg-muted text-muted text-green-800 border-border">
                                    ✓ Done
                                  </Badge>
                                )}
                                <Button
                                  variant={isCompleted ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => handleStartExercise(exercise)}
                                  disabled={isActive}
                                  className="transition-all duration-200 hover:scale-105"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  {isCompleted ? "Redo" : "Start"}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>

          {/* Enhanced Timer and Stats */}
          <div className="space-y-6">
            {/* Exercise Timer */}
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-purple-600" />
                  Exercise Timer
                </CardTitle>
                <CardDescription>
                  {activeExercise ? `Current: ${activeExercise.name}` : "Select an exercise to start"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-6">
                <div className="relative flex h-48 w-48 items-center justify-center">
                  {/* Outer ring with gradient */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-full w-full rounded-full overflow-hidden border-8 border-border shadow-lg"
                      style={{
                        background: activeExercise
                          ? `conic-gradient(from 0deg, #8b5cf6 0deg, #a855f7 ${((activeExercise.duration - timeLeft) / activeExercise.duration) * 360}deg, #f3e8ff ${((activeExercise.duration - timeLeft) / activeExercise.duration) * 360}deg, #f3e8ff 360deg)`
                          : '#f3e8ff',
                      }}
                    />
                  </div>
                  {/* Inner circle */}
                  <div className="relative flex flex-col items-center justify-center rounded-full bg-muted h-40 w-40 shadow-xl border-4 border-purple-100">
                    <Dumbbell className={`h-8 w-8 mb-2 ${activeExercise ? 'text-purple-500' : 'text-gray-400'}`} />
                    <div className="text-4xl font-bold text-purple-700">{timeLeft}</div>
                    <div className="text-sm text-muted-foreground">seconds</div>
                    {activeExercise && (
                      <div className="mt-1 text-xs text-purple-600 font-medium">
                        {Math.round(((activeExercise.duration - timeLeft) / activeExercise.duration) * 100)}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4">
                  {!isActive ? (
                    <Button
                      onClick={() => activeExercise && handleStartExercise(activeExercise)}
                      disabled={!activeExercise}
                      className="bg-purple-500 hover:bg-purple-500 text-muted font-semibold rounded-full px-6"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePauseExercise}
                      variant="outline"
                      className="border-border hover:bg-purple-50 rounded-full px-6"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  <Button
                    onClick={handleResetExercise}
                    variant="outline"
                    disabled={!activeExercise}
                    className="border-border hover:bg-purple-50 rounded-full px-6"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Stats */}
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Today&apos;s Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Exercises Completed
                  </span>
                  <span className="font-bold text-lg text-emerald-700">{completedToday}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Calories Burned
                  </span>
                  <span className="font-bold text-lg text-emerald-700">{completedToday * 15}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-pink-500" />
                    Total Time
                  </span>
                  <span className="font-bold text-lg text-emerald-500">
                    {formatTime(completedExercises.reduce((sum, ex) => sum + ex.duration, 0))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badge */}
            {completedToday >= 5 && (
              <Card className="bg-card border-border shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Award className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-yellow-800">Fitness Warrior!</h3>
                      <p className="text-sm text-yellow-600">Outstanding workout today!</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-border">
                      🏆 {completedToday} Exercises Completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Enhanced Exercise Log */}
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-froeground" />
              Exercise Log & Custom Workouts
            </CardTitle>
            <CardDescription>Track completed exercises and add custom ones</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="log" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="log">Quick Add</TabsTrigger>
                <TabsTrigger value="completed">Completed Today</TabsTrigger>
              </TabsList>

              <TabsContent value="log" className="space-y-4 mt-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto">
                  {availableExercises.map((exercise) => {
                    const isCompleted = completedExercises.some(completed =>
                      completed.exercise_name === exercise.name
                    )

                    return (
                      <div
                        key={exercise.id}
                        className={`flex items-center justify-between rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-md ${isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'border-border hover:border-indigo-300'
                          }`}
                      >
                        <div>
                          <Label className={`font-medium ${isCompleted ? 'text-green-700' : ''}`}>
                            {exercise.name}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(exercise.duration)}
                          </div>
                        </div>
                        <Button
                          variant={isCompleted ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleStartExercise(exercise)}
                          disabled={isActive}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-end space-x-2 border-t pt-4">
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor="exercise-name">Custom Exercise</Label>
                    <Input
                      id="exercise-name"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Exercise name"
                      className="border-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div className="grid gap-2 w-24">
                    <Label htmlFor="duration">Seconds</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newExerciseDuration}
                      onChange={(e) => setNewExerciseDuration(Number(e.target.value))}
                      min={5}
                      max={300}
                      step={5}
                      className="border-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <Button
                    onClick={handleAddCustomExercise}
                    disabled={!newExerciseName}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-6">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {completedExercises.length > 0 ? (
                    completedExercises.map((exercise, index) => (
                      <div key={exercise.id} className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-green-500 text-muted flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <Label className="text-green-700 font-medium">{exercise.exercise_name}</Label>
                            <div className="text-sm text-green-600">
                              {formatTime(exercise.duration)} • {format(parseISO(exercise.created_at), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            ✓ Completed
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCompletedExercise(exercise.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No exercises completed today</p>
                      <p className="text-sm">Start your first workout to see your progress here!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
