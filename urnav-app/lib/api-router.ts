import { 
  searchPlaces, 
  explorer, 
  getFreePlaces, 
  meetFriend, 
  planDay,
  geocode 
} from './api'
import { IntentResult } from './intent-detector'

export interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  intent: string
  confidence: number
}

export async function routeIntent(
  intent: IntentResult, 
  userLocation: { lat: number; lon: number; name: string },
  userQuery: string
): Promise<ApiResponse> {
  try {
    let data: any = null
    
    switch (intent.apiEndpoint) {
      case 'explorer':
        data = await explorer(userLocation.lat, userLocation.lon, 5000)
        break
        
      case 'free-places':
        data = await getFreePlaces(userLocation.lat, userLocation.lon)
        break
        
      case 'places/search':
        const query = intent.parameters?.query || extractSearchQuery(userQuery)
        data = await searchPlaces({
          lat: userLocation.lat,
          lon: userLocation.lon,
          query: query,
          radius: 3000
        })
        break
        
      case 'meet-friend':
        // For meet friend, we need to get friend's location from the query
        const friendLocation = await extractFriendLocation(userQuery, userLocation)
        if (friendLocation) {
          data = await meetFriend(
            { lat: userLocation.lat, lon: userLocation.lon },
            friendLocation,
            intent.entities.activity,
            2000
          )
        } else {
          return {
            success: false,
            error: "I couldn't understand your friend's location. Please specify where your friend is (e.g., 'meet my friend in Mumbai')",
            intent: intent.intent,
            confidence: intent.confidence
          }
        }
        break
        
      case 'plan-day':
        data = await planDay({
          text: userQuery,
          origin: { lat: userLocation.lat, lng: userLocation.lon }
        })
        break
        
      default:
        // Fallback to explorer
        data = await explorer(userLocation.lat, userLocation.lon, 5000)
    }
    
    return {
      success: true,
      data: data,
      intent: intent.intent,
      confidence: intent.confidence
    }
    
  } catch (error) {
    console.error('API routing error:', error)
    return {
      success: false,
      error: `Sorry, I encountered an error while searching: ${error instanceof Error ? error.message : 'Unknown error'}`,
      intent: intent.intent,
      confidence: intent.confidence
    }
  }
}

function extractSearchQuery(userQuery: string): string {
  // Extract the main search term from the user query
  const query = userQuery.toLowerCase()
  
  // Common place types
  const placeTypes = [
    'park', 'museum', 'shopping', 'mall', 'cinema', 'theater', 
    'library', 'gym', 'hospital', 'bank', 'restaurant', 'cafe',
    'hotel', 'attraction', 'landmark', 'temple', 'mosque', 'church'
  ]
  
  for (const type of placeTypes) {
    if (query.includes(type)) {
      return type
    }
  }
  
  // If no specific type found, return a general search
  return 'attraction'
}

async function extractFriendLocation(userQuery: string, userLocation: { lat: number; lon: number; name: string }): Promise<{ lat: number; lon: number } | null> {
  // Try to extract location from the query
  const locationMatch = userQuery.match(/(?:in|at|near|around)\s+([^,\s]+(?:\s+[^,\s]+)*)/i)
  
  if (locationMatch) {
    const locationName = locationMatch[1].trim()
    try {
      const geocoded = await geocode(locationName, { lat: userLocation.lat, lon: userLocation.lon })
      return { lat: geocoded.lat, lon: geocoded.lon }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }
  
  // If no location found, return null
  return null
}

export async function getCurrentLocation(): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    if (navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: lat, longitude: lon } = position.coords
            try {
              // Reverse geocode to get location name
              const geocoded = await geocode(`${lat},${lon}`)
              resolve({
                lat,
                lon,
                name: geocoded.name
              })
            } catch (error) {
              // If reverse geocoding fails, use coordinates
              resolve({
                lat,
                lon,
                name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
              })
            }
          },
          (error) => {
            reject(new Error(`Location access denied: ${error.message}`))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      })
    } else {
      throw new Error('Geolocation not supported')
    }
  } catch (error) {
    console.error('Location error:', error)
    return null
  }
}
