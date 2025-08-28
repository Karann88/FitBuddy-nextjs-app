// /* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer} from "recharts"
import { Plus, Trash, Coffee, Utensils, UtensilsCrossed, Cookie, Target, TrendingUp, Calendar, Zap, Trophy, Sparkles, Loader2, Settings } from "lucide-react"
import { createSupabaseBrowserClient, type MealEntry } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { format } from "date-fns"

const supabase = createSupabaseBrowserClient()

type MealType = "breakfast" | "lunch" | "dinner" | "snack"
    
// Daily goals
const DEFAULT_DAILY_GOALS = {
    calories: 2500,
    protein: 100,
    carbs: 250,
    fat: 67
}

// Enhanced meal type configurations with dynamic gradients
const MEAL_TYPES = {
    breakfast: { 
        icon: Coffee, 
        color: "bg-orange-100 text-orange-800 border-orange-200",
        bgGradient: "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200",
        chartColor: "#FF8042",
        label: "Breakfast",
        emoji: "🌅",
        description: "Start your day with energy",
        headerGradient: "from-orange-100 via-amber-50 to-yellow-100"
    },
    lunch: { 
        icon: Utensils, 
        color: "bg-green-100 text-green-800 border-green-200",
        bgGradient: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
        chartColor: "#00C49F",
        label: "Lunch",
        emoji: "🍽️",
        description: "Fuel your afternoon",
        headerGradient: "from-green-100 via-emerald-50 to-teal-100"
    },
    dinner: { 
        icon: UtensilsCrossed, 
        color: "bg-blue-100 text-blue-800 border-blue-200",
        bgGradient: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
        chartColor: "#0088FE",
        label: "Dinner",
        emoji: "🌙",
        description: "Nourish your evening",
        headerGradient: "from-blue-100 via-indigo-50 to-purple-100"
    },
    snack: { 
        icon: Cookie, 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        bgGradient: "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200",
        chartColor: "#FFBB28",
        label: "Snack",
        emoji: "🍪",
        description: "Healthy energy boost",
        headerGradient: "from-yellow-100 via-amber-50 to-orange-100"
    }
}

export function MealTracker() {
    const {user, isLoading: isAuthLoading } = useAuth()
    const [meals, setMeals] = useState<MealEntry[]>([])
    const [newMeal, setNewMeal] = useState<Partial<MealEntry>>({
        meal_name: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meal_type: "breakfast",
    })
    const [dailyGoals, setDailyGoals] = useState(DEFAULT_DAILY_GOALS)
    const [showGoalSettings, setShowGoalSettings] = useState(false)
    const [tempGoals, setTempGoals] = useState(DEFAULT_DAILY_GOALS)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const savedGoals = localStorage.getItem("userDailyGoals")
        if (savedGoals) {
            const parsedGoals = JSON.parse(savedGoals)
            setDailyGoals(parsedGoals)
            setTempGoals(parsedGoals)
        }
    }, [])

    useEffect(() => {
        if (isAuthLoading || !user) {
            setIsLoading(true)
            return
        }

        const fetchMeals = async () => {
            setIsLoading(true)
            const today = format(new Date(), "yyyy-MM-dd")
            const { data, error } = await supabase 
                .from("meal_entries")
                .select("*")
                .eq("user_id", user.id)
                .eq("date", today)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching meals:", error)
            } else {
                setMeals(data)
            }
            setIsLoading(false)
        }

        const mealChannel = supabase
            .channel("meal_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "meal_entries",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newEntry = payload.new as MealEntry | null
                    const oldEntry = payload.old as MealEntry | null
                    const today = format(new Date(), "yyyy-MM-dd")

                    setMeals((prev) => {
                        let updatedMeals = [...prev]
                        if (payload.eventType === "INSERT") {
                            if (newEntry && format(new Date(newEntry.date), "yyyy-MM-dd") === today) {
                                updatedMeals = [newEntry, ...updatedMeals]
                            }
                        } else if (payload.eventType === "UPDATE") {
                            if (newEntry && format(new Date(newEntry.date), "yyyy-MM-dd") === today) {
                                updatedMeals = updatedMeals.map((meal) => (meal.id === newEntry.id ? newEntry : meal))
                            }
                        } else if (payload.eventType === "DELETE") {
                            if (oldEntry) {
                                updatedMeals = updatedMeals.filter((meal) => meal.id !== oldEntry.id)
                            }
                        }
                        return updatedMeals
                    })
                }, 
            )
            .subscribe()

        fetchMeals() 

        return () => {
            supabase.removeChannel(mealChannel)
        }
    }, [user, isAuthLoading])

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
    const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0)
    const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)
    const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0)

    // Calculate comprehensive nutrition metrics
    const nutritionScore = Math.round(
        ((Math.min(totalCalories / dailyGoals.calories, 1) * 25) +
         (Math.min(totalProtein / dailyGoals.protein, 1) * 25) +
         (Math.min(totalCarbs / dailyGoals.carbs, 1) * 25) +
         (Math.min(totalFat / dailyGoals.fat, 1) * 25))
    )

    const weeklyAverage = 0
    const consistencyScore = Math.round((meals.length / 4) * 100)

    // Determine dominant meal type for dynamic theming
    const mealTypeCounts = meals.reduce((acc, meal) => {
        acc[meal.meal_type] = (acc[meal.meal_type] || 0) + 1
        return acc
    }, {} as Record<string, number>)
    
    const dominantMealType = Object.entries(mealTypeCounts).reduce((a, b) => 
        mealTypeCounts[a[0]] > mealTypeCounts[b[0]] ? a : b, 
        ["breakfast", 0]
    )[0] as keyof typeof MEAL_TYPES

    const currentTheme = MEAL_TYPES[dominantMealType] || MEAL_TYPES.breakfast

    const macroData = [
        { name: "Protein", value: (totalProtein * 4) || 0, color: "#8b5cf6", grams: totalProtein },
        { name: "Carbs", value: (totalCarbs * 4) || 0, color: "#10b981", grams: totalCarbs },
        { name: "Fat", value: (totalFat * 9) || 0, color: "#f59e0b", grams: totalFat },
    ].filter(item => item.value > 0)

    const mealTypeData = [
        {
            name: "Breakfast",
            value: meals.filter((m) => m.meal_type === "breakfast").reduce((sum, meal) => sum + meal.calories, 0),
            color: MEAL_TYPES.breakfast.chartColor,
        },
        {
            name: "Lunch",
            value: meals.filter((m) => m.meal_type === "lunch").reduce((sum, meal) => sum + meal.calories, 0),
            color: MEAL_TYPES.lunch.chartColor,
        },
        {
            name: "Dinner",
            value: meals.filter((m) => m.meal_type === "dinner").reduce((sum, meal) => sum + meal.calories, 0),
            color: MEAL_TYPES.dinner.chartColor,
        },
        {
            name: "Snack",
            value: meals.filter((m) => m.meal_type === "snack").reduce((sum, meal) => sum + meal.calories, 0),
            color: MEAL_TYPES.snack.chartColor,
        },
    ].filter((item) => item.value > 0)

    // Daily nutrition breakdown for bar chart
    const nutritionBreakdown = [
        { 
            name: "Calories", 
            current: totalCalories, 
            goal: dailyGoals.calories, 
            percentage: (totalCalories / dailyGoals.calories) * 100,
            color: "#3b82f6"
        },
        { 
            name: "Protein", 
            current: totalProtein, 
            goal: dailyGoals.protein, 
            percentage: (totalProtein / dailyGoals.protein) * 100,
            color: "#8b5cf6"
        },
        { 
            name: "Carbs", 
            current: totalCarbs, 
            goal: dailyGoals.carbs, 
            percentage: (totalCarbs / dailyGoals.carbs) * 100,
            color: "#10b981"
        },
        { 
            name: "Fat", 
            current: totalFat, 
            goal: dailyGoals.fat, 
            percentage: (totalFat / dailyGoals.fat) * 100,
            color: "#f59e0b"
        },
    ]

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setNewMeal((prev) => ({
            ...prev,
            [name]: name === "meal_name" ? value : Number(value),
        }))
    }

    const handleTypeChange = (value: string) => {
        setNewMeal((prev) => ({
            ...prev,
            meal_type: value as MealType,
        }))
    }

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setTempGoals((prev) => ({
            ...prev,
            [name]: Number(value),
        }))
    }

    const handleSaveGoals = () => {
        setDailyGoals(tempGoals)
        localStorage.setItem("userDailyGoals", JSON.stringify(tempGoals))
        setShowGoalSettings(false)
    }

    const handleCancelGoals = () => {
        setTempGoals(dailyGoals)
        setShowGoalSettings(false)
    }

    const handleResetGoals = () => {
        setTempGoals(dailyGoals)
    }

    const handleAddMeal = async () => {
        if (!newMeal.meal_name || !newMeal.calories || !user) return

        setIsLoading(true)
        const today = format(new Date(), "yyyy-MM-dd")

        const { error } = await supabase.from("meal_entries").insert({
            user_id: user.id,
            meal_name: newMeal.meal_name,
            calories: newMeal.calories || 0,
            protein: newMeal.protein || 0,
            carbs: newMeal.carbs || 0,
            fat: newMeal.fat || 0,
            meal_type: newMeal.meal_type as "breakfast" | "lunch" | "dinner" | "snack",
            date: today,
        })

        // setMeals((prev) => [...prev, meal])
        if (error) {
            console.error("Error adding meal:", error)
        } else {
            setNewMeal({
                meal_name: "",
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                meal_type: "breakfast",
            })
        }
        setIsLoading(false)
    }

    const handleDeleteMeal = async (id : string) => {
        setIsLoading(true)
        const { error } = await supabase.from("meal_entries").delete().eq("id", id)

        if (error) {
            console.error("Error deleting meal:", error)
        } else {
            setMeals((prev) => prev.filter((meal) => meal.id !== id))
        }
        setIsLoading(false)
    }

    const getProgressPercentage = (current: number, goal: number) => {
        return Math.min((current / goal) * 100, 100)
    }

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return "text-emerald-600"
        if (percentage >= 70) return "text-yellow-600"
        return "text-blue-600"
    }

    const getNutritionLevel = (score: number) => {
        if (score >= 90) return { level: "Excellent", color: "bg-emerald-100 text-emerald-800 border-emerald-200", emoji: "🏆" }
        if (score >= 70) return { level: "Good", color: "bg-green-100 text-green-800 border-green-200", emoji: "⭐" }
        if (score >= 50) return { level: "Fair", color: "bg-yellow-100 text-yellow-800 border-yellow-200", emoji: "🌟" }
        if (score >= 30) return { level: "Building", color: "bg-orange-100 text-orange-800 border-orange-200", emoji: "🌱" }
        return { level: "Starting", color: "bg-gray-100 text-gray-800 border-gray-200", emoji: "🎯" }
    }

    const getMotivationalMessage = () => {
        if (nutritionScore >= 90) {
            return "🎉 Outstanding nutrition! You're absolutely crushing your health goals!"
        } else if (nutritionScore >= 70) {
            return "💪 Excellent progress! You're building amazing healthy eating habits!"
        } else if (nutritionScore >= 50) {
            return "🌟 Great start! Keep adding nutritious foods to reach your goals!"
        } else if (meals.length > 0) {
            return "🍎 Nice beginning! Every healthy choice brings you closer to your goals!"
        } else {
            return "🥗 Ready to start your nutrition transformation journey today!"
        }
    }

    const nutritionLevel = getNutritionLevel(nutritionScore)

    if (isLoading && meals.length === 0) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
                    <span className="text-muted-foreground">Loading meal data...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 overflow-auto">
            <div className="w-full max-w-none mx-auto space-y-6">
                {/* Enhanced Nutrition Overview Dashboard with Dynamic Theming */}
                <Card className={`bg-gradient-to-r ${currentTheme.headerGradient} border-emerald-200 shadow-lg backdrop-blur-sm`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <Sparkles className="h-6 w-6 text-emerald-600" />
                                    Nutrition & Wellness Dashboard
                                </CardTitle>
                                <CardDescription className="text-lg">Track your daily nutrition goals and maintain a healthy lifestyle</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowGoalSettings(!showGoalSettings)}
                                    className="flex items-center gap-2"
                                >
                                    <Settings className="h-4 w-4"/> 
                                    Set Goals
                                </Button>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-600">{nutritionScore}%</div>
                                    <div className="text-sm text-muted-foreground">Nutrition Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-600">{meals.length}</div>
                                    <div className="text-sm text-muted-foreground">Meals Today</div>
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
                                        Nutrition Score
                                    </span>
                                    <span className="text-muted-foreground font-semibold">{nutritionScore}%</span>
                                </div>
                                <Progress value={nutritionScore} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Meals Logged
                                    </span>
                                    <span className="text-muted-foreground font-semibold">{meals.length}/4</span>
                                </div>
                                <Progress value={(meals.length / 4) * 100} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4" />
                                        Weekly Average
                                    </span>
                                    <span className="text-muted-foreground font-semibold">{weeklyAverage}%</span>
                                </div>
                                <Progress value={weeklyAverage} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-1">
                                        <Zap className="h-4 w-4" />
                                        Consistency
                                    </span>
                                    <span className="text-muted-foreground font-semibold">{consistencyScore}%</span>
                                </div>
                                <Progress value={consistencyScore} className="h-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Goal Settings Panel */}
                {showGoalSettings && (
                    <Card className="border-2 border-blue bg-blue-50/50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <Target className="h-5 w-5 text-blue-600" />
                                Set your Daily Nutrition Goals
                            </CardTitle>
                            <CardDescription>
                                Customize your daily targets for calories, protein, carbs, and fat to match your personal health goals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <Label htmlFor="goal_calories" className="text-sm font-medium">Daily Calories</Label>
                                    <Input 
                                        id="goal_calories" 
                                        name="calories" 
                                        type="number" 
                                        value={tempGoals.calories} 
                                        onChange={handleGoalChange} 
                                        placeholder="2000" 
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="goal_protein" className="text-sm font-medium">Protein(g)</Label>
                                    <Input 
                                        id="goal_protein" 
                                        name="protein" 
                                        type="number" 
                                        value={tempGoals.protein} 
                                        onChange={handleGoalChange} 
                                        placeholder="90" 
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="goal_carbs" className="text-sm font-medium">Carbs(g)</Label>
                                    <Input 
                                        id="goal_carbs" 
                                        name="carbs" 
                                        type="number" 
                                        value={tempGoals.carbs} 
                                        onChange={handleGoalChange} 
                                        placeholder="200" 
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="goal_fat" className="text-sm font-medium">Fat(g)</Label>
                                    <Input 
                                        id="goal_fat" 
                                        name="fat" 
                                        type="number" 
                                        value={tempGoals.fat} 
                                        onChange={handleGoalChange} 
                                        placeholder="70" 
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={handleResetGoals}>Reset to Default</Button>
                                <Button variant="outline" onClick={handleCancelGoals}>Cancel</Button>
                                <Button onClick={handleSaveGoals} className="bg-blue-600 hover:bg-blue-700"> Save Goals</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Motivational Banner */}
                <Card className={`${nutritionLevel.color} shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">{nutritionLevel.emoji}</div>
                                <div>
                                    <div className="text-lg font-semibold">Nutrition Level: {nutritionLevel.level}</div>
                                    <div className="text-sm opacity-80">{getMotivationalMessage()}</div>
                                </div>
                            </div>
                            <Badge className={`${nutritionLevel.color} text-lg px-4 py-2`}>
                                {nutritionScore}% Complete
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Enhanced Daily Goals Overview */}
                <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 shadow-lg backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <Target className="h-5 w-5 text-blue-600" />
                            Daily Progress Tracker
                        </CardTitle>
                        <CardDescription className="text-base">Monitor your nutrition goals with enhanced visual feedback</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {nutritionBreakdown.map((item) => (
                                <div key={item.name} className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-sm">{item.name}</span>
                                        <span className={`text-sm font-semibold ${getProgressColor(item.percentage)}`}>
                                            {item.current} / {item.goal}{item.name === "Calories" ? "" : "g"}
                                        </span>
                                    </div>
                                    <Progress 
                                        value={getProgressPercentage(item.current, item.goal)} 
                                        className="h-2"
                                    />
                                    <div className="text-xs text-muted-foreground text-center">
                                        {Math.round(item.percentage)}% of daily goal
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Enhanced Add Meal Form */}
                    <Card className="lg:col-span-2 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <Plus className="h-5 w-5 text-green-600" />
                                Add New Meal
                            </CardTitle>
                            <CardDescription className="text-base">Log your food intake to track your nutrition journey</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <Label htmlFor="meal_name" className="text-sm font-medium">Food Name</Label>
                                    <Input
                                        id="meal_name"
                                        name="meal_name"
                                        value={newMeal.meal_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Grilled Chicken Breast"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="meal_type" className="text-sm font-medium">Meal Type</Label>
                                    <Select value={newMeal.meal_type as string} onValueChange={handleTypeChange}>
                                        <SelectTrigger id="meal_type" className="mt-1">
                                            <SelectValue placeholder="Select meal type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(MEAL_TYPES).map(([key, config]) => {
                                                const Icon = config.icon
                                                return (
                                                    <SelectItem key={key} value={key}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{config.emoji}</span>
                                                            <Icon className="h-4 w-4" />
                                                            {config.label}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="calories" className="text-sm font-medium">Calories</Label>
                                    <Input
                                        id="calories"
                                        name="calories"
                                        type="number"
                                        value={newMeal.calories || ""}
                                        onChange={handleInputChange}
                                        placeholder="kcal"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="protein" className="text-sm font-medium">Protein (g)</Label>
                                    <Input
                                        id="protein"
                                        name="protein"
                                        type="number"
                                        value={newMeal.protein || ""}
                                        onChange={handleInputChange}
                                        // placeholder="grams"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="carbs" className="text-sm font-medium">Carbs (g)</Label>
                                    <Input
                                        id="carbs"
                                        name="carbs"
                                        type="number"
                                        value={newMeal.carbs || ""}
                                        onChange={handleInputChange}
                                        // placeholder="grams"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="fat" className="text-sm font-medium">Fat (g)</Label>
                                    <Input
                                        id="fat"
                                        name="fat"
                                        type="number"
                                        value={newMeal.fat || ""}
                                        onChange={handleInputChange}
                                        // placeholder="grams"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={handleAddMeal} 
                                className="w-full mt-6 bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                disabled={!newMeal.meal_name || !newMeal.calories || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Add Meal
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Enhanced Nutrition Charts */}
                    <Card className="shadow-lg backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                                Nutrition Analytics
                            </CardTitle>
                            <CardDescription className="text-base">Visual breakdown of your daily nutrition</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Enhanced Macro Breakdown */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 text-center">Macronutrients Distribution</h4>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={macroData.length > 0 ? macroData : [{ name: "No data", value: 1, color: "#e5e7eb" }]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {(macroData.length > 0 ? macroData : [{ name: "No data", value: 1, color: "#e5e7eb" }]).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(value: any, name: any, props: any) => [
                                                    `${Math.round(value)} cal (${props.payload.grams}g)`, 
                                                    name
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                height={36}
                                                formatter={(value) => <span className="text-xs">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Enhanced Meal Type Breakdown */}
                            {mealTypeData.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 text-center">Calories by Meal Type</h4>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={mealTypeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={70}
                                                    dataKey="value"
                                                >
                                                    {mealTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value) => [`${value} kcal`, "Calories"]}
                                                    contentStyle={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                />
                                                <Legend 
                                                    verticalAlign="bottom" 
                                                    height={36}
                                                    formatter={(value) => <span className="text-xs">{value}</span>}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Enhanced Meals List */}
                <Card className="shadow-lg backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <Utensils className="h-5 w-5 text-blue-600" />
                            Today&apos;s Meals
                        </CardTitle>
                        <CardDescription className="text-base">
                            {meals.length} meal{meals.length !== 1 ? 's' : ''} logged • {totalCalories} total calories
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {meals.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No meals logged yet</p>
                                <p className="text-sm">Start tracking your nutrition by adding your first meal above</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {meals.map((meal) => {
                                    const mealConfig = MEAL_TYPES[meal.meal_type]
                                    const Icon = mealConfig.icon
                                    return (
                                        <div key={meal.id} className={`flex items-center justify-between p-4 rounded-lg border ${mealConfig.bgGradient} hover:shadow-lg transition-all duration-300 backdrop-blur-sm`}>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{mealConfig.emoji}</span>
                                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                                    <Badge variant="secondary" className={mealConfig.color}>
                                                        {mealConfig.label}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-lg">{meal.meal_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDeleteMeal(meal.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
