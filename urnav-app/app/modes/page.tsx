import { TopNavigation, BottomNavigation } from "@/components/navigation"
import { ModesGrid } from "@/components/modes-grid"
import { FloatingMic } from "@/components/floating-mic"

export default function ModesPage() {
  return (
    <div className="min-h-screen">
      <TopNavigation />
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-serif text-3xl font-bold text-foreground">Explore Modes</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose how you want to discover and navigate your world today
            </p>
          </div>
          <ModesGrid />
        </div>
      </main>
      <FloatingMic />
      <BottomNavigation />
    </div>
  )
}
