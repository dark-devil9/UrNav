"use client"

import { useEffect, useState } from "react"

type WeatherInfo = {
  temperatureC: number
  condition: "sunny" | "cloudy" | "rain" | "clear"
}

export function useSystemStatus() {
  const [locationLabel, setLocationLabel] = useState<string>("Jaipur, Rajasthan")
  const [timeString, setTimeString] = useState<string>(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
  const [weather, setWeather] = useState<WeatherInfo>({ temperatureC: 28, condition: "clear" })

  useEffect(() => {
    // Time updater
    const interval = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Geolocation (best-effort)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Mock reverse geocode -> keep city name Jaipur for regionalization, append coords
          const { latitude, longitude } = pos.coords
          setLocationLabel(`Beermalpura, Jaipur • ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
        },
        () => {
          // Permission denied or error -> keep default
          setLocationLabel("Jaipur, Rajasthan")
        },
        { enableHighAccuracy: false, maximumAge: 600_000, timeout: 5_000 },
      )
    }
  }, [])

  useEffect(() => {
    // Mock weather based on local time
    const hour = new Date().getHours()
    const condition: WeatherInfo["condition"] = hour >= 6 && hour < 18 ? "sunny" : "clear"
    const temp = 24 + Math.round(Math.sin((hour / 24) * Math.PI * 2) * 6)
    setWeather({ temperatureC: temp, condition })
  }, [])

  return { locationLabel, timeString, weather }
}


