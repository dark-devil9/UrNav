"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation, Footprints, Car, MapPin, AlertCircle } from "lucide-react"

type LatLng = { lat: number; lng: number }

export function MapWidget({
  points,
  mode = "single",
}: {
  points: LatLng[]
  mode?: "single" | "multi"
}) {
  const [transport, setTransport] = useState<"walking" | "driving">("walking")

  const summary = useMemo(() => {
    if (points.length < 2) return { distanceKm: 0, etaMin: 0 }
    const distanceKm = points.slice(1).reduce((acc, p, i) => acc + haversine(points[i], p), 0)
    const speedKmh = transport === "walking" ? 4.5 : 28
    const etaMin = Math.round((distanceKm / speedKmh) * 60)
    return { distanceKm: Math.round(distanceKm * 10) / 10, etaMin }
  }, [points, transport])

  // Show error state if no points
  if (!points || points.length === 0) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border bg-card">
        <div className="aspect-video grid place-items-center">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No location selected</p>
          </div>
        </div>
      </div>
    )
  }

  // Show single point map
  if (mode === "single" && points.length === 1) {
    const point = points[0]
    return (
      <div className="relative w-full overflow-hidden rounded-lg border bg-card">
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-green-50 relative">
          {/* Map-like background with grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          {/* Location marker */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs shadow-md whitespace-nowrap">
                {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Compass rose */}
          <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-600" />
          </div>
        </div>

        <div className="absolute top-2 left-2 flex gap-2">
          <Badge variant="secondary" className="bg-white/90">
            <MapPin className="h-3 w-3 mr-1" />
            Location
          </Badge>
        </div>

        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-white/90 rounded px-2 py-1 text-xs text-center">
            <span className="font-medium">Coordinates:</span> {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
          </div>
        </div>
      </div>
    )
  }

  // Show multi-point route
  if (mode === "multi" && points.length > 1) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border bg-card">
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-green-50 relative">
          {/* Map-like background with grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          {/* Route visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {points.map((point, index) => (
                <g key={index}>
                  {/* Route line */}
                  {index > 0 && (
                    <line
                      x1={points[index - 1].lng * 100}
                      y1={points[index - 1].lat * 100}
                      x2={point.lng * 100}
                      y2={point.lat * 100}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                  {/* Point marker */}
                  <circle
                    cx={point.lng * 100}
                    cy={point.lat * 100}
                    r="2"
                    fill={index === 0 ? "#10b981" : "#ef4444"}
                    stroke="white"
                    strokeWidth="1"
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="absolute top-2 left-2 flex gap-2">
          <Badge variant="secondary" className="bg-white/90">
            {summary.distanceKm} km
          </Badge>
          <Badge variant="secondary" className="bg-white/90">
            {summary.etaMin} min
          </Badge>
        </div>

        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            size="sm"
            variant={transport === "walking" ? "default" : "outline"}
            onClick={() => setTransport("walking")}
            className="bg-white/90 hover:bg-white"
          >
            <Footprints className="h-3 w-3 mr-1" /> Walking
          </Button>
          <Button
            size="sm"
            variant={transport === "driving" ? "default" : "outline"}
            onClick={() => setTransport("driving")}
            className="bg-white/90 hover:bg-white"
          >
            <Car className="h-3 w-3 mr-1" /> Driving
          </Button>
        </div>

        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-white/90 rounded px-2 py-1 text-xs text-center">
            <span className="font-medium">Route:</span> {points.length} stops • {summary.distanceKm} km • {summary.etaMin} min
          </div>
        </div>
      </div>
    )
  }

  // Fallback for other cases
  return (
    <div className="relative w-full overflow-hidden rounded-lg border bg-card">
      <div className="aspect-video grid place-items-center">
        <div className="text-center space-y-1">
          <Navigation className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {mode === "single" ? "Destination preview" : "Optimized multi-stop route"}
          </p>
        </div>
      </div>

      <div className="absolute top-2 left-2 flex gap-2">
        <Badge variant="secondary">{summary.distanceKm} km</Badge>
        <Badge variant="secondary">{summary.etaMin} min</Badge>
      </div>

      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          size="sm"
          variant={transport === "walking" ? "default" : "outline"}
          onClick={() => setTransport("walking")}
        >
          <Footprints className="h-3 w-3 mr-1" /> Walking
        </Button>
        <Button
          size="sm"
          variant={transport === "driving" ? "default" : "outline"}
          onClick={() => setTransport("driving")}
        >
          <Car className="h-3 w-3 mr-1" /> Driving
        </Button>
      </div>
    </div>
  )
}

function haversine(a: LatLng, b: LatLng) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}


