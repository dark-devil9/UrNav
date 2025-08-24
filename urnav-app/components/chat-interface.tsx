"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Mic,
  Send,
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Map,
  Navigation,
  Star,
} from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant" | "suggestion"
  content: string
  timestamp: Date
  suggestions?: PlaceSuggestion[]
}

interface PlaceSuggestion {
  id: string
  name: string
  category: string
  rating: number
  distance: string
  tags: string[]
  image: string
}

const mockSuggestions: PlaceSuggestion[] = [
  {
    id: "1",
    name: "Cafe Coffee Day",
    category: "Coffee Shop",
    rating: 4.2,
    distance: "0.3 km",
    tags: ["Wi-Fi", "Budget-friendly"],
    image: "/cozy-coffee-shop.png",
  },
  {
    id: "2",
    name: "Central Park Library",
    category: "Library",
    rating: 4.5,
    distance: "0.8 km",
    tags: ["Quiet", "Free"],
    image: "/modern-library-interior.png",
  },
]

const quickActions = [
  { id: "plan-day", label: "Plan My Day", icon: Calendar },
  { id: "free-places", label: "Free Places Nearby", icon: MapPin },
  { id: "meet-friend", label: "Meet a Friend", icon: Users },
  { id: "ask-anything", label: "Ask Anything", icon: MessageCircle },
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hi! I'm URNAV, your navigation assistant. I can help you discover places, plan your day, or find the perfect spot to meet friends. What would you like to explore today?",
      timestamp: new Date(),
      suggestions: mockSuggestions,
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I found some great options for you! Here are some places that match your preferences:",
        timestamp: new Date(),
        suggestions: mockSuggestions,
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  const handleQuickAction = (actionId: string) => {
    const actionLabels = {
      "plan-day": "Help me plan my day",
      "free-places": "Show me free places nearby",
      "meet-friend": "I want to meet a friend",
      "ask-anything": "I have a question",
    }

    setInputValue(actionLabels[actionId as keyof typeof actionLabels] || "")
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    // Voice input logic would go here
  }

  return (
    <div className="flex h-full">
      {/* Chat Column */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* Message Bubble */}
              <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start space-x-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  {message.type === "assistant" && (
                    <Avatar className="h-8 w-8 bg-primary">
                      <AvatarFallback className="text-primary-foreground text-sm font-medium">UN</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.type === "user" ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {message.suggestions && (
                <div className="ml-11 space-y-3">
                  {message.suggestions.map((suggestion) => (
                    <PlaceCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t bg-card/50">
          <div className="flex flex-wrap gap-2 mb-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.id)}
                  className="rounded-full"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              )
            })}
          </div>

          {/* Input Area */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type or say what you need..."
                className="pr-12 rounded-full"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                size="sm"
                variant="ghost"
                className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 p-0 ${
                  isRecording ? "text-destructive" : "text-muted-foreground"
                }`}
                onClick={handleVoiceInput}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleSendMessage} disabled={!inputValue.trim()} className="rounded-full h-10 w-10 p-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contextual Panel - Hidden on mobile */}
      <div className="hidden lg:block w-80 border-l bg-muted/20">
        <div className="p-4 space-y-4">
          <h3 className="font-serif font-semibold">Nearby Places</h3>
          <div className="space-y-3">
            {mockSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  <img
                    src={suggestion.image || "/placeholder.svg"}
                    alt={suggestion.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm">{suggestion.name}</h4>
                  <p className="text-xs text-muted-foreground">{suggestion.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{suggestion.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{suggestion.distance}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlaceCard({ suggestion }: { suggestion: PlaceSuggestion }) {
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
                <span className="text-xs text-muted-foreground">{suggestion.distance}</span>
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
              <Button size="sm" className="h-7 text-xs">
                <Navigation className="h-3 w-3 mr-1" />
                Route
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                <ThumbsDown className="h-3 w-3 mr-1" />
                Not Helpful
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
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
