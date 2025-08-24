"use client"

import { useState } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, X, Star, MapPin, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Place {
  id: string
  name: string
  category: string
  rating: number
  distance: string
  tags: string[]
  image: string
  isFree: boolean
}

const mockPlaces: Place[] = [
  {
    id: "1",
    name: "Central Park",
    category: "Public Park",
    rating: 4.5,
    distance: "0.8 km",
    tags: ["Free", "Nature", "Walking trails"],
    image: "/beautiful-park-with-trees.png",
    isFree: true,
  },
  {
    id: "2",
    name: "City Art Gallery",
    category: "Art Gallery",
    rating: 4.3,
    distance: "1.2 km",
    tags: ["Free", "Culture", "Art exhibitions"],
    image: "/modern-art-gallery.png",
    isFree: true,
  },
  {
    id: "3",
    name: "Riverside Walking Path",
    category: "Walking Trail",
    rating: 4.7,
    distance: "2.1 km",
    tags: ["Free", "Exercise", "Scenic views"],
    image: "/riverside-walking-path.png",
    isFree: true,
  },
]

const categories = ["All", "Parks", "Libraries", "Museums", "Cafés", "Events"]

export default function FreePlacesPage() {
  const [places, setPlaces] = useState(mockPlaces)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [likedPlaces, setLikedPlaces] = useState<string[]>([])

  const currentPlace = places[currentIndex]

  const handleLike = () => {
    if (currentPlace) {
      setLikedPlaces([...likedPlaces, currentPlace.id])
      nextPlace()
    }
  }

  const handleDislike = () => {
    nextPlace()
  }

  const nextPlace = () => {
    if (currentIndex < places.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Reset or load more places
      setCurrentIndex(0)
    }
  }

  const refreshPlaces = () => {
    setCurrentIndex(0)
    // In a real app, this would fetch new places
  }

  if (!currentPlace) {
    return (
      <div className="min-h-screen">
        <TopNavigation />
        <main className="container mx-auto px-4 py-6 pb-20 md:pb-8 max-w-2xl">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl font-bold">No more places today!</h2>
            <p className="text-muted-foreground">Come back tomorrow for fresh recommendations</p>
            <Button onClick={refreshPlaces}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </main>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-8 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/modes">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Free Places</h1>
                <p className="text-muted-foreground">Discover amazing places that won't cost you</p>
              </div>
            </div>
            <Button variant="outline" onClick={refreshPlaces}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Place Card */}
          <Card className="overflow-hidden shadow-lg">
            <div className="aspect-[4/3] relative">
              <img
                src={currentPlace.image || "/placeholder.svg"}
                alt={currentPlace.name}
                className="w-full h-full object-cover"
              />
              {currentPlace.isFree && (
                <Badge className="absolute top-4 left-4 bg-green-500 hover:bg-green-600">Free</Badge>
              )}
              <div className="absolute top-4 right-4 bg-black/50 rounded-full px-2 py-1">
                <span className="text-white text-sm">
                  {currentIndex + 1} / {places.length}
                </span>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-bold">{currentPlace.name}</h2>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{currentPlace.rating}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span className="text-sm">{currentPlace.category}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm">{currentPlace.distance}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentPlace.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button variant="outline" size="lg" onClick={handleDislike} className="flex-1 bg-transparent">
                  <X className="h-5 w-5 mr-2" />
                  Pass
                </Button>
                <Button size="lg" onClick={handleLike} className="flex-1">
                  <Heart className="h-5 w-5 mr-2" />
                  Like
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liked Places Counter */}
          {likedPlaces.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Liked Places</span>
                </div>
                <Badge variant="secondary">{likedPlaces.length}</Badge>
              </div>
            </Card>
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
