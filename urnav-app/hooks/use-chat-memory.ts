import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

export interface ChatMessage {
  id: string
  type: "user" | "assistant" | "suggestion"
  content: string
  timestamp: Date
  suggestions?: any[]
}

export interface UserContext {
  location: {
    lat: number
    lon: number
    name: string
  } | null
  preferences: string[]
  dislikes: string[]
  lastSearches: string[]
  budgetMode: boolean
}

const CHAT_MEMORY_KEY = "urnav_chat_memory"
const USER_CONTEXT_KEY = "urnav_user_context"

function readChatMemory(): ChatMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(CHAT_MEMORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Convert timestamp strings back to Date objects
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }
    return []
  } catch {
    return []
  }
}

function writeChatMemory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(messages))
}

function readUserContext(): UserContext {
  if (typeof window === "undefined") {
    return {
      location: null,
      preferences: [],
      dislikes: [],
      lastSearches: [],
      budgetMode: false
    }
  }
  try {
    const raw = window.localStorage.getItem(USER_CONTEXT_KEY)
    return raw ? JSON.parse(raw) : {
      location: null,
      preferences: [],
      dislikes: [],
      lastSearches: [],
      budgetMode: false
    }
  } catch {
    return {
      location: null,
      preferences: [],
      dislikes: [],
      lastSearches: [],
      budgetMode: false
    }
  }
}

function writeUserContext(context: UserContext) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(context))
}

export function useChatMemory() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = readChatMemory()
    // Don't add hardcoded welcome message - let the component handle it dynamically
    return saved
  })
  const [userContext, setUserContext] = useState<UserContext>(readUserContext)

  // Save messages to localStorage whenever they change
  useEffect(() => {
    writeChatMemory(messages)
  }, [messages])

  // Save user context to localStorage whenever it changes
  useEffect(() => {
    writeUserContext(userContext)
  }, [userContext])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    toast("Chat history cleared")
  }, [])

  const updateLocation = useCallback((lat: number, lon: number, name: string) => {
    setUserContext(prev => ({
      ...prev,
      location: { lat, lon, name }
    }))
    toast.success("Location updated", { description: `Now showing places near ${name}` })
  }, [])

  const addPreference = useCallback((preference: string) => {
    setUserContext(prev => ({
      ...prev,
      preferences: [...prev.preferences.filter(p => p !== preference), preference]
    }))
    toast.success("Preference saved", { description: `Added "${preference}" to your likes` })
  }, [])

  const removePreference = useCallback((preference: string) => {
    setUserContext(prev => ({
      ...prev,
      preferences: prev.preferences.filter(p => p !== preference)
    }))
    toast("Preference removed", { description: `Removed "${preference}" from your likes` })
  }, [])

  const addDislike = useCallback((dislike: string) => {
    setUserContext(prev => ({
      ...prev,
      dislikes: [...prev.dislikes.filter(d => d !== dislike), dislike]
    }))
    toast("Dislike saved", { description: `Added "${dislike}" to your dislikes` })
  }, [])

  const removeDislike = useCallback((dislike: string) => {
    setUserContext(prev => ({
      ...prev,
      dislikes: prev.dislikes.filter(d => d !== dislike)
    }))
    toast("Dislike removed", { description: `Removed "${dislike}" from your dislikes` })
  }, [])

  const addSearch = useCallback((search: string) => {
    setUserContext(prev => ({
      ...prev,
      lastSearches: [search, ...prev.lastSearches.filter(s => s !== search)].slice(0, 10)
    }))
  }, [])

  const setBudgetMode = useCallback((enabled: boolean) => {
    setUserContext(prev => ({
      ...prev,
      budgetMode: enabled
    }))
    if (enabled) {
      toast.success("Budget mode enabled", { description: "Filtering to affordable options" })
    } else {
      toast("Budget mode disabled", { description: "Showing all price ranges" })
    }
  }, [])

  const getContextualPrompt = useCallback(() => {
    const context = userContext
    let prompt = "You are URNAV, a helpful AI assistant for location-based recommendations. "
    
    if (context.location) {
      prompt += `The user is currently in ${context.location.name} (${context.location.lat}, ${context.location.lon}). `
    }
    
    if (context.preferences.length > 0) {
      prompt += `User preferences: ${context.preferences.join(", ")}. `
    }
    
    if (context.dislikes.length > 0) {
      prompt += `User dislikes: ${context.dislikes.join(", ")}. `
    }
    
    if (context.budgetMode) {
      prompt += "User is in budget mode - prioritize affordable options. "
    }
    
    if (context.lastSearches.length > 0) {
      prompt += `Recent searches: ${context.lastSearches.slice(0, 3).join(", ")}. `
    }
    
    prompt += "Provide helpful, personalized recommendations based on this context."
    return prompt
  }, [userContext])

  return {
    messages,
    userContext,
    addMessage,
    clearMessages,
    updateLocation,
    addPreference,
    removePreference,
    addDislike,
    removeDislike,
    addSearch,
    setBudgetMode,
    getContextualPrompt
  }
}
