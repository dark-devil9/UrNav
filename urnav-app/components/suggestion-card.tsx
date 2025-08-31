"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Star, ThumbsDown, ThumbsUp, Map } from "lucide-react"
import { useMemory } from "@/hooks/use-memory"

export type Suggestion = {
  id: string
  name: string
  category: string
  rating: number
  distance: string
  tags: string[]
  image?: string
}

export function SuggestionCard({ suggestion, onRoute, onMap }: {
  suggestion: Suggestion
  onRoute?: (id: string) => void
  onMap?: (id: string) => void
}) {
  const { addDisliked, addPreference } = useMemory()

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-24 h-20 bg-muted flex-shrink-0">
          <img
            src={suggestion.image || "/placeholder.svg"}
            alt={suggestion.name}
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="flex-1 p-3">
          <div className="space-y-2">
            <div>
              <h4 className="font-medium text-sm">{suggestion.name}</h4>
              <p className="text-xs text-muted-foreground">{suggestion.category}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{suggestion.rating}</span>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs">{suggestion.distance}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {suggestion.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Button size="sm" className="h-7 text-xs" onClick={() => onRoute?.(suggestion.id)}>
                <Navigation className="h-3 w-3 mr-1" />
                Route
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-transparent"
                onClick={() => addPreference({ id: suggestion.id, name: suggestion.name })}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-transparent"
                onClick={() => addDisliked({ id: suggestion.id, name: suggestion.name })}
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                Not Helpful
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent" onClick={() => onMap?.(suggestion.id)}>
                <Map className="h-3 w-3 mr-1" />
                Map
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}


