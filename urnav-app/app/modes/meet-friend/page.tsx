"use client"

import { useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, Clock, Star, ArrowLeft, Share, Navigation } from "lucide-react"
import Link from "next/link"

interface Venue {
  id: string
  name: string
  category: string
  rating: number
  distanceFromUser: string
  distanceFromFriend: string
  tags: string[]
  priceLevel: number
}

const mockVenues: Venue[] = [
  {
    id: "1",
    name: "Central Cafe",
    category: "Coffee Shop",
    rating: 4.3,
    distanceFromUser: "1.2 km",
    distanceFromFriend: "0.8 km",
    tags: ["Wi-Fi", "Quiet", "Good coffee"],
    priceLevel: 2,
  },
  {
    id: "2",
    name: "City Park",
    category: "Public Park",
    rating: 4.5,
    distanceFromUser: "0.9 km",
    distanceFromFriend: "1.1 km",
    tags: ["Free", "Outdoor", "Walking"],
    priceLevel: 0,
  },
  {
    id: "3",
    name: "Food Court Plaza",
    category: "Food Court",
    rating: 4.1,
    distanceFromUser: "1.5 km",
    distanceFromFriend: "0.7 km",
    tags: ["Variety", "Indoor", "Parking"],
    priceLevel: 2,
  },
]

const activities = [
  { value: "", label: "Any activity" },
  { value: "coffee", label: "Coffee & Chat" },
  { value: "lunch", label: "Lunch" },
  { value: "study", label: "Study Together" },
  { value: "walk", label: "Walk & Talk" },
  { value: "shopping", label: "Shopping" },
]

export default function MeetFriendPage() {
  const [userLocation, setUserLocation] = useState("Jaipur, Rajasthan")
  const [friendLocation, setFriendLocation] = useState("")
  const [selectedActivity, setSelectedActivity] = useState("")
  const [isGenerated, setIsGenerated] = useState(false)
  const [filters, setFilters] = useState({
    budget: false,
    wifi: false,
    quiet: false,
    vegetarian: false,
  })

  const generateSuggestions = () => {
    if (friendLocation) {
      setIsGenerated(true)
    }
  }

  const getPriceDisplay = (level: number) => {
    if (level === 0) return "Free"
    return "₹".repeat(level)
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
                      placeholder="Enter your location"
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>What do you want to do together?</Label>
                  <Select value={selectedActivity} onValueChange={setSelectedActivity}>
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
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button onClick={generateSuggestions} className="w-full" disabled={!friendLocation}>
                  Find Meeting Spots
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
                  {/* Midpoint Map Placeholder */}
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Midpoint map with suggested venues</p>
                    </div>
                  </div>

                  {/* Venue List */}
                  <div className="space-y-3">
                    {mockVenues.map((venue) => (
                      <div key={venue.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{venue.name}</h4>
                            <p className="text-sm text-muted-foreground">{venue.category}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{venue.rating}</span>
                            </div>
                            <Badge variant="outline">{getPriceDisplay(venue.priceLevel)}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span>You: {venue.distanceFromUser}</span>
                            <span>Friend: {venue.distanceFromFriend}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>ETA: 15-20 min</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {venue.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
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
