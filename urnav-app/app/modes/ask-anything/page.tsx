"use client"

import { useState, useRef, useEffect } from "react"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Send, Mic, MessageCircle, Lightbulb } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
}

const exampleQueries = [
  "Show quiet cafés with Wi-Fi under 2 km",
  "Prefer vegetarian-friendly next time",
  "Don't show Starbucks again",
  "Find free places for studying",
  "Best local food spots in Old City",
  "Pet-friendly parks nearby",
]

const mockResponses = [
  "I found 5 quiet cafés with Wi-Fi within 2 km of your location. Here are the top recommendations based on your preferences.",
  "Got it! I've updated your preferences to prioritize vegetarian-friendly places. This will improve future suggestions.",
  "Understood. I've added Starbucks to your disliked places and won't show it in future recommendations.",
  "Here are some great free study spots I found for you, including libraries and quiet cafés with free Wi-Fi.",
]

export default function AskAnythingPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hi! I'm here to help with any location-related questions. You can ask me about places, update your preferences, or get personalized recommendations. What would you like to know?",
      timestamp: new Date(),
      suggestions: exampleQueries.slice(0, 3),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (message?: string) => {
    const messageText = message || inputValue
    if (!messageText.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: randomResponse,
        timestamp: new Date(),
        suggestions: exampleQueries.slice(3, 6),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    // Voice input logic would go here
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-4 p-4 border-b">
          <Link href="/modes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h1 className="font-serif text-xl font-bold text-foreground">Ask Anything</h1>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* Message Bubble */}
              <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start space-x-3 max-w-[85%] ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
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
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {message.suggestions && (
                <div className={`${message.type === "user" ? "mr-11" : "ml-11"} space-y-2`}>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Lightbulb className="h-3 w-3" />
                    <span>Try asking:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs h-auto py-2 px-3 rounded-full bg-transparent hover:bg-primary/10"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8 bg-primary">
                  <AvatarFallback className="text-primary-foreground text-sm font-medium">UN</AvatarFallback>
                </Avatar>
                <div className="bg-card border shadow-sm rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-card/50">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about places, preferences, or navigation..."
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
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="rounded-full h-10 w-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Examples */}
          <div className="mt-3 flex flex-wrap gap-2">
            {exampleQueries.slice(0, 3).map((query, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => handleSuggestionClick(query)}
                className="text-xs h-auto py-1 px-2 rounded-full text-muted-foreground hover:text-foreground"
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
