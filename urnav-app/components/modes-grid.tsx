"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useBudgetMode } from "@/hooks/use-budget"
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
  const { budgetMode, setBudgetMode } = useBudgetMode()

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
              <Card className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 ease-out cursor-pointer h-full">
                {/* Background gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-transparent to-emerald-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardContent className="p-6 space-y-4 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mode.color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                        {mode.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{mode.description}</p>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {mode.features.map((feature) => (
                        <Badge 
                          key={feature} 
                          variant="secondary" 
                          className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 hover:from-green-200 hover:to-emerald-200 transition-all duration-300 group-hover:scale-105"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-2 transition-transform duration-300">
                    <span>Explore mode</span>
                    <Navigation className="h-4 w-4 ml-2 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-800">2.5</div>
          <div className="text-xs text-blue-600">Avg. planning time (min)</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center mb-2">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-800">847</div>
          <div className="text-xs text-green-600">Places discovered</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center mb-2">
            <Heart className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-800">156</div>
          <div className="text-xs text-purple-600">Favorites saved</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-md rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center mb-2">
            <Sparkles className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-800">92%</div>
          <div className="text-xs text-orange-600">Satisfaction rate</div>
        </Card>
      </div>
    </div>
  )
}
