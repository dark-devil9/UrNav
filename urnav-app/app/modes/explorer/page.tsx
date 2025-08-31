"use client"

import { useEffect, useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useBudgetMode } from "@/hooks/use-budget"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MapPin, Clock, Star, Plus, Minus, DollarSign, Camera, Utensils, Building, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useGeo } from "@/hooks/use-geo"
import { reverseGeocode, explorer } from "@/lib/api"
import { usePlacesData } from "@/hooks/use-places-data"
import { toast } from "sonner"

interface Attraction {
  id: string
  name: string
  category: string
  rating?: number
  distance: string
  estimatedTime?: string
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
  {
    id: "5",
    name: "Albert Hall Museum",
    category: "Cultural Museum",
    rating: 4.4,
    distance: "3.5 km",
    estimatedTime: "2.5 hours",
    tags: ["Museum", "Art", "History"],
    image: "/museum.png",
    priceLevel: 2,
    isAdded: false,
  },
  {
    id: "6",
    name: "Amber Fort",
    category: "Historical Fort",
    rating: 4.7,
    distance: "11.2 km",
    estimatedTime: "3 hours",
    tags: ["Fort", "Palace", "Architecture"],
    image: "/fort.png",
    priceLevel: 2,
    isAdded: false,
  },
  {
    id: "7",
    name: "Lassiwala",
    category: "Local Food",
    rating: 4.2,
    distance: "1.8 km",
    estimatedTime: "1 hour",
    tags: ["Food", "Lassi", "Traditional"],
    image: "/food.png",
    priceLevel: 1,
    isAdded: false,
  },
  {
    id: "8",
    name: "Rawat Misthan Bhandar",
    category: "Local Restaurant",
    rating: 4.3,
    distance: "2.3 km",
    estimatedTime: "1.5 hours",
    tags: ["Restaurant", "Traditional", "Sweets"],
    image: "/restaurant.png",
    priceLevel: 1,
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
  const { coords, loading: geoLoading } = useGeo()
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const { budgetMode, setBudgetMode } = useBudgetMode()
  const [selectedCategory, setSelectedCategory] = useState("must-see")
  const [totalCost, setTotalCost] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [locationName, setLocationName] = useState("Discover Jaipur")
  const { explorerPlaces, loading, fetchExplorerPlaces, refreshExplorerPlaces } = usePlacesData()

  // Get location name from coordinates
  useEffect(() => {
    const getLocationName = async () => {
      if (!coords) return
      
      try {
        const locationData = await reverseGeocode(coords.lat, coords.lon)
        if (locationData?.name) {
          // Extract city name from the full location name
          const cityName = locationData.name.split(',')[0] || locationData.name
          setLocationName(`Discover ${cityName}`)
        }
      } catch (err) {
        console.error("Error getting location name:", err)
        // Fallback to generic name
        setLocationName("Discover Nearby")
      }
    }

    getLocationName()
  }, [coords])

  // Transform explorer places data to Attraction format
  useEffect(() => {
    console.log("Explorer places data:", explorerPlaces)
    console.log("Loading state:", loading.explorer)
    
    if (explorerPlaces && explorerPlaces.length > 0) {
      const realAttractions: Attraction[] = explorerPlaces.map((place: any, index: number) => {
        console.log("Processing place:", place)
        return {
          id: place.fsq_place_id || `place-${index}`,
          name: place.name || "Unknown Place",
          category: place.categories?.[0]?.name || "Attraction",
          rating: place.rating,
          distance: place.distance ? `${Math.round(place.distance / 1000)} km` : "1 km",
          estimatedTime: undefined,
          tags: (place.categories || []).slice(0, 3).map((c: any) => c.name),
          image: place.photo_url || "/placeholder.svg",
          priceLevel: 1, // Default to affordable
          isAdded: false,
        }
      })
      
      setAttractions(realAttractions)
      console.log("Loaded", realAttractions.length, "real attractions from hook")
      console.log("Sample attraction:", realAttractions[0])
    } else if (explorerPlaces.length === 0 && !loading.explorer) {
      console.log("No explorer places data, using mock data")
      // Fallback to mock data if no API data
      setAttractions(mockAttractions)
    }
  }, [explorerPlaces, loading.explorer])

  // Fetch data when category changes
  useEffect(() => {
    if (coords) {
      console.log("Fetching explorer places for category:", selectedCategory)
      fetchExplorerPlaces(selectedCategory)
    }
  }, [coords, selectedCategory, fetchExplorerPlaces])

  // Fallback: If hook doesn't work, use direct API call
  useEffect(() => {
    const loadDirectly = async () => {
      if (!coords || explorerPlaces.length > 0) return
      
      console.log("Hook not working, trying direct API call...")
      try {
        let data
        if (selectedCategory === "must-see") {
          // Nearby search for must-see places (5km from user location)
          data = await explorer(coords.lat, coords.lon, 5000)
        } else if (selectedCategory === "cultural") {
          // City-wide search for cultural landmarks (50km radius from Jaipur center)
          data = await explorer(26.9344, 75.9231, 50000)
        } else if (selectedCategory === "historical") {
          // City-wide search for historical landmarks (50km radius from Jaipur center)
          data = await explorer(26.9344, 75.9231, 50000)
        } else if (selectedCategory === "food") {
          // Medium radius for food places (25km radius from Jaipur center)
          data = await explorer(26.9344, 75.9231, 25000)
        } else {
          // Default city-wide search (20km radius)
          data = await explorer(26.9344, 75.9231, 20000)
        }
        
        if (data && data.results) {
          console.log("Direct API call successful:", data.results.length, "places")
          const realAttractions: Attraction[] = data.results.map((place: any, index: number) => ({
            id: place.fsq_place_id || `place-${index}`,
            name: place.name || "Unknown Place",
            category: place.categories?.[0]?.name || "Attraction",
            rating: place.rating,
            distance: place.distance ? `${Math.round(place.distance / 1000)} km` : "1 km",
            estimatedTime: undefined,
            tags: (place.categories || []).slice(0, 3).map((c: any) => c.name),
            image: place.photo_url || "/placeholder.svg",
            priceLevel: 1,
            isAdded: false,
          }))
          setAttractions(realAttractions)
        }
      } catch (err) {
        console.error("Direct API call failed:", err)
      }
    }
    
    loadDirectly()
  }, [coords, selectedCategory, explorerPlaces.length])

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
    if (!attraction.estimatedTime) return acc
    const hours = Number.parseFloat(attraction.estimatedTime)
    return acc + hours
  }, 0)

  const getPriceDisplay = (level: number) => {
    if (level === 0) return "Free"
    return "₹" + level * 100
  }

  // Filter attractions based on selected category and budget mode
  const filteredAttractions = attractions.filter((attraction) => {
    // First filter by category - make cultural and historical DISTINCT
    let categoryMatch = true
    
    if (selectedCategory === "cultural") {
      // CULTURAL: Museums, galleries, theaters, arts, cultural centers
      categoryMatch = attraction.category.toLowerCase().includes("museum") ||
                     attraction.category.toLowerCase().includes("gallery") ||
                     attraction.category.toLowerCase().includes("theater") ||
                     attraction.category.toLowerCase().includes("arts") ||
                     attraction.category.toLowerCase().includes("cultural") ||
                     attraction.category.toLowerCase().includes("performing") ||
                     attraction.category.toLowerCase().includes("exhibition") ||
                     attraction.category.toLowerCase().includes("concert") ||
                     attraction.category.toLowerCase().includes("cinema") ||
                     attraction.category.toLowerCase().includes("auditorium")
    } else if (selectedCategory === "historical") {
      // HISTORICAL: Monuments, forts, temples, ancient sites, ruins
      categoryMatch = attraction.category.toLowerCase().includes("monument") ||
                     attraction.category.toLowerCase().includes("fort") ||
                     attraction.category.toLowerCase().includes("temple") ||
                     attraction.category.toLowerCase().includes("mosque") ||
                     attraction.category.toLowerCase().includes("church") ||
                     attraction.category.toLowerCase().includes("tomb") ||
                     attraction.category.toLowerCase().includes("ruins") ||
                     attraction.category.toLowerCase().includes("ancient") ||
                     attraction.category.toLowerCase().includes("historical") ||
                     attraction.category.toLowerCase().includes("palace") ||
                     attraction.category.toLowerCase().includes("heritage") ||
                     attraction.category.toLowerCase().includes("archaeological")
    } else if (selectedCategory === "food") {
      // FOOD: Restaurants, cafes, food markets, bakeries
      categoryMatch = attraction.category.toLowerCase().includes("restaurant") ||
                     attraction.category.toLowerCase().includes("cafe") ||
                     attraction.category.toLowerCase().includes("bakery") ||
                     attraction.category.toLowerCase().includes("food") ||
                     attraction.category.toLowerCase().includes("dining") ||
                     attraction.category.toLowerCase().includes("eatery") ||
                     attraction.category.toLowerCase().includes("bistro") ||
                     attraction.category.toLowerCase().includes("pub") ||
                     attraction.category.toLowerCase().includes("bar")
    }
    
    // STRICT EXCLUSION for cultural and historical - NO STORES, NO LABS, NO COMMERCIAL
    if ((selectedCategory === "cultural" || selectedCategory === "historical") && categoryMatch) {
      const excludeKeywords = [
        // Commercial/Retail
        "store", "shop", "market", "mall", "supermarket", "department store",
        "electronics store", "mobile store", "phone store", "clothing store", 
        "fashion store", "jewelry store", "shoe store", "bookstore",
        
        // Medical/Technical
        "lab", "laboratory", "clinic", "hospital", "medical", "pharmacy", 
        "diagnostic", "pathology", "radiology", "dental", "optical",
        
        // Business/Office
        "bank", "atm", "office", "business", "commercial", "retail", 
        "corporate", "company", "enterprise", "agency", "consultancy",
        
        // Services
        "salon", "spa", "gym", "fitness", "beauty", "wellness", "repair",
        "maintenance", "service center", "workshop", "garage", "car wash",
        
        // Generic commercial terms
        "center", "plaza", "complex", "building", "tower", "block"
      ]
      
      const shouldExclude = excludeKeywords.some(keyword => 
        attraction.name.toLowerCase().includes(keyword) || 
        attraction.category.toLowerCase().includes(keyword) ||
        attraction.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
      
      if (shouldExclude) {
        console.log(`🚫 EXCLUDING ${attraction.name} (${attraction.category}) - commercial/retail/service place`)
        return false
      }
    }
    
    // Debug logging
    if (selectedCategory !== "must-see") {
      console.log(`✅ KEEPING ${attraction.name} (${attraction.category}) for ${selectedCategory}: ${categoryMatch}`)
    }
    
    // "must-see" shows all attractions without filtering
    
    // Then filter by budget mode if enabled
    if (budgetMode) {
      return categoryMatch && attraction.priceLevel <= 1
    }
    
    return categoryMatch
  })

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-8 max-w-6xl">
        <div className="space-y-6">
          {(loading.explorer || geoLoading) && (
            <div className="text-center text-sm text-muted-foreground">
              {geoLoading ? "Getting your location..." : 
               selectedCategory === "must-see" ? "Loading nearby attractions..." : "Loading city-wide attractions..."}
            </div>
          )}
          {error && <div className="text-center text-destructive text-sm">{error}</div>}
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/modes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold text-foreground">{locationName}</h1>
              <p className="text-muted-foreground">
                {selectedCategory === "must-see" 
                  ? "Explore nearby attractions and must-see places" 
                  : selectedCategory === "cultural" 
                  ? "Discover cultural landmarks and heritage sites"
                  : selectedCategory === "historical"
                  ? "Visit historical places and monuments"
                  : selectedCategory === "food"
                  ? "Find local food spots and restaurants"
                  : "Explore attractions, culture, and local experiences"
                }
              </p>
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
            <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {totalTime > 0 && (
                      <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                        <Clock className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-semibold text-gray-700">{totalTime.toFixed(1)} hours planned</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-700">₹{totalCost} estimated cost</span>
                    </div>
                  </div>
                  {budgetMode && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg px-4 py-2 rounded-full font-medium">
                      Budget mode active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories and Refresh */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transform"
                        : "bg-white hover:bg-green-50 border-green-200 hover:border-green-300 text-green-700 hover:text-green-800 hover:scale-105 transform shadow-sm hover:shadow-md"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.label}</span>
                  </Button>
                )
              })}
            </div>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshExplorerPlaces(selectedCategory)}
              disabled={loading.explorer}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 text-green-700 hover:text-green-800 shadow-sm hover:shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${loading.explorer ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Attractions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAttractions.map((attraction) => (
              <Card 
                key={attraction.id} 
                className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer"
              >
                {/* Background gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-transparent to-emerald-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={attraction.image || "/placeholder.svg"}
                    alt={attraction.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  {/* Enhanced price badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600/90 text-white border-0 shadow-lg backdrop-blur-sm">
                      {getPriceDisplay(attraction.priceLevel)}
                    </Badge>
                  </div>
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                {/* Enhanced card content */}
                <CardContent className="p-6 space-y-4 relative z-10">
                  {/* Title and rating section */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-serif text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors duration-300 line-clamp-2">
                        {attraction.name}
                      </h3>
                      {attraction.rating && (
                        <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-yellow-700">{attraction.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium bg-green-100/50 px-3 py-1 rounded-full inline-block">
                      {attraction.category}
                    </p>
                  </div>
                  {/* Distance and time with enhanced styling */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-700">{attraction.distance}</span>
                    </div>
                    {attraction.estimatedTime && (
                      <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-700">{attraction.estimatedTime}</span>
                      </div>
                    )}
                  </div>
                  {/* Enhanced tags */}
                  <div className="flex flex-wrap gap-2">
                    {attraction.tags.slice(0, 3).map((tag, index) => (
                      <Badge 
                        key={index} 
                        className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 hover:from-green-200 hover:to-emerald-200 transition-all duration-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {/* Enhanced action buttons */}
                  <div className="flex space-x-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAttraction(attraction.id)}
                      className="flex-1 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 text-green-700 hover:text-green-800 transition-all duration-300 shadow-sm hover:shadow-md"
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
