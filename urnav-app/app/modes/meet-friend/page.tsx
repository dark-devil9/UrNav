"use client"

import { useState, useEffect } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, Clock, Star, ArrowLeft, Share, Navigation, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { geocode, meetFriend as meetFriendApi } from "@/lib/api"
import { MapWidget } from "@/components/map-widget"
import { toast } from "sonner"
import ErrorBoundary from "@/components/error-boundary"

const activities = [
  { value: "any", label: "Any activity" },
  { value: "coffee", label: "Coffee & Chat" },
  { value: "lunch", label: "Lunch" },
  { value: "study", label: "Study Together" },
  { value: "walk", label: "Walk & Talk" },
  { value: "shopping", label: "Shopping" },
  { value: "custom", label: "Custom activity" },
]

function MeetFriendPageContent() {
  const [userLocation, setUserLocation] = useState("")
  const [friendLocation, setFriendLocation] = useState("")
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [friendCoords, setFriendCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [selectedActivity, setSelectedActivity] = useState("any")
  const [customActivity, setCustomActivity] = useState("")
  const [isGenerated, setIsGenerated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [midpoint, setMidpoint] = useState<{ lat: number; lon: number } | null>(null)
  const [venues, setVenues] = useState<any[]>([])

  const [filters, setFilters] = useState({
    budget: false,
    wifi: false,
    quiet: false,
    vegetarian: false,
  })

  // Reset error and coordinates when inputs change
  useEffect(() => {
    if (error) setError(null)
    setUserCoords(null)
    setFriendCoords(null)
  }, [userLocation, friendLocation, selectedActivity, customActivity])

  const doMeetFriend = async () => {
    if (!friendLocation || !userLocation) {
      toast.error("Please enter both locations")
      return
    }

    if (selectedActivity === "custom" && !customActivity.trim()) {
      toast.error("Please enter a custom activity")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Geocode user location
      const user = await geocode(userLocation)
      if (!user?.lat || !user?.lon) {
        throw new Error("Could not find your location. Please try a different address.")
      }
      setUserCoords({ lat: user.lat, lon: user.lon })

      // Geocode friend location
      const friend = await geocode(friendLocation, { lat: user.lat, lon: user.lon })
      if (!friend?.lat || !friend?.lon) {
        throw new Error("Could not find your friend's location. Please try a different address.")
      }
      setFriendCoords({ lat: friend.lat, lon: friend.lon })

      // Calculate the actual midpoint
      const actualMidpoint = {
        lat: (user.lat + friend.lat) / 2,
        lon: (user.lon + friend.lon) / 2
      }

      // Calculate distance between friends to ensure reasonable search radius
      const distanceKm = calculateDistance(user.lat, user.lon, friend.lat, friend.lon)
      const searchRadius = Math.min(Math.max(distanceKm * 500, 500), 2000) // 500m to 2km, proportional to distance

      // Get meeting suggestions
      const res = await meetFriendApi(
        { lat: user.lat, lon: user.lon }, 
        { lat: friend.lat, lon: friend.lon }, 
        selectedActivity === "custom" ? customActivity.trim() : 
        selectedActivity === "any" ? undefined : selectedActivity,
        searchRadius
      )

      if (!res?.midpoint || !res?.results) {
        throw new Error("No meeting spots found. Please try different locations or activities.")
      }

      setMidpoint(res.midpoint)
      setVenues(res.results || [])
      setIsGenerated(true)
      toast.success("Found great meeting spots!")
      
    } catch (e: any) {
      console.error("Meet friend error:", e)
      const errorMessage = e?.message || "Failed to find meeting spots. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getPriceDisplay = (level: number) => {
    if (level === 0) return "Free"
    return "₹".repeat(level)
  }

  const handleRetry = () => {
    setError(null)
    setIsGenerated(false)
    setVenues([])
    setMidpoint(null)
    setUserCoords(null)
    setFriendCoords(null)
  }

  // Show error state
  if (error && !isGenerated) {
    return (
      <div className="min-h-screen">
        <TopNavigation />
        <main className="container mx-auto px-4 py-6 pb-20 md:pb-8 max-w-4xl">
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/modes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Meet a Friend</h1>
            </div>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-muted-foreground">{error}</p>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    )
  }

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
              <h1 className="font-serif text-2xl font-bold text-foreground">Meet a Friend</h1>
              <p className="text-muted-foreground">Find the perfect midpoint to meet someone</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Meeting Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-location">Your Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-location"
                      value={userLocation}
                      onChange={(e) => setUserLocation(e.target.value)}
                      className="pl-10"
                      placeholder="Enter your location (address or place)"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="friend-location">Friend's Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="friend-location"
                      value={friendLocation}
                      onChange={(e) => setFriendLocation(e.target.value)}
                      className="pl-10"
                      placeholder="Enter friend's location or share link"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>What do you want to do together?</Label>
                  <Select value={selectedActivity} onValueChange={setSelectedActivity} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.value} value={activity.value}>
                          {activity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedActivity === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-activity">Custom Activity</Label>
                      <Input
                        id="custom-activity"
                        value={customActivity}
                        onChange={(e) => setCustomActivity(e.target.value)}
                        placeholder="e.g., Board games, Karaoke, Art class..."
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => (
                      <Button
                        key={key}
                        variant={value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters({ ...filters, [key]: !value })}
                        disabled={loading}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={doMeetFriend} 
                  className="w-full" 
                  disabled={!friendLocation || !userLocation || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finding...
                    </>
                  ) : (
                    "Find Meeting Spots"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {isGenerated && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Suggested Venues</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Share Plan
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Midpoint Map Preview */}
                  <div className="aspect-video">
                    <MapWidget
                      mode="single"
                      points={midpoint ? [{ lat: midpoint.lat, lng: midpoint.lon }] : []}
                    />
                  </div>

                  {/* Venue List */}
                  <div className="space-y-3">
                    {venues.length > 0 ? (
                      venues.map((v: any) => (
                        <div key={v.fsq_place_id || v.name} className="p-4 border rounded-lg space-y-3">
                          {/* Photo Section */}
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            {v.photos && v.photos.length > 0 ? (
                              <img 
                                src={v.photos[0]} 
                                alt={v.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center text-muted-foreground ${v.photos && v.photos.length > 0 ? 'hidden' : ''}`}>
                              <MapPin className="h-8 w-8 opacity-50" />
                              <span className="ml-2 text-sm">No photo available</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{v.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {(v.categories?.[0]?.name) || "Venue"}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{(v.rating || 4).toFixed(1)}</span>
                              </div>
                              <Badge variant="outline">₹₹</Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <span>From midpoint: ~{midpoint && v.latitude && v.longitude ? calculateDistance(midpoint.lat, midpoint.lon, v.latitude, v.longitude).toFixed(1) : '0.0'} km</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>Near midpoint</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button size="sm" className="flex-1">
                              <Navigation className="h-3 w-3 mr-1" />
                              Get Directions
                            </Button>
                            <Button size="sm" variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              View on Map
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No venues found in this area</p>
                        <p className="text-sm">Try adjusting your search criteria</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Finding the perfect meeting spots...</p>
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

export default function MeetFriendPage() {
  return (
    <ErrorBoundary>
      <MeetFriendPageContent />
    </ErrorBoundary>
  )
}
