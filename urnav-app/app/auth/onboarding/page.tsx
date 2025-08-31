"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Compass, Wifi, Leaf, Volume2, Heart, DollarSign, Trees, BookOpen, Camera, Coffee } from "lucide-react"
import Image from "next/image"

const preferenceCategories = [
  { id: "wifi-cafes", label: "Wi-Fi cafés", icon: Wifi, selected: false },
  { id: "vegetarian", label: "Vegetarian food", icon: Leaf, selected: false },
  { id: "quiet-spaces", label: "Quiet spaces", icon: Volume2, selected: false },
  { id: "pet-friendly", label: "Pet-friendly", icon: Heart, selected: false },
  { id: "budget-friendly", label: "Budget-friendly", icon: DollarSign, selected: false },
  { id: "parks", label: "Parks", icon: Trees, selected: false },
  { id: "libraries", label: "Libraries", icon: BookOpen, selected: false },
  { id: "museums", label: "Free museums", icon: Camera, selected: false },
  { id: "street-food", label: "Street food", icon: Coffee, selected: false },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState(preferenceCategories)
  const [showMore, setShowMore] = useState(false)

  const togglePreference = (id: string) => {
    setPreferences((prev) => prev.map((pref) => (pref.id === id ? { ...pref, selected: !pref.selected } : pref)))
  }

  const handleSavePreferences = () => {
    const selectedPrefs = preferences.filter((p) => p.selected)
    console.log("Selected preferences:", selectedPrefs)
    // Save preferences and redirect to home
    router.push("/")
  }

  const visiblePreferences = showMore ? preferences : preferences.slice(0, 5)
  const selectedCount = preferences.filter((p) => p.selected).length

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo and Progress */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary overflow-hidden">
              <Image 
                src="/urnavlogo.jpeg" 
                alt="UrNav Logo" 
                width={48} 
                height={48}
                className="object-cover"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-foreground">What do you like?</h1>
            <p className="text-sm text-muted-foreground">Help us personalize your navigation experience</p>
          </div>
          <div className="space-y-2">
            <Progress value={33} className="w-full max-w-xs mx-auto" />
            <p className="text-xs text-muted-foreground">Step 1 of 3</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-serif">Choose Your Preferences</CardTitle>
            <CardDescription>
              Select the types of places and experiences you enjoy. You can change these later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preference Tags */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 justify-center">
                {visiblePreferences.map((pref) => {
                  const Icon = pref.icon
                  return (
                    <Badge
                      key={pref.id}
                      variant={pref.selected ? "default" : "secondary"}
                      className={`cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 ${
                        pref.selected ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                      }`}
                      onClick={() => togglePreference(pref.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {pref.label}
                    </Badge>
                  )
                })}
              </div>

              {!showMore && (
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowMore(true)}
                    className="text-primary hover:text-primary/80"
                  >
                    More...
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Count */}
            {selectedCount > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {selectedCount} preference{selectedCount !== 1 ? "s" : ""} selected
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => router.push("/auth/login")} className="flex-1">
                Skip for now
              </Button>
              <Button onClick={handleSavePreferences} disabled={selectedCount === 0} className="flex-1">
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Your preferences help us suggest better places. We respect your privacy and you can update these settings
            anytime in your profile.
          </p>
        </div>
      </div>
    </div>
  )
}
