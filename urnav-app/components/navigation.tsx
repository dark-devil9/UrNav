"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Cloud, Menu, Home, Compass, Map, User } from "lucide-react"

export function TopNavigation() {
  const pathname = usePathname()

  const getActiveTab = () => {
    if (pathname === "/") return "HOME"
    if (pathname.startsWith("/modes")) return "MODES"
    if (pathname === "/map") return "MAP"
    if (pathname === "/profile") return "PROFILE"
    return "HOME"
  }

  const activeTab = getActiveTab()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-xl font-bold text-foreground">URNAV</h1>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link href="/">
            <Button
              variant="ghost"
              className={
                activeTab === "HOME"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              HOME
            </Button>
          </Link>
          <Link href="/modes">
            <Button
              variant="ghost"
              className={
                activeTab === "MODES"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              MODES
            </Button>
          </Link>
          <Link href="/map">
            <Button
              variant="ghost"
              className={
                activeTab === "MAP"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              MAP
            </Button>
          </Link>
          <Link href="/profile">
            <Button
              variant="ghost"
              className={
                activeTab === "PROFILE"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              PROFILE
            </Button>
          </Link>
        </nav>

        {/* Status Badges */}
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="hidden sm:flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span className="text-xs">Jaipur, Rajasthan</span>
          </Badge>
          <Badge variant="secondary" className="hidden sm:flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs">2:30 PM</span>
          </Badge>
          <Badge variant="secondary" className="hidden sm:flex items-center space-x-1">
            <Cloud className="h-3 w-3" />
            <span className="text-xs">28°C</span>
          </Badge>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export function BottomNavigation() {
  const pathname = usePathname()

  const getActiveTab = () => {
    if (pathname === "/") return "home"
    if (pathname.startsWith("/modes")) return "modes"
    if (pathname === "/map") return "map"
    if (pathname === "/profile") return "profile"
    return "home"
  }

  const activeTab = getActiveTab()

  const tabs = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    { id: "modes", label: "Modes", icon: Compass, href: "/modes" },
    { id: "map", label: "Map", icon: Map, href: "/map" },
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Link key={tab.id} href={tab.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center space-y-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
