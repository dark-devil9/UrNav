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
  Sparkles,
  Trash2,
  Loader2,
} from "lucide-react"
import { FloatingMic } from "@/components/floating-mic"
import { SuggestionCard, type Suggestion } from "@/components/suggestion-card"
import { useGeo } from "@/hooks/use-geo"
import { toast } from "sonner"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

interface UserInfo {
  name: string | null
  location: any
  preferences: string[]
}

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: null,
    location: null,
    preferences: []
  })
  const [userId, setUserId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { coords } = useGeo()

  // Initialize chat with welcome message
  useEffect(() => {
    if (messages.length === 0 && coords) {
      const welcomeMsg: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: `Hi! I'm URNAV, your AI travel companion! I can see you're near coordinates (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}). I can help you discover amazing places, answer questions, and plan your adventures. What would you like to explore today?`,
        timestamp: new Date(),
      }
      setMessages([welcomeMsg])
      
      // Generate unique user ID
      setUserId(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [coords, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !coords) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          user_id: userId, // Always send the current userId
          location: {
            lat: coords.lat,
            lon: coords.lon,
            name: `Near coordinates (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Update userId if the backend generated a new one (first request)
      if (data.user_id && data.user_id !== userId) {
        console.log(`Updating userId from ${userId} to ${data.user_id}`)
        setUserId(data.user_id)
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Update user info if provided
      if (data.user_info) {
        setUserInfo(data.user_info)
      }

    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I'm having trouble processing your message right now. Please try again!",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error("Failed to send message")
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickAction = (action: string) => {
    const actionMessages = {
      "plan-day": "Help me plan my day with some interesting activities",
      "free-places": "Show me free places to visit around here",
      "meet-friend": "I want to find a good meeting spot with my friend",
      "ask-anything": "What are the best attractions near me?"
    }
    
    const message = actionMessages[action as keyof typeof actionMessages] || "What should I explore today?"
    setInputValue(message)
  }

  const clearChat = async () => {
    try {
      if (!userId) {
        toast.error("No active conversation to clear")
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/chat/user/${userId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setMessages([])
        setUserInfo({ name: null, location: null, preferences: [] })
        // Generate a new userId for fresh conversation
        setUserId(`user_${Date.now()}`)
        toast.success("Chat cleared successfully")
      }
    } catch (error) {
      console.error("Error clearing chat:", error)
      toast.error("Failed to clear chat")
    }
  }

  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/places/geocode?query=${lat},${lon}`)
      if (response.ok) {
        const data = await response.json()
        if (data.name && data.name !== `${lat},${lon}`) {
          return data.name
        }
      }
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    } catch (error) {
      console.error('Error getting location name:', error)
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
  }

  // Update location display when coords change
  useEffect(() => {
    if (coords) {
      getLocationName(coords.lat, coords.lon).then(locationName => {
        setUserInfo(prev => ({
          ...prev,
          location: {
            lat: coords.lat,
            lon: coords.lon,
            name: locationName
          }
        }))
      })
    }
  }, [coords])

  return (
    <div className="flex h-full">
      {/* Chat Column */}
      <div className="flex-1 flex flex-col">
        {/* Header with Location */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                {userInfo.location?.name || "Getting location..."}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {userInfo.name && (
                <Badge variant="secondary">
                  👤 {userInfo.name}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="h-8 px-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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
                    <div className="relative h-8 w-8 rounded-full grid place-items-center bg-primary">
                      <Avatar className="h-8 w-8 opacity-0">
                        <AvatarFallback>UN</AvatarFallback>
                      </Avatar>
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.type === "user" ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="relative h-8 w-8 rounded-full grid place-items-center bg-primary">
                  <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                </div>
                <div className="bg-card border shadow-sm rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-card">
          <div className="flex items-center space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about places, travel, or just say hi..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping || !coords}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("plan-day")}
              disabled={isTyping}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Plan My Day
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("free-places")}
              disabled={isTyping}
              className="text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Free Places
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("meet-friend")}
              disabled={isTyping}
              className="text-xs"
            >
              <Users className="h-3 w-3 mr-1" />
              Meet Friend
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("ask-anything")}
              disabled={isTyping}
              className="text-xs"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Ask Anything
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
 
