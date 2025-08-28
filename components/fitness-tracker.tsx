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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="sr-only">Loading fitness data...</span>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 overflow-auto">
            <div className="w-full space-y-6">
                {/* Header Dashboard */}
                <Card className={`bg-gradient-to-r ${currentCategoryConfig.gradient} ${currentCategoryConfig.borderColor} shadow-lg`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <Sparkles className={`h-6 w-6 ${currentCategoryConfig.accentColor}`} />
                                    Fitness & Training Dashboard
                                </CardTitle>
                                <CardDescription className="text-lg">Transform your body with structured workouts</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${currentCategoryConfig.accentColor}`}>{streak}</div>
                                    <div className="text-sm text-muted-foreground">Day Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${currentCategoryConfig.accentColor}`}>{totalSessions}</div>
                                    <div className="text-sm text-muted-foreground">Sessions</div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-1">
                                        <Trophy className="h-4 w-4" />
                                        Workouts
                                    </span>
                                    <span className="text-muted-foreground">{totalWorkouts}</span>
                                </div>
                                <Progress value={Math.min(totalWorkouts * 20, 100)} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-1">
                                        <Target className="h-4 w-4" />
                                        Available Exercises
                                    </span>
                                    <span className="text-muted-foreground">{totalExercises}</span>
                                </div>
                                <Progress value={Math.min(totalExercises * 5, 100)} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Completed Today
                                    </span>
                                    <span className="text-muted-foreground">{completedToday}</span>
                                </div>
                                <Progress value={Math.min(completedToday * 10, 100)} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-1">
                                        <Heart className="h-4 w-4" />
                                        Fitness Score
                                    </span>
                                    <span className="text-muted-foreground">{Math.min(78 + completedToday * 2, 100)}%</span>
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

                <div className="grid gap-6 lg:grid-cols-3 w-full ">
                    {/* Workout Routines */}
                    <Card className={`lg:col-span-2 bg-gradient-to-br ${currentCategoryConfig.gradient} ${currentCategoryConfig.borderColor} shadow-lg`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Dumbbell className={`h-5 w-5 ${currentCategoryConfig.accentColor}`} />
                                Workout Routines
                            </CardTitle>
                            <CardDescription>Choose your workout and start training</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                                    <span className="font-medium">Workout Progress</span>
                                                    <span className="text-muted-foreground">{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-3 rounded-full" />
                                            </div>

                                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                                {workout.exercises.map((exercise, index) => {
                                                    const isCompleted = completedExercises.some(completed => 
                                                        completed.exercise_name === exercise.name
                                                    )
                                                    
                                                    return (
                                                        <div 
                                                            key={exercise.id} 
                                                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                                                                isCompleted 
                                                                    ? 'bg-green-50 border-green-200' 
                                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
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
                                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
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
                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
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
                                            className="h-full w-full rounded-full overflow-hidden border-8 border-purple-100 shadow-lg"
                                            style={{
                                                background: activeExercise 
                                                    ? `conic-gradient(from 0deg, #8b5cf6 0deg, #a855f7 ${((activeExercise.duration - timeLeft) / activeExercise.duration) * 360}deg, #f3e8ff ${((activeExercise.duration - timeLeft) / activeExercise.duration) * 360}deg, #f3e8ff 360deg)`
                                                    : '#f3e8ff',
                                            }}
                                        />
                                    </div>
                                    {/* Inner circle */}
                                    <div className="relative flex flex-col items-center justify-center rounded-full bg-white h-40 w-40 shadow-xl border-4 border-purple-100">
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
                                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6"
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            Start
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={handlePauseExercise} 
                                            variant="outline"
                                            className="border-purple-200 hover:bg-purple-50 rounded-full px-6"
                                        >
                                            <Pause className="mr-2 h-4 w-4" />
                                            Pause
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={handleResetExercise} 
                                        variant="outline" 
                                        disabled={!activeExercise}
                                        className="border-purple-200 hover:bg-purple-50 rounded-full px-6"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Today's Stats */}
                        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    Today&apos;s Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-100">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Exercises Completed
                                    </span>
                                    <span className="font-bold text-lg text-emerald-700">{completedToday}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-100">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Flame className="h-4 w-4 text-orange-500" />
                                        Calories Burned
                                    </span>
                                    <span className="font-bold text-lg text-emerald-700">{completedToday * 15}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-100">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        Total Time
                                    </span>
                                    <span className="font-bold text-lg text-emerald-700">
                                        {formatTime(completedExercises.reduce((sum, ex) => sum + ex.duration, 0))}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Achievement Badge */}
                        {completedToday >= 5 && (
                            <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-yellow-200 shadow-lg">
                                <CardContent className="pt-6">
                                    <div className="text-center space-y-3">
                                        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                                            <Award className="h-8 w-8 text-yellow-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-yellow-800">Fitness Warrior!</h3>
                                            <p className="text-sm text-yellow-600">Outstanding workout today!</p>
                                        </div>
                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                            🏆 {completedToday} Exercises Completed
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Enhanced Exercise Log */}
                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-600" />
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
                                                className={`flex items-center justify-between rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-md ${
                                                    isCompleted 
                                                        ? 'bg-green-50 border-green-200' 
                                                        : 'bg-white border-gray-200 hover:border-indigo-300'
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
                                                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
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






// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Progress } from "@/components/ui/progress"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { 
//     Dumbbell, 
//     Play, 
//     Pause, 
//     RotateCcw, 
//     Plus, 
//     Target, 
//     Trophy, 
//     Zap, 
//     Clock, 
//     CheckCircle2, 
//     Activity, 
//     Flame,
//     Timer,
//     Heart,
//     Sparkles,
//     Award,
//     Calendar,
//     Loader2,
//     TrendingUp,
//     BarChart3,
//     Star
// } from "lucide-react"

// type Exercise = {
//     id: string
//     name: string
//     duration: number
//     completed: boolean
//     calories?: number
//     difficulty?: "easy" | "medium" | "hard"
// }

// type Workout = {
//     id: string
//     name: string
//     exercises: Exercise[]
//     category: "strength" | "cardio" | "core" | "flexibility"
//     difficulty: "beginner" | "intermediate" | "advanced"
//     description?: string
//     targetMuscles?: string[]
// }

// // Enhanced workout data with more comprehensive information
// const initialWorkouts: Workout[] = [
//     {
//         id: "1",
//         name: "Full Body Power",
//         category: "strength",
//         difficulty: "intermediate",
//         description: "Complete full-body workout targeting all major muscle groups",
//         targetMuscles: ["Chest", "Back", "Legs", "Core"],
//         exercises: [
//             { id: "1-1", name: "Push-ups", duration: 60, completed: false, calories: 8, difficulty: "medium" },
//             { id: "1-2", name: "Squats", duration: 60, completed: false, calories: 10, difficulty: "medium" },
//             { id: "1-3", name: "Plank Hold", duration: 45, completed: false, calories: 5, difficulty: "medium" },
//             { id: "1-4", name: "Lunges", duration: 60, completed: false, calories: 9, difficulty: "medium" },
//             { id: "1-5", name: "Mountain Climbers", duration: 45, completed: false, calories: 12, difficulty: "hard" },
//             { id: "1-6", name: "Burpees", duration: 30, completed: false, calories: 15, difficulty: "hard" },
//         ],
//     },
//     {
//         id: "2",
//         name: "Upper Body Blast",
//         category: "strength",
//         difficulty: "advanced",
//         description: "Intense upper body workout for strength and definition",
//         targetMuscles: ["Chest", "Shoulders", "Arms", "Back"],
//         exercises: [
//             { id: "2-1", name: "Diamond Push-ups", duration: 45, completed: false, calories: 10, difficulty: "hard" },
//             { id: "2-2", name: "Pike Push-ups", duration: 45, completed: false, calories: 8, difficulty: "medium" },
//             { id: "2-3", name: "Tricep Dips", duration: 60, completed: false, calories: 7, difficulty: "medium" },
//             { id: "2-4", name: "Arm Circles", duration: 30, completed: false, calories: 3, difficulty: "easy" },
//             { id: "2-5", name: "Wall Handstand", duration: 30, completed: false, calories: 6, difficulty: "hard" },
//         ],
//     },
//     {
//         id: "3",
//         name: "Core Crusher",
//         category: "core",
//         difficulty: "beginner",
//         description: "Build a strong core with targeted abdominal exercises",
//         targetMuscles: ["Abs", "Obliques", "Lower Back"],
//         exercises: [
//             { id: "3-1", name: "Crunches", duration: 60, completed: false, calories: 6, difficulty: "easy" },
//             { id: "3-2", name: "Russian Twists", duration: 45, completed: false, calories: 8, difficulty: "medium" },
//             { id: "3-3", name: "Leg Raises", duration: 45, completed: false, calories: 7, difficulty: "medium" },
//             { id: "3-4", name: "Side Planks", duration: 60, completed: false, calories: 5, difficulty: "medium" },
//             { id: "3-5", name: "Dead Bug", duration: 40, completed: false, calories: 4, difficulty: "easy" },
//         ],
//     },
//     {
//         id: "4",
//         name: "Cardio Burn",
//         category: "cardio",
//         difficulty: "intermediate",
//         description: "High-intensity cardio workout to boost metabolism",
//         targetMuscles: ["Full Body", "Cardiovascular"],
//         exercises: [
//             { id: "4-1", name: "Jumping Jacks", duration: 60, completed: false, calories: 12, difficulty: "medium" },
//             { id: "4-2", name: "High Knees", duration: 45, completed: false, calories: 10, difficulty: "medium" },
//             { id: "4-3", name: "Butt Kickers", duration: 45, completed: false, calories: 9, difficulty: "medium" },
//             { id: "4-4", name: "Sprint in Place", duration: 30, completed: false, calories: 15, difficulty: "hard" },
//         ],
//     },
// ]

// const categoryConfig = {
//     strength: { 
//         icon: Dumbbell, 
//         color: "bg-red-100 text-red-800 border-red-200", 
//         chartColor: "#ef4444",
//         gradient: "from-red-100 via-orange-50 to-pink-100",
//         borderColor: "border-red-200",
//         accentColor: "text-red-600",
//         bgGradient: "from-red-500 to-orange-500"
//     },
//     cardio: { 
//         icon: Activity, 
//         color: "bg-blue-100 text-blue-800 border-blue-200", 
//         chartColor: "#3b82f6",
//         gradient: "from-blue-100 via-cyan-50 to-sky-100",
//         borderColor: "border-blue-200",
//         accentColor: "text-blue-600",
//         bgGradient: "from-blue-500 to-cyan-500"
//     },
//     core: { 
//         icon: Target, 
//         color: "bg-green-100 text-green-800 border-green-200", 
//         chartColor: "#10b981",
//         gradient: "from-green-100 via-emerald-50 to-teal-100",
//         borderColor: "border-green-200",
//         accentColor: "text-green-600",
//         bgGradient: "from-green-500 to-emerald-500"
//     },
//     flexibility: { 
//         icon: Heart, 
//         color: "bg-purple-100 text-purple-800 border-purple-200", 
//         chartColor: "#8b5cf6",
//         gradient: "from-purple-100 via-pink-50 to-indigo-100",
//         borderColor: "border-purple-200",
//         accentColor: "text-purple-600",
//         bgGradient: "from-purple-500 to-pink-500"
//     }
// }

// const difficultyConfig = {
//     beginner: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Beginner" },
//     intermediate: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Intermediate" },
//     advanced: { color: "bg-red-100 text-red-800 border-red-200", label: "Advanced" }
// }

// const exerciseDifficultyConfig = {
//     easy: { color: "bg-green-100 text-green-700", label: "Easy" },
//     medium: { color: "bg-yellow-100 text-yellow-700", label: "Medium" },
//     hard: { color: "bg-red-100 text-red-700", label: "Hard" }
// }

// export function FitnessTracker() {
//     const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts)
//     const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
//     const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
//     const [timeLeft, setTimeLeft] = useState(0)
//     const [isActive, setIsActive] = useState(false)
//     const [newExerciseName, setNewExerciseName] = useState("")
//     const [newExerciseDuration, setNewExerciseDuration] = useState(30)
//     const [streak, setStreak] = useState(12)
//     const [totalSessions, setTotalSessions] = useState(47)
//     const [isLoading, setIsLoading] = useState(false)

//     useEffect(() => {
//         if (!isActive || !activeExercise) return

//         const timer = setInterval(() => {
//             setTimeLeft((prev) => {
//                 if (prev <= 1) {
//                     // Exercise completed
//                     setIsActive(false)

//                     // Mark exercise as completed
//                     if (selectedWorkout) {
//                         const updatedWorkouts = workouts.map((workout) => {
//                             if (workout.id === selectedWorkout.id) {
//                                 const updatedExercises = workout.exercises.map((exercise) => {
//                                     if (exercise.id === activeExercise.id) {
//                                         return { ...exercise, completed: true }
//                                     }
//                                     return exercise
//                                 })
//                                 return { ...workout, exercises: updatedExercises }
//                             }
//                             return workout
//                         })
//                         setWorkouts(updatedWorkouts)

//                         // Update selected workout
//                         const updatedWorkout = updatedWorkouts.find((w) => w.id === selectedWorkout.id)
//                         if (updatedWorkout) {
//                             setSelectedWorkout(updatedWorkout)
//                         }
//                     }

//                     return 0
//                 }
//                 return prev - 1
//             })
//         }, 1000)

//         return () => clearInterval(timer)
//     }, [isActive, activeExercise, selectedWorkout, workouts])

//     const handleSelectWorkout = (workout: Workout) => {
//         // Reset all exercises to not completed
//         const resetWorkout = {
//             ...workout,
//             exercises: workout.exercises.map((exercise) => ({
//                 ...exercise,
//                 completed: false,
//             })),
//         }

//         setSelectedWorkout(resetWorkout)
//         setActiveExercise(null)
//         setIsActive(false)
//     }

//     const handleStartExercise = (exercise: Exercise) => {
//         setActiveExercise(exercise)
//         setTimeLeft(exercise.duration)
//         setIsActive(true)
//     }

//     const handlePauseExercise = () => {
//         setIsActive(false)
//     }

//     const handleResetExercise = () => {
//         if (activeExercise) {
//             setTimeLeft(activeExercise.duration)
//             setIsActive(false)
//         }
//     }

//     const handleToggleComplete = (exerciseId: string, completed: boolean) => {
//         if (!selectedWorkout) return

//         const updatedWorkouts = workouts.map((workout) => {
//             if (workout.id === selectedWorkout.id) {
//                 const updatedExercises = workout.exercises.map((exercise) => {
//                     if (exercise.id === exerciseId) {
//                         return { ...exercise, completed }
//                     }
//                     return exercise
//                 })
//                 return { ...workout, exercises: updatedExercises }
//             }
//             return workout
//         })

//         setWorkouts(updatedWorkouts)

//         // Update selected workout
//         const updatedWorkout = updatedWorkouts.find((w) => w.id === selectedWorkout.id)
//         if (updatedWorkout) {
//             setSelectedWorkout(updatedWorkout)
//         }
//     }

//     const handleAddExercise = () => {
//         if (!selectedWorkout || !newExerciseName) return

//         const newExercise: Exercise = {
//             id: `${selectedWorkout.id}-${Date.now()}`,
//             name: newExerciseName,
//             duration: newExerciseDuration,
//             completed: false,
//             calories: Math.floor(newExerciseDuration / 10) + 3,
//             difficulty: "medium"
//         }

//         const updatedWorkouts = workouts.map((workout) => {
//             if (workout.id === selectedWorkout.id) {
//                 return {
//                     ...workout,
//                     exercises: [...workout.exercises, newExercise],
//                 }
//             }
//             return workout
//         })

//         setWorkouts(updatedWorkouts)

//         // Update selected workout
//         const updatedWorkout = updatedWorkouts.find((w) => w.id === selectedWorkout.id)
//         if (updatedWorkout) {
//             setSelectedWorkout(updatedWorkout)
//         }

//         // Reset form
//         setNewExerciseName("")
//         setNewExerciseDuration(30)
//     }

//     const calculateProgress = (workout: Workout) => {
//         if (workout.exercises.length === 0) return 0
//         const completed = workout.exercises.filter((e) => e.completed).length
//         return Math.round((completed / workout.exercises.length) * 100)
//     }

//     const getTotalDuration = (workout: Workout) => {
//         return workout.exercises.reduce((total, exercise) => total + exercise.duration, 0)
//     }

//     const getTotalCalories = (workout: Workout) => {
//         return workout.exercises.reduce((total, exercise) => total + (exercise.calories || 0), 0)
//     }

//     const formatTime = (seconds: number) => {
//         const mins = Math.floor(seconds / 60)
//         const secs = seconds % 60
//         return `${mins}:${secs.toString().padStart(2, '0')}`
//     }

//     // Calculate overall fitness stats
//     const totalWorkouts = workouts.length
//     const totalExercises = workouts.reduce((sum, workout) => sum + workout.exercises.length, 0)
//     const completedExercises = workouts.reduce((sum, workout) => 
//         sum + workout.exercises.filter(ex => ex.completed).length, 0
//     )
//     const totalCaloriesBurned = workouts.reduce((sum, workout) => 
//         sum + workout.exercises.filter(ex => ex.completed).reduce((exSum, ex) => exSum + (ex.calories || 0), 0), 0
//     )

//     const currentWorkoutCategory = selectedWorkout?.category || "strength"
//     const currentCategoryConfig = categoryConfig[currentWorkoutCategory]

//     const progressPercentage = activeExercise ? ((activeExercise.duration - timeLeft) / activeExercise.duration) * 100 : 0

//     if (isLoading) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
//                         <div className="absolute inset-0 h-12 w-12 rounded-full bg-purple-200/30 animate-ping mx-auto"></div>
//                     </div>
//                     <p className="text-lg font-medium text-purple-700">Loading your fitness routine...</p>
//                 </div>
//             </div>
//         )
//     }

//     return (
//         <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 overflow-auto">
//             {/* Background decorative elements */}
//             <div className="fixed inset-0 overflow-hidden pointer-events-none">
//                 <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-300/20 to-orange-300/20 rounded-full blur-3xl"></div>
//                 <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl"></div>
//                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-300/10 to-emerald-300/10 rounded-full blur-3xl"></div>
//             </div>

//             <div className="relative w-full max-w-none mx-auto space-y-6">
//                 {/* Header Dashboard */}
//                 <Card className={`bg-gradient-to-r ${currentCategoryConfig.gradient} ${currentCategoryConfig.borderColor} shadow-2xl border-0 backdrop-blur-md`}>
//                     <CardHeader>
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <CardTitle className="flex items-center gap-3 text-3xl font-bold">
//                                     <div className={`p-3 bg-gradient-to-br ${currentCategoryConfig.bgGradient} rounded-2xl shadow-lg`}>
//                                         <Sparkles className="h-8 w-8 text-white" />
//                                     </div>
//                                     Fitness & Training Dashboard
//                                 </CardTitle>
//                                 <CardDescription className="text-lg mt-2">Transform your body with structured workouts and achieve your fitness goals</CardDescription>
//                             </div>
//                             <div className="flex items-center gap-6">
//                                 <div className="text-center">
//                                     <div className={`text-3xl font-bold ${currentCategoryConfig.accentColor}`}>{streak}</div>
//                                     <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className={`text-3xl font-bold ${currentCategoryConfig.accentColor}`}>{totalSessions}</div>
//                                     <div className="text-sm text-muted-foreground font-medium">Sessions</div>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
//                             <div className="space-y-3">
//                                 <div className="flex justify-between text-sm">
//                                     <span className="font-semibold flex items-center gap-2">
//                                         <Trophy className="h-4 w-4 text-yellow-500" />
//                                         Workouts
//                                     </span>
//                                     <span className="text-muted-foreground font-medium">{totalWorkouts}</span>
//                                 </div>
//                                 <Progress value={Math.min(totalWorkouts * 20, 100)} className="h-3 rounded-full" />
//                             </div>
//                             <div className="space-y-3">
//                                 <div className="flex justify-between text-sm">
//                                     <span className="font-semibold flex items-center gap-2">
//                                         <Target className="h-4 w-4 text-blue-500" />
//                                         Exercises
//                                     </span>
//                                     <span className="text-muted-foreground font-medium">{completedExercises}/{totalExercises}</span>
//                                 </div>
//                                 <Progress value={totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0} className="h-3 rounded-full" />
//                             </div>
//                             <div className="space-y-3">
//                                 <div className="flex justify-between text-sm">
//                                     <span className="font-semibold flex items-center gap-2">
//                                         <Flame className="h-4 w-4 text-orange-500" />
//                                         Calories
//                                     </span>
//                                     <span className="text-muted-foreground font-medium">{totalCaloriesBurned}</span>
//                                 </div>
//                                 <Progress value={Math.min(totalCaloriesBurned / 10, 100)} className="h-3 rounded-full" />
//                             </div>
//                             <div className="space-y-3">
//                                 <div className="flex justify-between text-sm">
//                                     <span className="font-semibold flex items-center gap-2">
//                                         <Heart className="h-4 w-4 text-pink-500" />
//                                         Fitness Score
//                                     </span>
//                                     <span className="text-muted-foreground font-medium">92%</span>
//                                 </div>
//                                 <Progress value={92} className="h-3 rounded-full" />
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <div className="grid gap-6 lg:grid-cols-3">
//                     {/* Main Workout Timer Card */}
//                     <Card className={`lg:col-span-2 bg-gradient-to-br ${currentCategoryConfig.gradient} ${currentCategoryConfig.borderColor} shadow-2xl border-0 backdrop-blur-md`}>
//                         <CardHeader>
//                             <div className="flex items-start justify-between">
//                                 <div className="space-y-2">
//                                     <CardTitle className="flex items-center gap-3 text-2xl">
//                                         <div className={`p-2 bg-gradient-to-br ${currentCategoryConfig.bgGradient} rounded-xl shadow-lg`}>
//                                             <currentCategoryConfig.icon className="h-6 w-6 text-white" />
//                                         </div>
//                                         <div>
//                                             <div>{selectedWorkout?.name || "Select a Workout"}</div>
//                                             <div className="text-sm font-normal text-muted-foreground">
//                                                 {selectedWorkout?.description || "Choose a workout routine to get started"}
//                                             </div>
//                                         </div>
//                                     </CardTitle>
//                                 </div>
//                                 {selectedWorkout && (
//                                     <div className="flex gap-2">
//                                         <Badge variant="secondary" className={categoryConfig[selectedWorkout.category].color}>
//                                             {selectedWorkout.category}
//                                         </Badge>
//                                         <Badge variant="secondary" className={difficultyConfig[selectedWorkout.difficulty].color}>
//                                             {difficultyConfig[selectedWorkout.difficulty].label}
//                                         </Badge>
//                                     </div>
//                                 )}
//                             </div>
//                         </CardHeader>

//                         <CardContent className="space-y-6">
//                             {/* Workout Selection Tabs */}
//                             <Tabs defaultValue={workouts[0].id}>
//                                 <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm h-auto">
//                                     {workouts.map((workout) => {
//                                         const CategoryIcon = categoryConfig[workout.category].icon
//                                         return (
//                                             <TabsTrigger 
//                                                 key={workout.id} 
//                                                 value={workout.id} 
//                                                 onClick={() => handleSelectWorkout(workout)}
//                                                 className={`text-sm font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:${categoryConfig[workout.category].bgGradient} data-[state=active]:text-white flex flex-col gap-1`}
//                                             >
//                                                 <CategoryIcon className="h-4 w-4" />
//                                                 <span className="text-xs">{workout.name}</span>
//                                             </TabsTrigger>
//                                         )
//                                     })}
//                                 </TabsList>
//                             </Tabs>

//                             {/* Enhanced Timer Display */}
//                             {activeExercise ? (
//                                 <div className="flex flex-col items-center justify-center space-y-6">
//                                     <div className="relative flex h-64 w-64 items-center justify-center">
//                                         {/* Outer ring with gradient */}
//                                         <div className="absolute inset-0 flex items-center justify-center">
//                                             <div
//                                                 className="h-full w-full rounded-full overflow-hidden border-8 border-white/30 shadow-2xl"
//                                                 style={{
//                                                     background: `conic-gradient(from 0deg, ${currentCategoryConfig.chartColor} 0deg, ${currentCategoryConfig.chartColor} ${progressPercentage * 3.6}deg, #f1f5f9 ${progressPercentage * 3.6}deg, #f1f5f9 360deg)`,
//                                                 }}
//                                             />
//                                         </div>
//                                         {/* Inner circle with enhanced styling */}
//                                         <div className="relative flex flex-col items-center justify-center rounded-full bg-white h-52 w-52 shadow-2xl border-4 border-white/50">
//                                             <Timer className={`h-12 w-12 mb-3 ${currentCategoryConfig.accentColor}`} />
//                                             <span className={`text-4xl font-bold ${currentCategoryConfig.accentColor}`}>
//                                                 {formatTime(timeLeft)}
//                                             </span>
//                                             <span className="text-sm text-muted-foreground font-medium">
//                                                 {activeExercise.name}
//                                             </span>
//                                         </div>
//                                     </div>

//                                     {/* Enhanced Progress Bar */}
//                                     <div className="w-full max-w-md space-y-3">
//                                         <Progress value={progressPercentage} className="h-4 rounded-full shadow-inner" />
//                                         <div className="flex justify-between text-sm font-medium">
//                                             <span className="text-muted-foreground">Exercise Progress</span>
//                                             <span className={`${currentCategoryConfig.accentColor}`}>{Math.round(progressPercentage)}% complete</span>
//                                         </div>
//                                     </div>

//                                     {/* Exercise Info */}
//                                     <div className="text-center p-6 bg-white/60 rounded-2xl shadow-inner">
//                                         <h3 className="text-xl font-bold mb-2">{activeExercise.name}</h3>
//                                         <div className="flex justify-center gap-2 mb-4">
//                                             {activeExercise.difficulty && (
//                                                 <Badge className={exerciseDifficultyConfig[activeExercise.difficulty].color}>
//                                                     {exerciseDifficultyConfig[activeExercise.difficulty].label}
//                                                 </Badge>
//                                             )}
//                                             {activeExercise.calories && (
//                                                 <Badge variant="outline" className="bg-white/80">
//                                                     {activeExercise.calories} cal
//                                                 </Badge>
//                                             )}
//                                         </div>
//                                         <div className="flex justify-center gap-4">
//                                             {!isActive ? (
//                                                 <Button
//                                                     onClick={() => setIsActive(true)}
//                                                     size="lg"
//                                                     className={`px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r ${currentCategoryConfig.bgGradient} text-white`}
//                                                 >
//                                                     <Play className="mr-2 h-5 w-5" />
//                                                     Resume
//                                                 </Button>
//                                             ) : (
//                                                 <Button
//                                                     onClick={handlePauseExercise}
//                                                     variant="outline"
//                                                     size="lg"
//                                                     className="px-8 py-3 text-lg font-semibold bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2"
//                                                 >
//                                                     <Pause className="mr-2 h-5 w-5" />
//                                                     Pause
//                                                 </Button>
//                                             )}
//                                             <Button
//                                                 variant="outline"
//                                                 onClick={handleResetExercise}
//                                                 className="bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2"
//                                             >
//                                                 <RotateCcw className="mr-2 h-4 w-4" />
//                                                 Reset
//                                             </Button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             ) : (
//                                 <div className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50">
//                                     <div className={`p-4 bg-gradient-to-br ${currentCategoryConfig.bgGradient} rounded-2xl shadow-lg w-fit mx-auto mb-4`}>
//                                         <currentCategoryConfig.icon className="h-12 w-12 text-white" />
//                                     </div>
//                                     <h3 className="text-xl font-bold mb-2">Ready to Start Training?</h3>
//                                     <p className="text-muted-foreground mb-4">Select an exercise from your workout to begin</p>
//                                 </div>
//                             )}

//                             {/* Exercise List */}
//                             {selectedWorkout && (
//                                 <div className="space-y-4">
//                                     <div className="flex items-center justify-between">
//                                         <h3 className="text-lg font-semibold">Exercises</h3>
//                                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                                             <Clock className="h-4 w-4" />
//                                             {formatTime(getTotalDuration(selectedWorkout))} total
//                                             <Flame className="h-4 w-4 ml-2" />
//                                             {getTotalCalories(selectedWorkout)} cal
//                                         </div>
//                                     </div>
//                                     <div className="space-y-3 max-h-[400px] overflow-y-auto">
//                                         {selectedWorkout.exercises.map((exercise, index) => (
//                                             <div
//                                                 key={exercise.id}
//                                                 className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
//                                                     exercise.completed
//                                                         ? "border-green-200 bg-green-50/80 shadow-md backdrop-blur-sm"
//                                                         : activeExercise?.id === exercise.id
//                                                         ? `${currentCategoryConfig.borderColor} bg-gradient-to-r ${currentCategoryConfig.gradient} shadow-lg`
//                                                         : "border-gray-200 bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:shadow-md"
//                                                 }`}
//                                                 onClick={() => !exercise.completed && handleStartExercise(exercise)}
//                                             >
//                                                 <div className="flex items-center justify-between">
//                                                     <div className="flex items-center gap-3">
//                                                         <div className="flex items-center gap-2">
//                                                             <Checkbox
//                                                                 checked={exercise.completed}
//                                                                 onCheckedChange={(checked) =>
//                                                                     handleToggleComplete(exercise.id, checked as boolean)
//                                                                 }
//                                                             />
//                                                             <span className="font-semibold">{exercise.name}</span>
//                                                         </div>
//                                                         <div className="flex gap-1">
//                                                             <Badge variant="outline" className="text-xs bg-white/80">
//                                                                 {formatTime(exercise.duration)}
//                                                             </Badge>
//                                                             {exercise.calories && (
//                                                                 <Badge variant="outline" className="text-xs bg-white/80">
//                                                                     {exercise.calories} cal
//                                                                 </Badge>
//                                                             )}
//                                                         </div>
//                                                     </div>
//                                                     <div className="flex items-center gap-2">
//                                                         {activeExercise?.id === exercise.id && (
//                                                             <div className="flex items-center gap-2 text-sm font-medium">
//                                                                 <Timer className="h-4 w-4" />
//                                                                 {formatTime(timeLeft)}
//                                                             </div>
//                                                         )}
//                                                         {exercise.completed ? (
//                                                             <CheckCircle2 className="h-5 w-5 text-green-600" />
//                                                         ) : (
//                                                             <Button
//                                                                 size="sm"
//                                                                 variant={activeExercise?.id === exercise.id ? "secondary" : "outline"}
//                                                                 onClick={(e) => {
//                                                                     e.stopPropagation()
//                                                                     handleStartExercise(exercise)
//                                                                 }}
//                                                                 className="bg-white/80 hover:bg-white"
//                                                             >
//                                                                 <Play className="h-3 w-3" />
//                                                             </Button>
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>

//                     {/* Enhanced Sidebar */}
//                     <div className="space-y-6">
//                         {/* Workout Stats */}
//                         <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-2xl border-0 backdrop-blur-md">
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2 text-lg">
//                                     <BarChart3 className="h-5 w-5 text-emerald-600" />
//                                     Workout Stats
//                                     <Sparkles className="h-5 w-5 text-teal-500" />
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="flex items-center justify-between p-3 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-100">
//                                     <span className="text-sm text-muted-foreground flex items-center gap-2">
//                                         <Zap className="h-4 w-4 text-orange-500" />
//                                         Current Streak
//                                     </span>
//                                     <div className="flex items-center gap-1">
//                                         <span className="font-bold text-lg text-emerald-700">{streak}</span>
//                                         <span className="text-sm text-muted-foreground">days</span>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center justify-between p-3 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-100">
//                                     <span className="text-sm text-muted-foreground flex items-center gap-2">
//                                         <Calendar className="h-4 w-4 text-blue-500" />
//                                         Total Sessions
//                                     </span>
//                                     <span className="font-bold text-lg text-emerald-700">{totalSessions}</span>
//                                 </div>
//                                 <div className="flex items-center justify-between p-3 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-100">
//                                     <span className="text-sm text-muted-foreground flex items-center gap-2">
//                                         <Flame className="h-4 w-4 text-red-500" />
//                                         Calories Burned
//                                     </span>
//                                     <span className="font-bold text-lg text-emerald-700">{totalCaloriesBurned}</span>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {/* Achievement Badge */}
//                         <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-2xl border-0 backdrop-blur-md">
//                             <CardContent className="p-6 text-center">
//                                 <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
//                                 <h3 className="font-bold text-xl text-yellow-800 mb-2">Fitness Champion</h3>
//                                 <p className="text-sm text-yellow-700 mb-4">
//                                     You're crushing your fitness goals! Keep up the amazing work and stay consistent.
//                                 </p>
//                                 <Badge className="bg-yellow-500 text-white text-sm px-4 py-2">
//                                     {streak} Day Streak 🔥
//                                 </Badge>
//                             </CardContent>
//                         </Card>

//                         {/* Add Exercise Form */}
//                         {selectedWorkout && (
//                             <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-2xl border-0 backdrop-blur-md">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2 text-lg">
//                                         <Plus className="h-5 w-5 text-blue-600" />
//                                         Add Exercise
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="space-y-4">
//                                     <div className="space-y-2">
//                                         <Label htmlFor="exercise-name">Exercise Name</Label>
//                                         <Input
//                                             id="exercise-name"
//                                             value={newExerciseName}
//                                             onChange={(e) => setNewExerciseName(e.target.value)}
//                                             placeholder="Enter exercise name"
//                                             className="bg-white/80 backdrop-blur-sm border-blue-200"
//                                         />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label htmlFor="exercise-duration">Duration (seconds)</Label>
//                                         <Input
//                                             id="exercise-duration"
//                                             type="number"
//                                             value={newExerciseDuration}
//                                             onChange={(e) => setNewExerciseDuration(Number(e.target.value))}
//                                             min="10"
//                                             max="300"
//                                             className="bg-white/80 backdrop-blur-sm border-blue-200"
//                                         />
//                                     </div>
//                                     <Button 
//                                         onClick={handleAddExercise} 
//                                         className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
//                                         disabled={!newExerciseName}
//                                     >
//                                         <Plus className="mr-2 h-4 w-4" />
//                                         Add Exercise
//                                     </Button>
//                                 </CardContent>
//                             </Card>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }




// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Progress } from "@/components/ui/progress"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { 
//     Dumbbell, 
//     Play, 
//     Pause, 
//     RotateCcw, 
//     Plus, 
//     Target, 
//     Trophy, 
//     Zap, 
//     Clock, 
//     CheckCircle2, 
//     Activity, 
//     Flame,
//     Timer,
//     Heart,
//     Sparkles,
//     Award,
//     Calendar,
//     Loader2,
//     X
// } from "lucide-react"
// import { supabase, type ExerciseEntry } from "@/lib/supabase"
// import { useAuth } from "@/components/auth/auth-provider"
// import { format, parseISO } from "date-fns"

// type Exercise = {
//     id: string
//     name: string
//     duration: number
//     completed: boolean
// }

// type Workout = {
//     id: string
//     name: string
//     exercises: Exercise[]
//     category: "strength" | "cardio" | "core"
//     difficulty: "beginner" | "intermediate" | "advanced"
// }

// // Enhanced workout data with categories and difficulties
// const initialWorkouts: Workout[] = [
//     {
//         id: "1",
//         name: "Full Body Workout",
//         category: "strength",
//         difficulty: "intermediate",
//         exercises: [
//             { id: "1-1", name: "Push-ups", duration: 60, completed: false },
//             { id: "1-2", name: "Squats", duration: 60, completed: false },
//             { id: "1-3", name: "Plank", duration: 30, completed: false },
//             { id: "1-4", name: "Lunges", duration: 60, completed: false },
//             { id: "1-5", name: "Mountain Climbers", duration: 45, completed: false },
//         ],
//     },
//     {
//         id: "2",
//         name: "Upper Body Focus",
//         category: "strength",
//         difficulty: "advanced",
//         exercises: [
//             { id: "2-1", name: "Bicep Curls", duration: 45, completed: false },
//             { id: "2-2", name: "Tricep Dips", duration: 45, completed: false },
//             { id: "2-3", name: "Shoulder Press", duration: 60, completed: false },
//             { id: "2-4", name: "Pull-ups", duration: 30, completed: false },
//         ],
//     },
//     {
//         id: "3",
//         name: "Core Strength",
//         category: "core",
//         difficulty: "beginner",
//         exercises: [
//             { id: "3-1", name: "Crunches", duration: 60, completed: false },
//             { id: "3-2", name: "Russian Twists", duration: 45, completed: false },
//             { id: "3-3", name: "Leg Raises", duration: 45, completed: false },
//             { id: "3-4", name: "Side Planks", duration: 30, completed: false },
//         ],
//     },
//     {
//         id: "4",
//         name: "Cardio Blast",
//         category: "cardio",
//         difficulty: "intermediate",
//         exercises: [
//             { id: "4-1", name: "Jumping Jacks", duration: 45, completed: false },
//             { id: "4-2", name: "High Knees", duration: 30, completed: false },
//             { id: "4-3", name: "Burpees", duration: 60, completed: false },
//             { id: "4-4", name: "Sprint in Place", duration: 30, completed: false },
//         ],
//     },
// ]

// const categoryConfig = {
//     strength: { 
//         icon: Dumbbell, 
//         color: "bg-red-100 text-red-800 border-red-200", 
//         chartColor: "#ef4444",
//         gradient: "from-red-100 via-orange-50 to-pink-100",
//         borderColor: "border-red-200",
//         accentColor: "text-red-600"
//     },
//     cardio: { 
//         icon: Activity, 
//         color: "bg-blue-100 text-blue-800 border-blue-200", 
//         chartColor: "#3b82f6",
//         gradient: "from-blue-100 via-cyan-50 to-sky-100",
//         borderColor: "border-blue-200",
//         accentColor: "text-blue-600"
//     },
//     core: { 
//         icon: Target, 
//         color: "bg-green-100 text-green-800 border-green-200", 
//         chartColor: "#10b981",
//         gradient: "from-green-100 via-emerald-50 to-teal-100",
//         borderColor: "border-green-200",
//         accentColor: "text-green-600"
//     }
// }

// const difficultyConfig = {
//     beginner: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Beginner" },
//     intermediate: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Intermediate" },
//     advanced: { color: "bg-red-100 text-red-800 border-red-200", label: "Advanced" }
// }

// export function FitnessTracker() {
//     const { user, isLoading: isAuthLoading } = useAuth()
//     const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts)
//     const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
//     const [completedExercises, setCompletedExercises] = useState<ExerciseEntry[]>([])
//     const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
//     const [timeLeft, setTimeLeft] = useState(0)
//     const [isActive, setIsActive] = useState(false)
//     const [newExerciseName, setNewExerciseName] = useState("")
//     const [newExerciseDuration, setNewExerciseDuration] = useState(30)
//     const [streak, setStreak] = useState(5)
//     const [totalSessions, setTotalSessions] = useState(18)
//     const [isLoading, setIsLoading] = useState(true)

//     useEffect(() => {
//         if (isAuthLoading || !user) {
//             setIsLoading(true)
//             return
//         }

//         const fetchCompletedExercises = async () => {
//             setIsLoading(true)
//             const today = format(new Date(), "yyyy-MM-dd")
//             const { data, error } = await supabase
//                 .from("exercise_entries")
//                 .select("*")
//                 .eq("user_id", user.id)
//                 .eq("date", today)
//                 .order("created_at", { ascending: true })

//             if (error) {
//                 console.error("Error fetching completed exercises:", error)
//             } else {
//                 setCompletedExercises(data)
//             }
//             setIsLoading(false)
//         }

//         const exerciseChannel = supabase
//             .channel("completed_exercise_changes")
//             .on(
//                 "postgres_changes",
//                 {
//                     event: "*",
//                     schema: "public",
//                     table: "entries_entries",
//                     filter: `user_id=eq.${user.id}`,
//                 },
//                 (payload) => {
//                     const newEntry = payload.new as CompletedExercise | null
//                     const oldEntry = payload.old as CompletedExercise | null
//                     const today = format(new Date(), "yyyy-MM-dd")

//                     setCompletedExercises((prev) => {
//                         let updatedExercises = [...prev]
//                         if (payload.eventType === "INSERT") {
//                             if (newEntry && format(parseISO(newEntry.date), "yyyy-MM-dd") === today) {
//                                 updatedExercises = [...updatedExercises, newEntry]
//                             }
//                         } else if (payload.eventType === "UPDATE") {
//                             if (newEntry && format(parseISO(newEntry.date), "yyyy-MM-dd") === today) {
//                                 updatedExercises = updatedExercises.map((ex) => (ex.id === newEntry.id ? newEntry : ex))
//                             }
//                         } else if (payload.eventType === "DELETE") {
//                             if (oldEntry) {
//                                 updatedExercises = updatedExercises.filter((ex) => ex.id !== oldEntry.id)
//                             }
//                         }
//                         return updatedExercises.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
//                     })
//                 },
//             )
//             .subscribe()

//         fetchCompletedExercises()

//         return () => {
//             supabase.removeChannel(exerciseChannel)
//         }
//     }, [user, isAuthLoading])

//     useEffect(() => {
//         if (!isActive || !activeExercise) return

//         const timer = setInterval(() => {
//             setTimeLeft((prev) => {
//                 if (prev <= 1) {
//                     // Exercise completed
//                     setIsActive(false)

//                     // Mark exercise as completed in local state
//                     if (selectedWorkout) {
//                         const updatedWorkouts = workouts.map((workout) => {
//                             if (workout.id === selectedWorkout.id) {
//                                 const updatedExercises = workout.exercises.map((exercise) => {
//                                     if (exercise.id === activeExercise.id) {
//                                         return { ...exercise, completed: true }
//                                     }
//                                     return exercise
//                                 })
//                                 return { ...workout, exercises: updatedExercises }
//                             }
//                             return workout
//                         })
//                         setWorkouts(updatedWorkouts)

//                         // Update selected workout
//                         const updatedWorkout = updatedWorkouts.find((w) => w.id === selectedWorkout.id)
//                         if (updatedWorkout) {
//                             setSelectedWorkout(updatedWorkout)
//                         }
//                     }

//                     // Add to database
//                     if (activeExercise) {
//                         handleAddCompletedExercise(activeExercise.name, activeExercise.duration)
//                     }

//                     return 0
//                 }
//                 return prev - 1
//             })
//         }, 1000)

//         return () => clearInterval(timer)
//     }, [isActive, activeExercise, selectedWorkout, workouts])

//     const handleSelectWorkout = (workout: Workout) => {
//         // Reset all exercises to not completed
//         const resetWorkout = {
//             ...workout,
//             exercises: workout.exercises.map((exercise) => ({
//                 ...exercise,
//                 completed: false,
//             })),
//         }

//         setSelectedWorkout(resetWorkout)
//         setActiveExercise(null)
//         setIsActive(false)
//     }

//     const handleStartExercise = (exercise: Exercise) => {
//         setActiveExercise(exercise)
//         setTimeLeft(exercise.duration)
//         setIsActive(true)
//     }

//     const handlePauseExercise = () => {
//         setIsActive(false)
//     }

//     const handleResetExercise = () => {
//         if (activeExercise) {
//             setTimeLeft(activeExercise.duration)
//             setIsActive(false)
//         }
//     }

//     const handleToggleComplete = (exerciseId: string, completed: boolean) => {
//         if (!selectedWorkout) return

//         const updatedWorkouts = workouts.map((workout) => {
//             if (workout.id === selectedWorkout.id) {
//                 const updatedExercises = workout.exercises.map((exercise) => {
//                     if (exercise.id === exerciseId) {
//                         return { ...exercise, completed }
//                     }
//                     return exercise
//                 })
//                 return { ...workout, exercises: updatedExercises }
//             }
//             return workout
//         })

//         setWorkouts(updatedWorkouts)

//         // Update selected workout
//         const updatedWorkout = updatedWorkouts.find((w) => w.id === selectedWorkout.id)
//         if (updatedWorkout) {
//             setSelectedWorkout(updatedWorkout)
//         }
//     }

//     const handleAddExercise = () => {
//         if (!selectedWorkout || !newExerciseName) return

//         const newExercise: Exercise = {
//             id: `${selectedWorkout.id}-${Date.now()}`,
//             name: newExerciseName,
//             duration: newExerciseDuration,
//             completed: false,
//         }

//         const updatedWorkouts = workouts.map((workout) => {
//             if (workout.id === selectedWorkout.id) {
//                 return {
//                     ...workout,
//                     exercises: [...workout.exercises, newExercise],
//                 }
//             }
//             return workout
//         })

//         setWorkouts(updatedWorkouts)

//         // Update selected workout
//         const updatedWorkout = updatedWorkouts.find((w) => w.id === selectedWorkout.id)
//         if (updatedWorkout) {
//             setSelectedWorkout(updatedWorkout)
//         }

//         // Reset form
//         setNewExerciseName("")
//         setNewExerciseDuration(30)
//     }

//     const handleAddCompletedExercise = async (name: string, duration: number) => {
//         if (!user) return

//         const today = format(new Date(), "yyyy-MM-dd")
//         const { error } = await supabase.from("completed_exercises").insert({
//             user_id: user.id,
//             exercise_name: name,
//             duration: duration,
//             date: today,
//         })

//         if (error) {
//             console.error("Error adding completed exercise:", error)
//         }
//     }

//     const handleDeleteCompletedExercise = async (id: string) => {
//         setIsLoading(true)
//         const { error } = await supabase.from("exercise_entries").delete().eq("id", id)
//         if (error) {
//             console.error("Error deleting completed exercise:", error)
//         }
//         setIsLoading(false)
//     }

//     const handleAddCustomExercise = async () => {
//         if (!user || !newExerciseName) return

//         await handleAddCompletedExercise(newExerciseName, newExerciseDuration)

//         // Reset form
//         setNewExerciseName("")
//         setNewExerciseDuration(30)
//     }

//     const calculateProgress = (workout: Workout) => {
//         if (workout.exercises.length === 0) return 0
//         const completed = workout.exercises.filter((e) => e.completed).length
//         return Math.round((completed / workout.exercises.length) * 100)
//     }

//     const getTotalDuration = (workout: Workout) => {
//         return workout.exercises.reduce((total, exercise) => total + exercise.duration, 0)
//     }

//     const formatTime = (seconds: number) => {
//         const mins = Math.floor(seconds / 60)
//         const secs = seconds % 60
//         return `${mins}:${secs.toString().padStart(2, '0')}`
//     }

//     // Calculate overall fitness stats
//     const totalWorkouts = workouts.length
//     const totalExercises = workouts.reduce((sum, workout) => sum + workout.exercises.length, 0)
//     const completedWorkoutExercises = workouts.reduce((sum, workout) => 
//         sum + workout.exercises.filter(ex => ex.completed).length, 0
//     )

//     const currentWorkoutCategory = selectedWorkout?.category || "strength"
//     const currentCategoryConfig = categoryConfig[currentWorkoutCategory]

//     if (isLoading) {
//         return (
//             <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
//                 <div className="flex flex-col items-center space-y-4">
//                     <div className="relative">
//                         <Loader2 className="h-12 w-12 animate-spin text-red-600" />
//                         <Sparkles className="h-6 w-6 text-red-400 absolute -top-2 -right-2 animate-pulse" />
//                     </div>
//                     <span className="text-red-700 font-medium">Loading your fitness data...</span>
//                 </div>
//             </div>
//         )
//     }

//     return (
//         <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 overflow-auto">
//             <div className="w-full max-w-none mx-auto space-y-8">
//                 {/* Enhanced Header Dashboard */}
//                 <Card className={`bg-gradient-to-r ${currentCategoryConfig.gradient} ${currentCategoryConfig.borderColor} shadow-2xl backdrop-blur-sm`}>
//                     <CardHeader>
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <CardTitle className="flex items-center gap-3 text-3xl">
//                                     <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
//                                         <Sparkles className="h-8 w-8 text-white" />
//                                     </div>
//                                     <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
//                                         Fitness & Training Dashboard
//                                     </span>
//                                 </CardTitle>
//                                 <CardDescription className="text-lg mt-2">Transform your body with structured workouts and achieve your fitness goals</CardDescription>
//                             </div>
//                             <div className="flex items-center gap-6">
//                                 <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-red-100 shadow-md">
//                                     <div className={`text-3xl font-bold ${currentCategoryConfig.accentColor}`}>{streak}</div>
//                                     <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
//                                 </div>
//                                 <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-red-100 shadow-md">
//                                     <div className={`text-3xl font-bold ${currentCategoryConfig.accentColor}`}>{totalSessions}</div>
//                                     <div className="text-sm text-muted-foreground font-medium">Sessions</div>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
//                             <div className="space-y-3 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-red-100 shadow-md">
//                                 <div className="flex justify-between text-sm">
//                                     <span className="font-medium flex items-center gap-2">
//                                         <Trophy className="h-4 w-4 text-red-600" />
//                                         Workouts
//                                     </span>
//                                     <Badge variant="secondary" className="bg-red-100 text-red-800">
//                                         {totalWorkouts}
//                                     </Badge>
//                                 </div>
//                                 <Progress value={Math.min(totalWorkouts * 20, 100)} className="h-3 rounded-full" />
//                                 <p className="text-xs text-muted-foreground">Available routines</p>
//                             </div>
//                             <div className="space-y-3 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-orange-100 shadow-md">
//                                 <div className="flex justify-between text-sm">
//                                     <span className="font-medium flex items-center gap-2">
//                                         <Target className="h-4 w-4 text-orange-600" />
//                                         Exercises
//                                     </span>
//                                     <Badge variant="secondary" className="bg-orange-100 text-orange-800">
//                                         {totalExercises}
//                                     </Badge>
//                                 </div>
//                                 <Progress value={Math.min(totalExercises * 5, 100)} className="h-3 rounded-full" />
//                                 <p className="text-xs text-muted-foreground">Total exercises</p>
//                             </div>
//                             <div className="space-y-3 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-green-100 shadow-md">
//                                 <div className="flex justify-between text-sm">
//                                     <span className="font-medium flex items-center gap-2">
//                                         <CheckCircle2 className="h-4 w-4 text-green-600" />
//                                         Completed
//                                     </span>
//                                     <Badge variant="secondary" className="bg-green-100 text-green-800">
//                                         {completedExercises.length}
//                                     </Badge>
//                                 </div>
//                                 <Progress value={completedExercises.length * 10} className="h-3 rounded-full" />
//                                 <p className="text-xs text-muted-foreground">Today's exercises</p>
//                             </div>
//                             <div className="space-y-3 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-100 shadow-md">
//                                 <div className="flex justify-between text-sm">
//                                     <span className="font-medium flex items-center gap-2">
//                                         <Heart className="h-4 w-4 text-blue-600" />
//                                         Fitness Score
//                                     </span>
//                                     <Badge variant="secondary" className="bg-blue-100 text-blue-800">
//                                         78%
//                                     </Badge>
//                                 </div>
//                                 <Progress value={78} className="h-3 rounded-full" />
//                                 <p className="text-xs text-muted-foreground">Overall performance</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <div className="grid gap-8 lg:grid-cols-2">
//                     {/* Enhanced Workout Routines */}
//                     <Card className={`bg-gradient-to-br ${currentCategoryConfig.gradient} ${currentCategoryConfig.borderColor} shadow-2xl backdrop-blur-sm`}>
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-3 text-2xl">
//                                 <div className="p-2 rounded-full bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
//                                     <Dumbbell className="h-6 w-6 text-white" />
//                                 </div>
//                                 Workout Routines
//                             </CardTitle>
//                             <CardDescription className="text-base">Choose your workout and start training</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-4">
//                                 {workouts.map((workout) => {
//                                     const CategoryIcon = categoryConfig[workout.category].icon
//                                     const progress = calculateProgress(workout)
//                                     const totalDuration = getTotalDuration(workout)
                                    
//                                     return (
//                                         <div
//                                             key={workout.id}
//                                             className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
//                                                 selectedWorkout?.id === workout.id
//                                                     ? `${categoryConfig[workout.category].color} border-current shadow-md`
//                                                     : "bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white"
//                                             }`}
//                                             onClick={() => handleSelectWorkout(workout)}
//                                         >
//                                             <div className="flex items-center justify-between mb-3">
//                                                 <div className="flex items-center gap-3">
//                                                     <CategoryIcon className={`h-6 w-6 ${categoryConfig[workout.category].accentColor}`} />
//                                                     <div>
//                                                         <h3 className="font-semibold text-lg">{workout.name}</h3>
//                                                         <p className="text-sm text-muted-foreground">{workout.exercises.length} exercises</p>
//                                                     </div>
//                                                 </div>
//                                                 <div className="flex items-center gap-2">
//                                                     <Badge variant="outline" className={categoryConfig[workout.category].color}>
//                                                         {workout.category}
//                                                     </Badge>
//                                                     <Badge variant="outline" className={difficultyConfig[workout.difficulty].color}>
//                                                         {difficultyConfig[workout.difficulty].label}
//                                                     </Badge>
//                                                 </div>
//                                             </div>
                                            
//                                             <div className="space-y-2">
//                                                 <div className="flex justify-between text-sm">
//                                                     <span>Progress</span>
//                                                     <span>{progress}% • {formatTime(totalDuration)}</span>
//                                                 </div>
//                                                 <Progress value={progress} className="h-2" />
//                                             </div>
//                                         </div>
//                                     )
//                                 })}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Enhanced Exercise Timer */}
//                     <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-2xl">
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-3 text-2xl">
//                                 <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
//                                     <Timer className="h-6 w-6 text-white" />
//                                 </div>
//                                 Exercise Timer
//                             </CardTitle>
//                             <CardDescription className="text-base">
//                                 {activeExercise ? `Current exercise: ${activeExercise.name}` : "Select an exercise to start the timer"}
//                             </CardDescription>
//                         </CardHeader>
//                         <CardContent className="flex flex-col items-center justify-center space-y-8">
//                             {/* Enhanced Timer Display */}
//                             <div className="relative flex h-64 w-64 items-center justify-center">
//                                 <div
//                                     className="absolute inset-0 rounded-full border-8 border-slate-200"
//                                     style={{
//                                         background: `conic-gradient(${currentCategoryConfig.chartColor} ${
//                                             activeExercise ? ((activeExercise.duration - timeLeft) / activeExercise.duration) * 100 : 0
//                                         }%, transparent 0%)`,
//                                         transform: "rotate(-90deg)",
//                                     }}
//                                 />
//                                 <div className="absolute inset-4 rounded-full bg-white shadow-inner" />
//                                 <div className="relative flex flex-col items-center justify-center">
//                                     <div className="p-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-3">
//                                         <Dumbbell className={`h-12 w-12 ${currentCategoryConfig.accentColor}`} />
//                                     </div>
//                                     <div className="text-5xl font-bold text-slate-700">{timeLeft}</div>
//                                     <div className="text-lg text-muted-foreground font-medium">seconds</div>
//                                     {activeExercise && (
//                                         <div className="mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
//                                             {activeExercise.name}
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Enhanced Control Buttons */}
//                             <div className="flex space-x-6">
//                                 {!isActive ? (
//                                     <Button 
//                                         onClick={() => activeExercise && handleStartExercise(activeExercise)} 
//                                         disabled={!activeExercise}
//                                         className="px-8 h-14 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-full shadow-lg"
//                                     >
//                                         <Play className="mr-3 h-5 w-5" />
//                                         <span className="text-lg font-semibold">Start</span>
//                                     </Button>
//                                 ) : (
//                                     <Button 
//                                         onClick={handlePauseExercise} 
//                                         variant="outline"
//                                         className="px-8 h-14 border-2 border-orange-300 hover:bg-orange-50 rounded-full shadow-lg"
//                                     >
//                                         <Pause className="mr-3 h-5 w-5" />
//                                         <span className="text-lg font-semibold">Pause</span>
//                                     </Button>
//                                 )}
//                                 <Button 
//                                     onClick={handleResetExercise} 
//                                     variant="outline" 
//                                     disabled={!activeExercise}
//                                     className="px-8 h-14 border-2 border-slate-300 hover:bg-slate-50 rounded-full shadow-lg disabled:opacity-50"
//                                 >
//                                     <RotateCcw className="mr-3 h-5 w-5" />
//                                     <span className="text-lg font-semibold">Reset</span>
//                                 </Button>
//                             </div>
//                         </CardContent>
//                         <CardFooter className="flex justify-between bg-gradient-to-r from-slate-50 to-gray-50 rounded-b-2xl border-t border-slate-200">
//                             <div className="text-base text-muted-foreground font-medium">
//                                 Total completed today: {completedExercises.length} exercises
//                             </div>
//                         </CardFooter>
//                     </Card>
//                 </div>

//                 {/* Enhanced Exercise Management */}
//                 {selectedWorkout && (
//                     <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-xl">
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-2 text-2xl">
//                                 <Activity className="h-6 w-6 text-slate-600" />
//                                 {selectedWorkout.name} - Exercise List
//                             </CardTitle>
//                             <CardDescription className="text-base">
//                                 Track your progress through each exercise in this workout
//                             </CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <Tabs defaultValue="exercises">
//                                 <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
//                                     <TabsTrigger 
//                                         value="exercises" 
//                                         className="data-[state=active]:bg-white data-[state=active]:text-slate-800 rounded-lg"
//                                     >
//                                         Exercise List
//                                     </TabsTrigger>
//                                     <TabsTrigger 
//                                         value="completed" 
//                                         className="data-[state=active]:bg-white data-[state=active]:text-slate-800 rounded-lg"
//                                     >
//                                         Completed Today
//                                     </TabsTrigger>
//                                 </TabsList>

//                                 <TabsContent value="exercises" className="space-y-4 mt-6">
//                                     <div className="space-y-3 max-h-[400px] overflow-y-auto">
//                                         {selectedWorkout.exercises.map((exercise) => (
//                                             <div 
//                                                 key={exercise.id} 
//                                                 className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
//                                                     exercise.completed 
//                                                         ? "bg-green-50 border-green-200" 
//                                                         : "bg-white border-slate-200 hover:bg-slate-50"
//                                                 }`}
//                                             >
//                                                 <div className="flex items-center space-x-4">
//                                                     <Checkbox
//                                                         checked={exercise.completed}
//                                                         onCheckedChange={(checked) => 
//                                                             handleToggleComplete(exercise.id, checked as boolean)
//                                                         }
//                                                     />
//                                                     <Label 
//                                                         className={`font-medium text-lg cursor-pointer ${
//                                                             exercise.completed ? "line-through text-muted-foreground" : ""
//                                                         }`}
//                                                     >
//                                                         {exercise.name}
//                                                     </Label>
//                                                     {exercise.completed && (
//                                                         <CheckCircle2 className="h-5 w-5 text-green-600" />
//                                                     )}
//                                                 </div>
//                                                 <div className="flex items-center space-x-3">
//                                                     <span className="text-sm text-muted-foreground font-medium">
//                                                         {formatTime(exercise.duration)}
//                                                     </span>
//                                                     <Button
//                                                         variant="outline"
//                                                         size="sm"
//                                                         onClick={() => handleStartExercise(exercise)}
//                                                         disabled={isActive}
//                                                         className="hover:bg-blue-50 hover:border-blue-300"
//                                                     >
//                                                         <Play className="h-4 w-4" />
//                                                     </Button>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>

//                                     {/* Add Custom Exercise */}
//                                     <div className="flex items-end space-x-3 border-t pt-6">
//                                         <div className="grid flex-1 gap-2">
//                                             <Label htmlFor="exercise-name" className="font-medium">Custom Exercise</Label>
//                                             <Input
//                                                 id="exercise-name"
//                                                 value={newExerciseName}
//                                                 onChange={(e) => setNewExerciseName(e.target.value)}
//                                                 placeholder="Exercise name"
//                                                 className="bg-white border-slate-300"
//                                             />
//                                         </div>
//                                         <div className="grid gap-2 w-32">
//                                             <Label htmlFor="duration" className="font-medium">Duration (s)</Label>
//                                             <Input
//                                                 id="duration"
//                                                 type="number"
//                                                 value={newExerciseDuration}
//                                                 onChange={(e) => setNewExerciseDuration(Number(e.target.value))}
//                                                 min={5}
//                                                 max={300}
//                                                 step={5}
//                                                 className="bg-white border-slate-300"
//                                             />
//                                         </div>
//                                         <Button 
//                                             onClick={handleAddExercise} 
//                                             disabled={!newExerciseName}
//                                             className="h-10 px-6 bg-blue-600 hover:bg-blue-700"
//                                         >
//                                             <Plus className="h-4 w-4" />
//                                         </Button>
//                                     </div>
//                                 </TabsContent>

//                                 <TabsContent value="completed" className="space-y-4 mt-6">
//                                     <div className="space-y-3 max-h-[400px] overflow-y-auto">
//                                         {completedExercises.length > 0 ? (
//                                             completedExercises.map((exercise) => (
//                                                 <div key={exercise.id} className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
//                                                     <div className="flex items-center space-x-4">
//                                                         <CheckCircle2 className="h-5 w-5 text-green-600" />
//                                                         <div>
//                                                             <Label className="font-medium text-green-800">{exercise.exercise_name}</Label>
//                                                             <div className="text-sm text-green-600">{formatTime(exercise.duration)}</div>
//                                                         </div>
//                                                     </div>
//                                                     <Button 
//                                                         variant="ghost" 
//                                                         size="sm" 
//                                                         onClick={() => handleDeleteCompletedExercise(exercise.id)}
//                                                         className="hover:bg-red-100 hover:text-red-600"
//                                                     >
//                                                         <X className="h-4 w-4" />
//                                                     </Button>
//                                                 </div>
//                                             ))
//                                         ) : (
//                                             <div className="text-center text-muted-foreground py-12">
//                                                 <Activity className="h-16 w-16 mx-auto mb-4 text-slate-300" />
//                                                 <p className="text-lg">No exercises completed today.</p>
//                                                 <p className="text-sm">Start your first workout!</p>
//                                             </div>
//                                         )}
//                                     </div>

//                                     {/* Quick Add Custom Exercise */}
//                                     <div className="flex items-end space-x-3 border-t pt-6">
//                                         <div className="grid flex-1 gap-2">
//                                             <Label htmlFor="quick-exercise-name" className="font-medium">Quick Add Exercise</Label>
//                                             <Input
//                                                 id="quick-exercise-name"
//                                                 value={newExerciseName}
//                                                 onChange={(e) => setNewExerciseName(e.target.value)}
//                                                 placeholder="Exercise name"
//                                                 className="bg-white border-slate-300"
//                                             />
//                                         </div>
//                                         <div className="grid gap-2 w-32">
//                                             <Label htmlFor="quick-duration" className="font-medium">Duration (s)</Label>
//                                             <Input
//                                                 id="quick-duration"
//                                                 type="number"
//                                                 value={newExerciseDuration}
//                                                 onChange={(e) => setNewExerciseDuration(Number(e.target.value))}
//                                                 min={5}
//                                                 max={300}
//                                                 step={5}
//                                                 className="bg-white border-slate-300"
//                                             />
//                                         </div>
//                                         <Button 
//                                             onClick={handleAddCustomExercise} 
//                                             disabled={!newExerciseName}
//                                             className="h-10 px-6 bg-green-600 hover:bg-green-700"
//                                         >
//                                             <Plus className="h-4 w-4" />
//                                         </Button>
//                                     </div>
//                                 </TabsContent>
//                             </Tabs>
//                         </CardContent>
//                     </Card>
//                 )}
//             </div>
//         </div>
//     )
// }

