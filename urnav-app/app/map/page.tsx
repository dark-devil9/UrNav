"use client"

import { useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MapPin, Search, Filter, Navigation, Star, Wifi, DollarSign, Heart, Leaf, Volume2 } from "lucide-react"

interface MapPlace {
  id: string
  name: string
  category: string
  rating: number
  distance: string
  tags: string[]
  coordinates: { lat: number; lng: number }
  isOpen: boolean
  priceLevel: number
}

const mockPlaces: MapPlace[] = [
  {
    id: "1",
    name: "Central Park",
    category: "Public Park",
    rating: 4.5,
    distance: "0.8 km",
    tags: ["Free", "Nature", "Walking"],
    coordinates: { lat: 26.9124, lng: 75.7873 },
    isOpen: true,
    priceLevel: 0,
  },
  {
    id: "2",
    name: "Cafe Coffee Day",
    category: "Coffee Shop",
    rating: 4.2,
    distance: "1.2 km",
    tags: ["Wi-Fi", "Budget-friendly"],
    coordinates: { lat: 26.9154, lng: 75.7903 },
    isOpen: true,
    priceLevel: 2,
  },
  {
    id: "3",
    name: "City Library",
    category: "Library",
    rating: 4.6,
    distance: "1.5 km",
    tags: ["Quiet", "Free", "Study space"],
    coordinates: { lat: 26.9094, lng: 75.7843 },
    isOpen: false,
    priceLevel: 0,
  },
]

const filterOptions = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "budget", label: "Budget-friendly", icon: DollarSign },
  { id: "quiet", label: "Quiet", icon: Volume2 },
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "free", label: "Free", icon: Heart },
]

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) => (prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]))
  }

  const clearFilters = () => {
    setActiveFilters([])
  }

  const getPriceDisplay = (level: number) => {
    if (level === 0) return "Free"
    return "₹".repeat(level)
  }

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="h-[calc(100vh-4rem)] relative">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/95 backdrop-blur"
            />
          </div>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-card/95 backdrop-blur">
                <Filter className="h-4 w-4" />
                {activeFilters.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Filters</span>
                  {activeFilters.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {filterOptions.map((option) => {
                    const Icon = option.icon
                    const isActive = activeFilters.includes(option.id)
                    return (
                      <Button
                        key={option.id}
                        variant={isActive ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => toggleFilter(option.id)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Map Container */}
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <div className="text-center space-y-4">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-semibold">Interactive Map</h3>
              <p className="text-muted-foreground max-w-md">
                Full-featured map with place markers, current location, and route planning would be integrated here
              </p>
            </div>
            {/* Mock place markers */}
            <div className="flex justify-center space-x-4">
              {mockPlaces.slice(0, 3).map((place) => (
                <Button
                  key={place.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPlace(place)}
                  className="bg-card/95 backdrop-blur"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {place.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Place Cards Drawer */}
        <div className="absolute bottom-0 left-0 right-0 bg-card border-t">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Nearby Places</h3>
              <Badge variant="secondary">{mockPlaces.length} places</Badge>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {mockPlaces.map((place) => (
                <Card
                  key={place.id}
                  className={`min-w-[280px] cursor-pointer transition-all ${
                    selectedPlace?.id === place.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedPlace(place)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{place.name}</h4>
                        <p className="text-xs text-muted-foreground">{place.category}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{place.rating}</span>
                        </div>
                        <Badge variant={place.isOpen ? "default" : "secondary"} className="text-xs">
                          {place.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{place.distance}</span>
                      <span>{getPriceDisplay(place.priceLevel)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {place.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1 h-7 text-xs">
                        <Navigation className="h-3 w-3 mr-1" />
                        Route
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                        <MapPin className="h-3 w-3 mr-1" />
                        Focus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
