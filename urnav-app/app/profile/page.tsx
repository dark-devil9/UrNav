"use client"

import { useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Clock,
  Heart,
  Trash2,
  RotateCcw,
  Settings,
  Shield,
  Edit,
  Navigation,
  Wifi,
  Leaf,
  Volume2,
  DollarSign,
} from "lucide-react"

interface Preference {
  id: string
  label: string
  icon: any
  selected: boolean
}

interface DislikedPlace {
  id: string
  name: string
  category: string
  reason: string
  date: string
}

interface PastSession {
  id: string
  title: string
  date: string
  stops: number
  mode: string
}

const mockPreferences: Preference[] = [
  { id: "wifi", label: "Wi-Fi cafés", icon: Wifi, selected: true },
  { id: "vegetarian", label: "Vegetarian food", icon: Leaf, selected: true },
  { id: "quiet", label: "Quiet spaces", icon: Volume2, selected: false },
  { id: "budget", label: "Budget-friendly", icon: DollarSign, selected: true },
  { id: "pet", label: "Pet-friendly", icon: Heart, selected: false },
]

const mockDislikedPlaces: DislikedPlace[] = [
  {
    id: "1",
    name: "Noisy Cafe",
    category: "Coffee Shop",
    reason: "Too loud",
    date: "2 days ago",
  },
  {
    id: "2",
    name: "Expensive Restaurant",
    category: "Restaurant",
    reason: "Over budget",
    date: "1 week ago",
  },
]

const mockPastSessions: PastSession[] = [
  {
    id: "1",
    title: "Shopping & Coffee Day",
    date: "Today",
    stops: 3,
    mode: "Plan My Day",
  },
  {
    id: "2",
    title: "Meet Sarah for Lunch",
    date: "Yesterday",
    stops: 1,
    mode: "Meet a Friend",
  },
  {
    id: "3",
    title: "Free Places Discovery",
    date: "3 days ago",
    stops: 5,
    mode: "Free Places",
  },
]

export default function ProfilePage() {
  const [preferences, setPreferences] = useState(mockPreferences)
  const [dislikedPlaces, setDislikedPlaces] = useState(mockDislikedPlaces)
  const [locationAwareness, setLocationAwareness] = useState(true)
  const [notifications, setNotifications] = useState(true)

  const togglePreference = (id: string) => {
    setPreferences((prev) => prev.map((pref) => (pref.id === id ? { ...pref, selected: !pref.selected } : pref)))
  }

  const removeDislikedPlace = (id: string) => {
    setDislikedPlaces((prev) => prev.filter((place) => place.id !== id))
  }

  const restoreAllDisliked = () => {
    setDislikedPlaces([])
  }

  const resetMemory = () => {
    // Reset all user data
    setDislikedPlaces([])
    // Would also reset other user data in a real app
  }

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder-avatar.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="font-serif text-2xl font-bold">John Doe</h1>
                  <p className="text-muted-foreground">john.doe@example.com</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Jaipur, Rajasthan</span>
                  </div>
                </div>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {preferences.map((pref) => {
                    const Icon = pref.icon
                    return (
                      <Badge
                        key={pref.id}
                        variant={pref.selected ? "default" : "secondary"}
                        className="cursor-pointer px-3 py-1 transition-all hover:scale-105"
                        onClick={() => togglePreference(pref.id)}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {pref.label}
                      </Badge>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click on preferences to toggle them. These help us suggest better places for you.
                </p>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Location Awareness</Label>
                    <p className="text-xs text-muted-foreground">Allow URNAV to use your location for suggestions</p>
                  </div>
                  <Switch checked={locationAwareness} onCheckedChange={setLocationAwareness} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Notifications</Label>
                    <p className="text-xs text-muted-foreground">Get notified about nearby places and updates</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Privacy & Data</Label>
                  <p className="text-xs text-muted-foreground">
                    Your data is used to improve suggestions and is never shared with third parties.
                  </p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Shield className="h-4 w-4 mr-2" />
                    View Privacy Policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disliked Places */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-5 w-5" />
                  <span>Disliked Places</span>
                </div>
                {dislikedPlaces.length > 0 && (
                  <Button variant="outline" size="sm" onClick={restoreAllDisliked}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dislikedPlaces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No disliked places yet</p>
                  <p className="text-xs">Places you mark as "Not Helpful" will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dislikedPlaces.map((place) => (
                    <div key={place.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{place.name}</h4>
                        <p className="text-xs text-muted-foreground">{place.category}</p>
                        <p className="text-xs text-muted-foreground">Reason: {place.reason}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">{place.date}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeDislikedPlace(place.id)}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Past Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPastSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Navigation className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{session.title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{session.date}</span>
                          <span>•</span>
                          <span>{session.stops} stops</span>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {session.mode}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Route
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                <span>Reset Memory</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will permanently delete all your preferences, disliked places, and session history. This action
                cannot be undone.
              </p>
              <Button variant="destructive" onClick={resetMemory}>
                <Trash2 className="h-4 w-4 mr-2" />
                Reset All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
