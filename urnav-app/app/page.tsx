"use client"

import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { FloatingMic } from "@/components/floating-mic"
import { NearbyPlaces } from "@/components/nearby-places"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("urnav_token")
      setAuthed(!!token)
    }
  }, [])

  if (authed === null) {
    return null
  }

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="font-serif text-3xl font-bold">Welcome to URNAV</h1>
          <p className="text-muted-foreground">Sign in to get personalized nearby recommendations and chat-powered planning.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/login" className="px-4 py-2 rounded-md border">Login</Link>
            <Link href="/auth/signup" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Sign up</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
        <div className="flex h-full">
          {/* Chat Section */}
          <div id="chat" className="flex-1">
            <ChatInterface />
          </div>
          
          {/* Nearby Places Section - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block w-80 border-l bg-muted/20 p-4">
            <NearbyPlaces />
          </div>
        </div>
      </main>
      <FloatingMic />
      <BottomNavigation />
    </div>
  )
}
