import { useState, useEffect, useCallback } from 'react'
import { explorer } from '@/lib/api'
import { useGeo } from './use-geo'
import { toast } from 'sonner'

interface Place {
  fsq_place_id: string
  name: string
  categories: Array<{ name: string }>
  distance: number
  rating?: number
  photos?: string[]
  latitude: number
  longitude: number
}

interface PlacesData {
  nearby: Place[]
  explorer: Place[]
  lastFetched: {
    nearby: number | null
    explorer: number | null
  }
  loading: {
    nearby: boolean
    explorer: boolean
  }
}

// Global state to persist data between component mounts
let globalPlacesData: PlacesData = {
  nearby: [],
  explorer: [],
  lastFetched: {
    nearby: null,
    explorer: null
  },
  loading: {
    nearby: false,
    explorer: false
  }
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

export function usePlacesData() {
  const { coords } = useGeo()
  const [data, setData] = useState<PlacesData>(globalPlacesData)

  // Update global state when local state changes
  useEffect(() => {
    globalPlacesData = data
  }, [data])

  const isDataStale = useCallback((lastFetched: number | null) => {
    if (!lastFetched) return true
    return Date.now() - lastFetched > CACHE_DURATION
  }, [])

  const fetchNearbyPlaces = useCallback(async (forceRefresh = false) => {
    if (!coords) {
      toast("Location required", { description: "Please enable location access to see nearby places" })
      return
    }

    // Check if we have fresh data and don't need to refresh
    if (!forceRefresh && 
        globalPlacesData.nearby.length > 0 && 
        !isDataStale(globalPlacesData.lastFetched.nearby)) {
      console.log('Using cached nearby places data')
      return
    }

    setData(prev => ({ ...prev, loading: { ...prev.loading, nearby: true } }))
    
    try {
      console.log('Fetching nearby places for coordinates:', coords)
      const apiData = await explorer(coords.lat, coords.lon, 5000)
      console.log('Explorer API response:', apiData)
      
      if (apiData && apiData.results) {
        console.log('Found', apiData.results.length, 'nearby places from API')
        const newData = {
          ...globalPlacesData,
          nearby: apiData.results,
          lastFetched: { ...globalPlacesData.lastFetched, nearby: Date.now() },
          loading: { ...globalPlacesData.loading, nearby: false }
        }
        setData(newData)
        toast.success(`Found ${apiData.results.length} nearby places`)
      } else {
        console.log('No results in API response:', apiData)
        setData(prev => ({ 
          ...prev, 
          nearby: [],
          loading: { ...prev.loading, nearby: false }
        }))
        toast.error("No places found", { description: "Try adjusting your location or search radius" })
      }
    } catch (error) {
      console.error("Failed to fetch nearby places:", error)
      toast.error("Failed to fetch nearby places", { description: "Please try again later" })
      setData(prev => ({ 
        ...prev, 
        nearby: [],
        loading: { ...prev.loading, nearby: false }
      }))
    }
  }, [coords, isDataStale])

  const fetchExplorerPlaces = useCallback(async (category: string, forceRefresh = false) => {
    if (!coords) return

    // Check if we have fresh data and don't need to refresh
    if (!forceRefresh && 
        globalPlacesData.explorer.length > 0 && 
        !isDataStale(globalPlacesData.lastFetched.explorer)) {
      console.log('Using cached explorer places data')
      return
    }

    setData(prev => ({ ...prev, loading: { ...prev.loading, explorer: true } }))
    
    try {
      let apiData
      
      // Different search strategies for different categories
      if (category === "must-see") {
        // Nearby search for must-see places (5km from user location)
        apiData = await explorer(coords.lat, coords.lon, 5000)
      } else if (category === "cultural") {
        // City-wide search for cultural landmarks (50km radius from Jaipur center)
        apiData = await explorer(26.9344, 75.9231, 50000)
      } else if (category === "historical") {
        // City-wide search for historical landmarks (50km radius from Jaipur center)
        apiData = await explorer(26.9344, 75.9231, 50000)
      } else if (category === "food") {
        // Medium radius for food places (25km radius from Jaipur center)
        apiData = await explorer(26.9344, 75.9231, 25000)
      } else {
        // Default city-wide search (20km radius)
        apiData = await explorer(26.9344, 75.9231, 20000)
      }
      
      if (apiData && apiData.results) {
        console.log('Found', apiData.results.length, 'explorer places from API for category:', category)
        const newData = {
          ...globalPlacesData,
          explorer: apiData.results,
          lastFetched: { ...globalPlacesData.lastFetched, explorer: Date.now() },
          loading: { ...globalPlacesData.loading, explorer: false }
        }
        setData(newData)
      } else {
        setData(prev => ({ 
          ...prev, 
          explorer: [],
          loading: { ...prev.loading, explorer: false }
        }))
      }
    } catch (error) {
      console.error("Failed to fetch explorer places:", error)
      setData(prev => ({ 
        ...prev, 
        explorer: [],
        loading: { ...prev.loading, explorer: false }
      }))
    }
  }, [coords, isDataStale])

  // Auto-fetch nearby places when coordinates change (only if no cached data)
  useEffect(() => {
    if (coords && (globalPlacesData.nearby.length === 0 || isDataStale(globalPlacesData.lastFetched.nearby))) {
      fetchNearbyPlaces()
    }
  }, [coords, fetchNearbyPlaces])

  const refreshNearbyPlaces = useCallback(() => {
    fetchNearbyPlaces(true)
  }, [fetchNearbyPlaces])

  const refreshExplorerPlaces = useCallback((category: string) => {
    fetchExplorerPlaces(category, true)
  }, [fetchExplorerPlaces])

  return {
    nearbyPlaces: data.nearby,
    explorerPlaces: data.explorer,
    loading: data.loading,
    lastFetched: data.lastFetched,
    refreshNearbyPlaces,
    refreshExplorerPlaces,
    fetchExplorerPlaces
  }
}
