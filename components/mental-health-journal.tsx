"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts"
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns"
import { 
  BookHeart, 
  Plus, 
  Search, 
  Tag, 
  X, 
  Loader2, 
  Heart, 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Edit3, 
  Eye,
  Target,
  Activity,
  Trash2,
  BarChart3
} from "lucide-react"
import { createSupabaseBrowserClient, type JournalEntry } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"

const supabase = createSupabaseBrowserClient()

type MoodEmoji = "😢" | "😔" | "😐" | "🙂" | "😊"

// Mood mapping for chart colors and labels
const moodCountsMap = {
  "😊": { name: "Very Happy", count: 0, color: "#10b981", bgColor: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  "🙂": { name: "Happy", count: 0, color: "#84cc16", bgColor: "bg-lime-100 text-lime-800 border-lime-200" },
  "😐": { name: "Neutral", count: 0, color: "#eab308", bgColor: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  "😔": { name: "Sad", count: 0, color: "#f97316", bgColor: "bg-orange-100 text-orange-800 border-orange-200" },
  "😢": { name: "Very Sad", count: 0, color: "#ef4444", bgColor: "bg-red-100 text-red-800 border-red-200" },
}

export function MentalHealthJournal() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [mood, setMood] = useState<MoodEmoji>("😊")
  const [tag, setTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [streak] = useState(0)
  const [totalSessions] = useState(0)

  useEffect(() => {
    if (isAuthLoading || !user) {
      setIsLoading(true)
      return
    }

    const fetchJournalEntries = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (error) {
        console.error("Error fetching journal entries:", error)
      } else {
        setEntries(data)
      }
      setIsLoading(false)
    }

    const journalChannel = supabase
      .channel("journal_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "journal_entries",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEntry = payload.new as JournalEntry | null
          const oldEntry = payload.old as JournalEntry | null

          setEntries((prev) => {
            let updatedEntries = [...prev]
            if (payload.eventType === "INSERT") {
              if (newEntry) {
                updatedEntries = [newEntry, ...updatedEntries]
              }
            } else if (payload.eventType === "UPDATE") {
              if (newEntry) {
                updatedEntries = updatedEntries.map((entry) => (entry.id === newEntry.id ? newEntry : entry))
              }
            } else if (payload.eventType === "DELETE") {
              if (oldEntry) {
                updatedEntries = updatedEntries.filter((entry) => entry.id !== oldEntry.id)
              }
            }
            return updatedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          })
        },
      )
      .subscribe()

    fetchJournalEntries()

    return () => {
      supabase.removeChannel(journalChannel)
    }
  }, [user, isAuthLoading])

  // Calculate mood statistics
  const moodStats = { ...moodCountsMap }
  entries.forEach((entry) => {
    if (moodStats[entry.mood_emoji as MoodEmoji]) {
      moodStats[entry.mood_emoji as MoodEmoji].count++
    }
  })

  const moodData = Object.values(moodStats).filter((m) => m.count > 0)

  // Get all unique tags
  const allTags = Array.from(new Set(entries.flatMap((entry) => entry.tags)))

  // Filter entries by search term
  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm) return true

    return (
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  // Calculate wellness metrics
  const totalEntries = entries.length
  const recentEntries = entries.filter(entry => {
    const daysDiff = Math.floor((new Date().getTime() - new Date(entry.date).getTime()) / (1000 * 3600 * 24))
    return daysDiff <= 7
  }).length

  const averageMoodScore = entries.length > 0 
    ? entries.reduce((sum, entry) => {
        const moodScore = { "😢": 1, "😔": 2, "😐": 3, "🙂": 4, "😊": 5 }[entry.mood_emoji as MoodEmoji]
        return sum + moodScore
      }, 0) / entries.length
    : 0

  // Mood trend data processing
  const generateMoodTrendData = (days: number) => {
    const endDate = new Date()
    const startDate = subDays(endDate, days - 1)
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
    
    return dateRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd")
      const dayEntries = entries.filter(entry => entry.date === dateStr)
      
      if (dayEntries.length === 0) {
        return {
          date: format(date, "MMM d"),
          fullDate: dateStr,
          moodScore: null,
          entryCount: 0,
          averageMood: null
        }
      }
      
      const avgMoodScore = dayEntries.reduce((sum, entry) => {
        const moodScore = { "😢": 1, "😔": 2, "😐": 3, "🙂": 4, "😊": 5 }[entry.mood_emoji as MoodEmoji]
        return sum + moodScore
      }, 0) / dayEntries.length
      
      return {
        date: format(date, "MMM d"),
        fullDate: dateStr,
        moodScore: avgMoodScore,
        entryCount: dayEntries.length,
        averageMood: avgMoodScore
      }
    })
  }

  const weeklyTrendData = generateMoodTrendData(7)
  const monthlyTrendData = generateMoodTrendData(30)
  const quarterlyTrendData = generateMoodTrendData(90)

  // Calculate mood trend insights
  const getMoodTrendInsight = () => {
    if (weeklyTrendData.length < 2) return "Not enough data for trend analysis"
    
    const validScores = weeklyTrendData.filter(d => d.moodScore !== null).map(d => d.moodScore!)
    if (validScores.length < 2) return "Not enough data for trend analysis"
    
    const recentScore = validScores[validScores.length - 1]
    const previousScore = validScores[validScores.length - 2]
    const difference = recentScore - previousScore
    
    if (difference > 0.5) return "📈 Your mood is trending upward! Keep up the positive momentum."
    if (difference < -0.5) return "📉 Your mood has been declining. Consider reaching out for support."
    return "📊 Your mood has been relatively stable recently."
  }

  const moodTrendInsight = getMoodTrendInsight()

  const handleAddTag = () => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSaveEntry = async () => {
    if (!title || !content || !selectedDate || !user) return

    setIsSaving(true)
    const entryDate = format(selectedDate, "yyyy-MM-dd")

    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title,
      content,
      mood_emoji: mood,
      tags,
      date: entryDate,
    })

    if (error) {
      console.error("Error saving journal entry:", error)
    } else {
      // Reset form
      setTitle("")
      setContent("")
      setMood("😊")
      setTags([])
      setSelectedDate(new Date())
    }
    setIsSaving(false)
  }

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry)
  }

  const handleCloseEntry = () => {
    setSelectedEntry(null)
  }

  const handleDeleteEntry = async (id: string) => {
    setIsLoading(true)
    const { error } = await supabase.from("journal_entries").delete().eq("id", id)
    if (error) {
      console.error("Error deleting journal entry:", error)
    } else {
      setSelectedEntry(null)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
            <div className="absolute inset-0 h-12 w-12 rounded-full bg-purple-200/30 animate-ping mx-auto"></div>
          </div>
          <p className="text-lg font-medium text-purple-700">Loading your wellness journal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 overflow-auto">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-none mx-auto space-y-6">
        {/* Header Dashboard */}
        <Card className="bg-gradient-to-r from-purple-100 via-pink-50 to-rose-100 border-purple-200 shadow-2xl border-0 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-3xl font-bold">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  Mental Wellness & Journal Dashboard
                </CardTitle>
                <CardDescription className="text-lg mt-2">Transform your mental health with mindful reflection</CardDescription>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{streak}</div>
                  <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{totalSessions}</div>
                  <div className="text-sm text-muted-foreground font-medium">Sessions</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold flex items-center gap-2">
                    <BookHeart className="h-4 w-4 text-purple-500" />
                    Total Entries
                  </span>
                  <span className="text-muted-foreground font-medium">{totalEntries}</span>
                </div>
                <Progress value={Math.min(totalEntries * 10, 100)} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                    This Week
                  </span>
                  <span className="text-muted-foreground font-medium">{recentEntries}</span>
                </div>
                <Progress value={Math.min(recentEntries * 14.3, 100)} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Mood Score
                  </span>
                  <span className="text-muted-foreground font-medium">{averageMoodScore.toFixed(1)}/5</span>
                </div>
                <Progress value={(averageMoodScore / 5) * 100} className="h-3 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Wellness Score
                  </span>
                  <span className="text-muted-foreground font-medium">85%</span>
                </div>
                <Progress value={85} className="h-3 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* New Journal Entry Card */}
          <Card className="w-full bg-gradient-to-br from-blue-100 via-cyan-50 to-sky-100 border-blue-200 shadow-2xl border-0 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Edit3 className="h-6 w-6 text-white" />
                </div>
                New Journal Entry
              </CardTitle>
              <CardDescription className="text-lg">Express your thoughts and feelings in a safe space</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-3">
                <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  Date
                </Label>
                <div className="flex justify-center">
                  <Calendar 
                    mode="single" 
                    selected={selectedDate} 
                    onSelect={setSelectedDate} 
                    className="rounded-xl border border-blue-200 bg-white/80 backdrop-blur-sm shadow-lg" 
                  />
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold">Entry Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your entry a meaningful title..."
                  className="w-full h-12 text-lg bg-white/80 backdrop-blur-sm border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                />
              </div>

              {/* Content Textarea */}
              <div className="space-y-3">
                <Label htmlFor="content" className="text-sm font-semibold">Your Thoughts & Feelings</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write freely about your thoughts, feelings, experiences, and reflections. This is your safe space..."
                  className="min-h-[140px] resize-none bg-white/80 backdrop-blur-sm border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                />
              </div>

              {/* Mood Selection */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  How are you feeling today?
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {(Object.keys(moodCountsMap) as Array<MoodEmoji>).map((moodEmoji) => (
                    <Button
                      key={moodEmoji}
                      variant={mood === moodEmoji ? "default" : "outline"}
                      className={`h-16 w-full text-3xl hover:scale-105 transition-all duration-200 rounded-xl ${
                        mood === moodEmoji 
                          ? "bg-blue-600 hover:bg-blue-700 shadow-lg" 
                          : "hover:bg-blue-50 border-blue-200 bg-white/60 backdrop-blur-sm"
                      }`}
                      onClick={() => setMood(moodEmoji)}
                    >
                      {moodEmoji}
                    </Button>
                  ))}
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className={`${moodCountsMap[mood].bgColor} px-4 py-2 text-sm font-semibold`}>
                    {moodCountsMap[mood].name}
                  </Badge>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-4">
                <Label htmlFor="tags" className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-500" />
                  Tags (optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Add tags (e.g., work, family, exercise, gratitude)"
                    className="flex-1 bg-white/80 backdrop-blur-sm border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button 
                    onClick={handleAddTag} 
                    variant="outline" 
                    size="icon"
                    className="border-blue-200 hover:bg-blue-50 bg-white/60 backdrop-blur-sm rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Display Current Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200 px-3 py-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600" 
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Suggested Tags */}
                {allTags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Suggested tags:</Label>
                    <div className="flex flex-wrap gap-1">
                      {allTags.slice(0, 6).map((suggestedTag) => (
                        <Button
                          key={suggestedTag}
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground hover:bg-blue-50 bg-white/40 backdrop-blur-sm rounded-lg"
                          onClick={() => {
                            if (!tags.includes(suggestedTag)) {
                              setTags([...tags, suggestedTag])
                            }
                          }}
                        >
                          {suggestedTag}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveEntry} 
                disabled={!title || !content || !selectedDate || isSaving} 
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                size="lg"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <BookHeart className="h-5 w-5" />
                    Save Entry
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Journal Entries and Analytics Card */}
          <Card className="w-full bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 border-emerald-200 shadow-2xl border-0 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                Your Journal
              </CardTitle>
              <CardDescription className="text-lg">Review past entries and track your emotional journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-white/80 backdrop-blur-sm border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl"
                />
                <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-white/60 backdrop-blur-sm rounded-xl">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {selectedEntry ? (
                <div className="space-y-4">
                  <Button variant="ghost" size="sm" onClick={handleCloseEntry} className="mb-2 hover:bg-emerald-50">
                    ← Back to entries
                  </Button>

                  <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-emerald-800">{selectedEntry.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(parseISO(selectedEntry.date), "MMMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedEntry.mood_emoji}</span>
                        <Badge className={moodCountsMap[selectedEntry.mood_emoji as MoodEmoji].bgColor}>
                          {moodCountsMap[selectedEntry.mood_emoji as MoodEmoji].name}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-100 p-4 min-h-[150px] bg-white/50 backdrop-blur-sm mb-4">
                      <p className="text-gray-700 leading-relaxed">{selectedEntry.content}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedEntry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeleteEntry(selectedEntry.id)} 
                      className="w-full mt-4 bg-red-500 hover:bg-red-600 rounded-xl"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Entry
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {filteredEntries.length > 0 ? (
                      filteredEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-xl border border-emerald-200 p-4 cursor-pointer hover:bg-emerald-50/80 bg-white/60 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                          onClick={() => handleViewEntry(entry)}
                        >
                          <div>
                            <div className="font-semibold text-emerald-800">{entry.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(parseISO(entry.date), "MMMM d, yyyy")}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{entry.mood_emoji}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8 bg-white/40 backdrop-blur-sm rounded-xl border border-emerald-200">
                        <BookHeart className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
                        <p>No entries found</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-600" />
                      Mood Distribution
                    </h4>
                    <div className="h-[250px] bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200 p-4">
                      {moodData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={moodData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="count"
                              nameKey="name"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {moodData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #d1fae5',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <Brain className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
                            <p>No mood data available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-emerald-600" />
                      Common Tags
                    </h4>
                    <div className="flex flex-wrap gap-2 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200">
                      {allTags.length > 0 ? (
                        allTags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-emerald-100 border-emerald-300 text-emerald-700 transition-colors duration-200" 
                            onClick={() => setSearchTerm(tag)}
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center w-full py-4">No tags available</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mood Trends Analytics Section */}
        <Card className="w-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 border-indigo-200 shadow-2xl border-0 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              Mood Trends & Analytics
            </CardTitle>
            <CardDescription className="text-lg">Track your emotional patterns and progress over time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood Trend Insight */}
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-200 shadow-lg">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Trend Insight
              </h4>
              <p className="text-indigo-800 font-medium">{moodTrendInsight}</p>
            </div>

            {/* Mood Trends Charts */}
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-indigo-100 to-purple-100 h-auto">
                <TabsTrigger value="weekly" className="text-lg font-bold py-3">7 Days</TabsTrigger>
                <TabsTrigger value="monthly" className="text-lg font-bold py-3">30 Days</TabsTrigger>
                <TabsTrigger value="quarterly" className="text-lg font-bold py-3">90 Days</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="mt-8">
                <div className="w-full h-[400px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-inner">
                  <h3 className="text-xl font-bold text-indigo-800 mb-4 text-center">Weekly Mood Trend</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrendData} margin={{ top: 20, right: 40, left: 30, bottom: 20 }}>
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
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
                        domain={[1, 5]}
                        tickFormatter={(value) => {
                          const moodLabels = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😊" }
                          return moodLabels[value as keyof typeof moodLabels] || value
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '2px solid #c7d2fe',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any, name: string) => {
                          if (name === "moodScore" && value !== null) {
                            const moodEmojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😊" }
                            const roundedValue = Math.round(value)
                            return [`${value.toFixed(1)} ${moodEmojis[roundedValue as keyof typeof moodEmojis] || ""}`, "Mood Score"]
                          }
                          return [value, name]
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="moodScore"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fill="url(#moodGradient)"
                        name="Mood Score"
                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: 'white' }}
                        activeDot={{ r: 8, fill: '#6366f1', strokeWidth: 3, stroke: 'white' }}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="monthly" className="mt-8">
                <div className="w-full h-[400px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner">
                  <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">Monthly Mood Trend</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData} margin={{ top: 20, right: 40, left: 30, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 'bold' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 'bold' }}
                        domain={[1, 5]}
                        tickFormatter={(value) => {
                          const moodLabels = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😊" }
                          return moodLabels[value as keyof typeof moodLabels] || value
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '2px solid #ddd6fe',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any, name: string) => {
                          if (name === "moodScore" && value !== null) {
                            const moodEmojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😊" }
                            const roundedValue = Math.round(value)
                            return [`${value.toFixed(1)} ${moodEmojis[roundedValue as keyof typeof moodEmojis] || ""}`, "Mood Score"]
                          }
                          return [value, name]
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="moodScore"
                        stroke="#a855f7"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#a855f7', strokeWidth: 2, stroke: 'white' }}
                        activeDot={{ r: 7, fill: '#a855f7', strokeWidth: 2, stroke: 'white' }}
                        name="Mood Score"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="quarterly" className="mt-8">
                <div className="w-full h-[400px] bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 shadow-inner">
                  <h3 className="text-xl font-bold text-pink-800 mb-4 text-center">Quarterly Mood Trend</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quarterlyTrendData} margin={{ top: 20, right: 40, left: 30, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 'bold' }}
                        domain={[1, 5]}
                        tickFormatter={(value) => {
                          const moodLabels = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😊" }
                          return moodLabels[value as keyof typeof moodLabels] || value
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '2px solid #fce7f3',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any, name: string) => {
                          if (name === "moodScore" && value !== null) {
                            const moodEmojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😊" }
                            const roundedValue = Math.round(value)
                            return [`${value.toFixed(1)} ${moodEmojis[roundedValue as keyof typeof moodEmojis] || ""}`, "Mood Score"]
                          }
                          return [value, name]
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="moodScore"
                        stroke="#ec4899"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#ec4899', strokeWidth: 2, stroke: 'white' }}
                        activeDot={{ r: 6, fill: '#ec4899', strokeWidth: 2, stroke: 'white' }}
                        name="Mood Score"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>

            {/* Mood Statistics Summary */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-200 shadow-lg text-center">
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {weeklyTrendData.filter(d => d.moodScore !== null).length}
                </div>
                <div className="text-sm text-muted-foreground">Days This Week</div>
              </div>
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-lg text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {averageMoodScore.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Average Mood</div>
              </div>
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200 shadow-lg text-center">
                <div className="text-2xl font-bold text-pink-600 mb-1">
                  {entries.filter(e => {
                    const moodScore = { "😢": 1, "😔": 2, "😐": 3, "🙂": 4, "😊": 5 }[e.mood_emoji as MoodEmoji]
                    return moodScore >= 4
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Happy Days</div>
              </div>
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-200 shadow-lg text-center">
                <div className="text-2xl font-bold text-rose-600 mb-1">
                  {Math.max(...weeklyTrendData.filter(d => d.entryCount > 0).map(d => d.entryCount), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Most Entries/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

