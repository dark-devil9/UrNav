"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  MapPin,
  Users,
  Compass,
  DollarSign,
  MessageCircle,
  Clock,
  Heart,
  Sparkles,
  Navigation,
} from "lucide-react"

const modes = [
  {
    id: "plan-day",
    title: "Plan My Day",
    description: "Organize your tasks and find the best route",
    icon: Calendar,
    color: "bg-blue-500",
    href: "/modes/plan-day",
    features: ["Multi-stop routing", "Task optimization", "Time estimates"],
  },
  {
    id: "free-places",
    title: "Free Places",
    description: "Discover amazing places that won't cost you anything",
    icon: Heart,
    color: "bg-green-500",
    href: "/modes/free-places",
    features: ["Daily refresh", "Like/dislike", "Hidden gems"],
  },
  {
    id: "meet-friend",
    title: "Meet a Friend",
    description: "Find the perfect midpoint to meet someone",
    icon: Users,
    color: "bg-purple-500",
    href: "/modes/meet-friend",
    features: ["Midpoint calculation", "Activity suggestions", "Share plans"],
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Discover local attractions and cultural spots",
    icon: Compass,
    color: "bg-orange-500",
    href: "/modes/explorer",
    features: ["Cultural landmarks", "Local food", "Hidden attractions"],
  },
  {
    id: "ask-anything",
    title: "Ask Anything",
    description: "Natural language queries for any location need",
    icon: MessageCircle,
    color: "bg-teal-500",
    href: "/modes/ask-anything",
    features: ["Natural language", "Smart suggestions", "Memory learning"],
  },
]

export function ModesGrid() {
  const [budgetMode, setBudgetMode] = useState(false)

  return (
    <div className="space-y-6">
      {/* Budget Mode Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium">Budget Mode</h3>
              <p className="text-sm text-muted-foreground">Only show free and low-cost options</p>
            </div>
          </div>
          <Switch checked={budgetMode} onCheckedChange={setBudgetMode} />
        </div>
        {budgetMode && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <DollarSign className="h-3 w-3 mr-1" />
              Budget mode active - showing affordable options only
            </Badge>
          </div>
        )}
      </Card>

      {/* Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon
          return (
            <Link key={mode.id} href={mode.href}>
              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mode.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif font-semibold text-lg group-hover:text-primary transition-colors">
                        {mode.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">{mode.description}</p>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {mode.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                    <span>Explore mode</span>
                    <Navigation className="h-4 w-4 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">2.5</div>
          <div className="text-xs text-muted-foreground">Avg. planning time (min)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">847</div>
          <div className="text-xs text-muted-foreground">Places discovered</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">156</div>
          <div className="text-xs text-muted-foreground">Favorites saved</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">92%</div>
          <div className="text-xs text-muted-foreground">Satisfaction rate</div>
        </Card>
      </div>
    </div>
  )
}
