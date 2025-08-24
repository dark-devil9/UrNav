import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { ChatInterface } from "@/components/chat-interface"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
        <ChatInterface />
      </main>
      <BottomNavigation />
    </div>
  )
}
