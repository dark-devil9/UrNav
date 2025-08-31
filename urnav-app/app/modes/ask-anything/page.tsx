"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function AskAnythingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page with chat focus
    router.push("/#chat")
  }, [router])

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
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

          {/* Redirect Message */}
          <div className="text-center space-y-4 py-12">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Redirecting to Chat...</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You're being redirected to the main chat interface where you can ask anything about places, preferences, or navigation.
            </p>
            <div className="pt-4">
              <Link href="/#chat">
                <Button className="px-6">
                  Go to Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
