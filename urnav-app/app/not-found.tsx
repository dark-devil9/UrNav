import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold">Page Not Found</h1>
            <p className="text-muted-foreground">
              Looks like you've wandered off the map. Let's get you back on track.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/modes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Explore Modes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
