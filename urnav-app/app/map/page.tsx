"use client"

import { useEffect, useMemo, useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MapPin, Search, Filter, Navigation, Star, Wifi, DollarSign, Heart, Leaf, Volume2 } from "lucide-react"
import { MapWidget } from "@/components/map-widget"
import { useGeo } from "@/hooks/use-geo"
import { searchPlaces } from "@/lib/api"

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
  const [places, setPlaces] = useState<MapPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { coords, error: geoError, loading: geoLoading } = useGeo()

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

  // Build tags from filters (simple mapping)
  const selectedTags = useMemo(() => {
    const tags: string[] = []
    if (activeFilters.includes("vegetarian")) tags.push("vegetarian")
    if (activeFilters.includes("free")) tags.push("park")
    return tags.join(",") || undefined
  }, [activeFilters])

  // Fetch places when coords or query/filters change (debounced)
  useEffect(() => {
    if (!coords) return
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await searchPlaces({ lat: coords.lat, lon: coords.lon, query: searchQuery || undefined, radius: 2000, tags: selectedTags })
        const normalized: MapPlace[] = (res.results || []).map((r: any) => ({
          id: r.fsq_place_id,  // NEW: Updated field name for new API
          name: r.name,
          category: r.categories?.[0]?.name || "",
          rating: r.rating || 4.2,
          distance: r.distance ? `${Math.round((r.distance || 0) / 1000)} km` : "",
          tags: (r.categories || []).slice(0, 3).map((c: any) => c.name),
          // NEW: Use latitude/longitude instead of geocodes.main
          coordinates: { lat: r.latitude, lng: r.longitude },
          isOpen: true,
          priceLevel: 1,
        })).filter(p => p.coordinates.lat && p.coordinates.lng)
        setPlaces(normalized)
        if (normalized.length > 0) setSelectedPlace(normalized[0])
      } catch (e: any) {
        setError(e?.message || "Failed to fetch places")
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [coords, searchQuery, selectedTags])

  const mapPoints = useMemo(() => {
    if (selectedPlace) return [{ lat: coords?.lat || selectedPlace.coordinates.lat, lng: coords?.lon || selectedPlace.coordinates.lng }, selectedPlace.coordinates]
    return places.slice(0, 5).map((p) => p.coordinates)
  }, [selectedPlace, places, coords])

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="h-[calc(100vh-4rem)] relative">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={geoLoading ? "Detecting location..." : geoError ? "Location unavailable - search nearby" : "Search places..."}
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

        {/* Map Container with simple route/summary */}
        <div className="w-full h-full p-4">
          <MapWidget mode={selectedPlace ? "single" : "multi"} points={mapPoints} />
        </div>

        {/* Place Cards Drawer */}
        <div className="absolute bottom-0 left-0 right-0 bg-card border-t">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Nearby Places</h3>
              <Badge variant="secondary">{loading ? "…" : places.length} places</Badge>
            </div>
            {error && <div className="text-sm text-destructive mb-2">{error}</div>}
            {geoError && <div className="text-xs text-muted-foreground mb-2">{geoError}. You can still search manually.</div>}
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {places.map((place) => (
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
