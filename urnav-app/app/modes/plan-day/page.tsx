"use client"

import { useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Plus, X, GripVertical, MapPin, Clock, Navigation, Car, Footprints, Star, ArrowLeft } from "lucide-react"
import { MapWidget } from "@/components/map-widget"
import { planDay } from "@/lib/api"
import { useGeo } from "@/hooks/use-geo"
import { toast } from "sonner"
import Link from "next/link"

interface Task {
  id: string
  text: string
  completed: boolean
}

interface PlaceSuggestion {
  id: string
  name: string
  category: string
  rating: number
  distance: string
  estimatedTime: string
  tags: string[]
}

const mockSuggestions: PlaceSuggestion[] = [
  {
    id: "1",
    name: "Big Bazaar",
    category: "Grocery Store",
    rating: 4.1,
    distance: "1.2 km",
    estimatedTime: "45 min",
    tags: ["Large selection", "Parking available"],
  },
  {
    id: "2",
    name: "Cafe Coffee Day",
    category: "Coffee Shop",
    rating: 4.2,
    distance: "0.8 km",
    estimatedTime: "20 min",
    tags: ["Wi-Fi", "Quick service"],
  },
  {
    id: "3",
    name: "India Post Office",
    category: "Post Office",
    rating: 3.8,
    distance: "1.5 km",
    estimatedTime: "15 min",
    tags: ["Government service", "Document services"],
  },
]

export default function PlanDayPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Buy groceries", completed: false },
    { id: "2", text: "Get coffee", completed: false },
    { id: "3", text: "Visit post office", completed: false },
  ])
  const [newTask, setNewTask] = useState("")
  const [isGenerated, setIsGenerated] = useState(false)
  const [transportMode, setTransportMode] = useState<"walking" | "driving">("walking")
  const [chatInput, setChatInput] = useState("")
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number }>>([])
  const { coords } = useGeo()
  const [loading, setLoading] = useState(false)
  const [userId] = useState(`user_${Date.now()}`) // Generate unique user ID for this session

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false }])
      setNewTask("")
    }
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task || !coords) return
    
    try {
      const origin = { lat: coords.lat, lng: coords.lon }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/modes/plan-day/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: task.text,
          user_id: userId,
          origin
        })
      })
      
      if (response.ok) {
        // Update local task state
        setTasks(tasks.map(t => 
          t.id === id ? { ...t, completed: !t.completed } : t
        ))
        toast.success(`Task "${task.text}" marked as ${!task.completed ? 'completed' : 'pending'}`)
      }
    } catch (error) {
      toast.error('Failed to update task status')
    }
  }

  const generatePlan = async () => {
    try {
      setLoading(true)
      const origin = coords ? { lat: coords.lat, lng: coords.lon } : { lat: 26.9124, lng: 75.7873 }
      const res = await planDay({ tasks: tasks.map((t) => t.text), origin, user_id: userId })
      
      // Extract route points from tasks with valid coordinates, including origin
      const validRoutePoints = res.tasks
        .filter(task => task.lat !== null && task.lng !== null)
        .map(task => ({ lat: task.lat!, lng: task.lng! }))
      
      // Add origin as first point for complete route
      const completeRoute = [{ lat: origin.lat, lng: origin.lng }, ...validRoutePoints]
      setRoutePoints(completeRoute)
      setPlanSummary(res.summary)
      setFullTaskDetails(res.tasks)
      setIsGenerated(true)
      toast.success("Plan generated")
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate plan")
    } finally {
      setLoading(false)
    }
  }

  const handleChatGenerate = async () => {
    if (!chatInput.trim()) return
    try {
      setLoading(true)
      const origin = coords ? { lat: coords.lat, lng: coords.lon } : { lat: 26.9124, lng: 75.7873 }
      const res = await planDay({ text: chatInput, origin, user_id: userId })
      
      // Update tasks from the response
      setTasks(res.tasks.map((t, i) => ({ id: `${Date.now()}-${i}`, text: t.task, completed: false })))
      
      // Extract route points from tasks with valid coordinates, including origin
      const validRoutePoints = res.tasks
        .filter(task => task.lat !== null && task.lng !== null)
        .map(task => ({ lat: task.lat!, lng: task.lng! }))
      
      // Add origin as first point for complete route
      const completeRoute = [{ lat: origin.lat, lng: origin.lng }, ...validRoutePoints]
      setRoutePoints(completeRoute)
      setPlanSummary(res.summary)
      setFullTaskDetails(res.tasks)
      setIsGenerated(true)
      setChatInput("")
      toast.success("Tasks extracted from your plan")
    } catch (e: any) {
      toast.error(e?.message || "Failed to parse your plan")
    } finally {
      setLoading(false)
    }
  }

  const [planSummary, setPlanSummary] = useState<{ distance_km: number; eta_min: number; total_tasks: number; pending_tasks: number; completed_tasks: number } | null>(null)
  const [fullTaskDetails, setFullTaskDetails] = useState<Array<{
    task: string;
    place: string;
    lat: number | null;
    lng: number | null;
    category: string;
    distance: number | null;
    rating: number | null;
    status: string;
  }>>([])
  
  const totalTime = planSummary ? `${Math.round(planSummary.eta_min / 60)}h ${planSummary.eta_min % 60}min` : "0h 0min"
  const totalDistance = planSummary ? `${planSummary.distance_km} km` : "0 km"

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/modes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Plan My Day</h1>
              <p className="text-muted-foreground">Organize your tasks and optimize your route</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Task Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Your Tasks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Task List */}
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div key={task.id} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      task.completed ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
                    }`}>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.text}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={task.completed ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'}
                      >
                        {task.completed ? '✓' : '○'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeTask(task.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add Task */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTask()}
                  />
                  <Button onClick={addTask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Chat-like Input */}
                <div className="space-y-2">
                  <Label className="text-sm">Describe your day in natural language</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="I land at 5am, need to buy bouquets, then coffee..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleChatGenerate()}
                    />
                    <Button onClick={handleChatGenerate} disabled={loading}>
                      Generate
                    </Button>
                  </div>
                </div>

                {/* Transport Mode */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Label className="text-sm font-medium">Transport Mode</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={transportMode === "walking" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTransportMode("walking")}
                    >
                      <Footprints className="h-4 w-4 mr-1" />
                      Walking
                    </Button>
                    <Button
                      variant={transportMode === "driving" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTransportMode("driving")}
                    >
                      <Car className="h-4 w-4 mr-1" />
                      Driving
                    </Button>
                  </div>
                </div>

                {/* Generate Button */}
                <Button onClick={generatePlan} className="w-full" disabled={tasks.length === 0 || loading}>
                  {loading ? "Generating..." : "Generate Plan"}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Plan */}
            {isGenerated && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-5 w-5" />
                      <span>Optimized Route</span>
                    </div>
                                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{totalTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{totalDistance}</span>
                    </div>
                    {planSummary && (
                      <>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {planSummary.total_tasks} tasks
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {planSummary.completed_tasks} completed
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Route Map */}
                  <MapWidget mode="multi" points={routePoints} />

                  {/* Places List */}
                  {fullTaskDetails.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Places & Tasks</h3>
                      <div className="space-y-3">
                        {fullTaskDetails.map((taskDetail, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {taskDetail.category}
                                  </span>
                                  {taskDetail.status === "completed" && (
                                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                      ✓ Completed
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-medium text-gray-900 mb-1">{taskDetail.task}</h4>
                                <p className="text-gray-600 mb-2">{taskDetail.place}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  {taskDetail.distance && (
                                    <span className="flex items-center space-x-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{taskDetail.distance}m</span>
                                    </span>
                                  )}
                                  {taskDetail.rating && (
                                    <span className="flex items-center space-x-1">
                                      <Star className="h-3 w-3" />
                                      <span>{taskDetail.rating}</span>
                                    </span>
                                  )}
                                  {taskDetail.lat && taskDetail.lng && (
                                    <span className="text-xs text-gray-400">
                                      {taskDetail.lat.toFixed(6)}, {taskDetail.lng.toFixed(6)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Route Summary */}
                  {fullTaskDetails.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-3">Route Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{fullTaskDetails.length}</div>
                          <div className="text-sm text-blue-800">Total Stops</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {fullTaskDetails.filter(t => t.status === "completed").length}
                          </div>
                          <div className="text-sm text-green-800">Completed</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {fullTaskDetails.filter(t => t.status === "pending").length}
                          </div>
                          <div className="text-sm text-orange-800">Pending</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {planSummary?.eta_min || 0}
                          </div>
                          <div className="text-sm text-purple-800">Minutes</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggestions (future: from search) */}
                  <div className="space-y-3" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
