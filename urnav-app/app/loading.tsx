import { Compass } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary animate-pulse">
            <Compass className="h-8 w-8 text-primary-foreground animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">Loading URNAV</h2>
          <p className="text-sm text-muted-foreground">Preparing your navigation assistant...</p>
        </div>
      </div>
    </div>
  )
}
