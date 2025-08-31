"use client"

import { useEffect, useState } from "react"

export function useGeo() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported")
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message || "Permission denied")
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 },
    )
  }, [])

  return { coords, error, loading }
}
