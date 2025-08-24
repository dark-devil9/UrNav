"use client"

import { useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MapPin, Clock, Star, Plus, Minus, DollarSign, Camera, Utensils, Building } from "lucide-react"
import Link from "next/link"

interface Attraction {
  id: string
  name: string
  category: string
  rating: number
  distance: string
  estimatedTime: string
  tags: string[]
  image: string
  priceLevel: number
  isAdded: boolean
}

const mockAttractions: Attraction[] = [
  {
    id: "1",
    name: "Hawa Mahal",
    category: "Historical Monument",
    rating: 4.6,
    distance: "2.1 km",
    estimatedTime: "1.5 hours",
    tags: ["Must-see", "Photography", "Architecture"],
    image: "/historical-palace.png",
    priceLevel: 1,
    isAdded: false,
  },
  {
    id: "2",
    name: "City Palace",
    category: "Cultural Landmark",
    rating: 4.5,
    distance: "2.8 km",
    estimatedTime: "2 hours",
    tags: ["Culture", "Museum", "Royal history"],
    image: "/cultural-landmark.png",
    priceLevel: 2,
    isAdded: false,
  },
  {
    id: "3",
    name: "Jantar Mantar",
    category: "Historical Place",
    rating: 4.3,
    distance: "3.2 km",
    estimatedTime: "1 hour",
    tags: ["Science", "Astronomy", "UNESCO"],
    image: "/ancient-observatory.png",
    priceLevel: 1,
    isAdded: false,
  },
  {
    id: "4",
    name: "Bapu Bazaar",
    category: "Local Market",
    rating: 4.1,
    distance: "1.5 km",
    estimatedTime: "2 hours",
    tags: ["Shopping", "Local crafts", "Street food"],
    image: "/bustling-market.png",
    priceLevel: 2,
    isAdded: false,
  },
]

const categories = [
  { id: "must-see", label: "Must-see nearby", icon: Star },
  { id: "cultural", label: "Cultural landmarks", icon: Building },
  { id: "historical", label: "Historical places", icon: Camera },
  { id: "food", label: "Local food spots", icon: Utensils },
]

export default function ExplorerPage() {
  const [attractions, setAttractions] = useState(mockAttractions)
  const [budgetMode, setBudgetMode] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("must-see")
  const [totalCost, setTotalCost] = useState(0)

  const toggleAttraction = (id: string) => {
    setAttractions((prev) =>
      prev.map((attraction) => {
        if (attraction.id === id) {
          const newIsAdded = !attraction.isAdded
          const costChange = newIsAdded ? attraction.priceLevel * 100 : -attraction.priceLevel * 100
          setTotalCost((prevCost) => Math.max(0, prevCost + costChange))
          return { ...attraction, isAdded: newIsAdded }
        }
        return attraction
      }),
    )
  }

  const addedAttractions = attractions.filter((a) => a.isAdded)
  const totalTime = addedAttractions.reduce((acc, attraction) => {
    const hours = Number.parseFloat(attraction.estimatedTime)
    return acc + hours
  }, 0)

  const getPriceDisplay = (level: number) => {
    if (level === 0) return "Free"
    return "₹" + level * 100
  }

  const filteredAttractions = budgetMode ? attractions.filter((a) => a.priceLevel <= 1) : attractions

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/modes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold text-foreground">Discover Jaipur</h1>
              <p className="text-muted-foreground">Explore attractions, culture, and local experiences</p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="budget-mode" className="text-sm">
                Budget Mode
              </Label>
              <Switch id="budget-mode" checked={budgetMode} onCheckedChange={setBudgetMode} />
            </div>
          </div>

          {/* Budget Summary */}
          {(addedAttractions.length > 0 || budgetMode) && (
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{totalTime.toFixed(1)} hours planned</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">₹{totalCost} estimated cost</span>
                    </div>
                  </div>
                  {budgetMode && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Budget mode active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </Button>
              )
            })}
          </div>

          {/* Attractions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAttractions.map((attraction) => (
              <Card key={attraction.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="aspect-video relative">
                  <img
                    src={attraction.image || "/placeholder.svg"}
                    alt={attraction.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      {getPriceDisplay(attraction.priceLevel)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-semibold">{attraction.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{attraction.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{attraction.category}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{attraction.distance}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{attraction.estimatedTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {attraction.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant={attraction.isAdded ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAttraction(attraction.id)}
                      className="flex-1"
                    >
                      {attraction.isAdded ? (
                        <>
                          <Minus className="h-3 w-3 mr-1" />
                          Remove
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Plan
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      Map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timeline View */}
          {addedAttractions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Your Exploration Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {addedAttractions.map((attraction, index) => (
                    <div key={attraction.id} className="flex items-center space-x-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{attraction.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {attraction.estimatedTime} • {attraction.distance}
                        </p>
                      </div>
                      <Badge variant="outline">{getPriceDisplay(attraction.priceLevel)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
