"use client"

import { useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Plus, X, GripVertical, MapPin, Clock, Navigation, Car, Footprints, Star, ArrowLeft } from "lucide-react"
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

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false }])
      setNewTask("")
    }
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const generatePlan = () => {
    setIsGenerated(true)
  }

  const totalTime = transportMode === "walking" ? "1h 20min" : "45min"
  const totalDistance = transportMode === "walking" ? "3.5 km" : "4.2 km"

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
                    <div key={task.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="flex-1">{task.text}</span>
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
                <Button onClick={generatePlan} className="w-full" disabled={tasks.length === 0}>
                  Generate Plan
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
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Route Map Placeholder */}
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Interactive map with route</p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-3">
                    {mockSuggestions.map((suggestion, index) => (
                      <div key={suggestion.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{suggestion.name}</h4>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{suggestion.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{suggestion.category}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{suggestion.distance}</span>
                            <span>{suggestion.estimatedTime}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
