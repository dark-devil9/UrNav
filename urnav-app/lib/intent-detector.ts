export interface IntentResult {
  intent: string
  confidence: number
  entities: Record<string, any>
  action: string
  apiEndpoint?: string
  parameters?: Record<string, any>
}

export interface IntentPattern {
  patterns: string[]
  intent: string
  action: string
  apiEndpoint?: string
  confidence: number
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Location-based queries
  {
    patterns: [
      "where should i go",
      "where should i travel",
      "where to visit",
      "places to see",
      "what to explore",
      "recommend places",
      "suggest locations",
      "best places",
      "top attractions"
    ],
    intent: "explore_places",
    action: "search_attractions",
    apiEndpoint: "explorer",
    confidence: 0.9
  },
  
  // Food and dining
  {
    patterns: [
      "restaurant",
      "food",
      "eat",
      "dining",
      "cafe",
      "coffee",
      "lunch",
      "dinner",
      "breakfast",
      "hungry",
      "best food"
    ],
    intent: "find_food",
    action: "search_restaurants",
    apiEndpoint: "places/search",
    parameters: { query: "restaurant" },
    confidence: 0.85
  },
  
  // Free activities
  {
    patterns: [
      "free places",
      "free activities",
      "no cost",
      "budget friendly",
      "cheap",
      "affordable",
      "free things to do"
    ],
    intent: "free_activities",
    action: "search_free_places",
    apiEndpoint: "free-places",
    confidence: 0.9
  },
  
  // Meeting friends
  {
    patterns: [
      "meet friend",
      "meeting spot",
      "halfway point",
      "between us",
      "meet up",
      "central location"
    ],
    intent: "meet_friend",
    action: "find_meeting_spot",
    apiEndpoint: "meet-friend",
    confidence: 0.85
  },
  
  // Day planning
  {
    patterns: [
      "plan my day",
      "day itinerary",
      "what to do today",
      "schedule",
      "daily plan",
      "activities for today"
    ],
    intent: "plan_day",
    action: "create_day_plan",
    apiEndpoint: "plan-day",
    confidence: 0.9
  },
  
  // Specific place types
  {
    patterns: [
      "park",
      "museum",
      "shopping",
      "mall",
      "cinema",
      "theater",
      "library",
      "gym",
      "hospital",
      "bank"
    ],
    intent: "find_specific_place",
    action: "search_by_category",
    apiEndpoint: "places/search",
    confidence: 0.8
  },
  
  // Weather and outdoor activities
  {
    patterns: [
      "outdoor",
      "weather",
      "sunny",
      "rainy",
      "indoor",
      "covered",
      "air conditioned"
    ],
    intent: "weather_based",
    action: "weather_appropriate_places",
    apiEndpoint: "explorer",
    confidence: 0.75
  },
  
  // Distance-based queries
  {
    patterns: [
      "nearby",
      "close by",
      "walking distance",
      "within 1km",
      "within 5km",
      "far away",
      "local"
    ],
    intent: "distance_based",
    action: "search_by_distance",
    apiEndpoint: "places/search",
    confidence: 0.8
  }
]

export function detectIntent(query: string): IntentResult {
  const lowerQuery = query.toLowerCase()
  let bestMatch: IntentResult | null = null
  let highestConfidence = 0

  for (const pattern of INTENT_PATTERNS) {
    for (const patternStr of pattern.patterns) {
      if (lowerQuery.includes(patternStr)) {
        if (pattern.confidence > highestConfidence) {
          highestConfidence = pattern.confidence
          bestMatch = {
            intent: pattern.intent,
            confidence: pattern.confidence,
            entities: extractEntities(lowerQuery),
            action: pattern.action,
            apiEndpoint: pattern.apiEndpoint,
            parameters: pattern.parameters
          }
        }
      }
    }
  }

  // Default fallback
  if (!bestMatch) {
    bestMatch = {
      intent: "general_query",
      confidence: 0.5,
      entities: extractEntities(lowerQuery),
      action: "general_search",
      apiEndpoint: "explorer"
    }
  }

  return bestMatch
}

function extractEntities(query: string): Record<string, any> {
  const entities: Record<string, any> = {}
  
  // Extract distance mentions
  const distanceMatch = query.match(/(\d+)\s*(km|kilometer|mile|m)/i)
  if (distanceMatch) {
    entities.distance = parseInt(distanceMatch[1])
    entities.distanceUnit = distanceMatch[2]
  }
  
  // Extract price mentions
  if (query.includes("cheap") || query.includes("budget") || query.includes("affordable")) {
    entities.priceRange = "low"
  } else if (query.includes("expensive") || query.includes("luxury") || query.includes("high end")) {
    entities.priceRange = "high"
  }
  
  // Extract time mentions
  if (query.includes("today") || query.includes("now")) {
    entities.time = "immediate"
  } else if (query.includes("tomorrow") || query.includes("next")) {
    entities.time = "future"
  }
  
  // Extract activity preferences
  if (query.includes("quiet") || query.includes("peaceful")) {
    entities.atmosphere = "quiet"
  } else if (query.includes("busy") || query.includes("crowded")) {
    entities.atmosphere = "busy"
  }
  
  // Extract dietary preferences
  if (query.includes("vegetarian") || query.includes("vegan")) {
    entities.dietary = "vegetarian"
  } else if (query.includes("halal") || query.includes("kosher")) {
    entities.dietary = query.includes("halal") ? "halal" : "kosher"
  }
  
  return entities
}

export function generateResponse(intent: IntentResult, userLocation: any, apiData?: any): string {
  switch (intent.intent) {
    case "explore_places":
      return generatePlaceRecommendations(intent, userLocation, apiData)
    case "find_food":
      return generateFoodRecommendations(intent, userLocation, apiData)
    case "free_activities":
      return generateFreeActivityRecommendations(intent, userLocation, apiData)
    case "meet_friend":
      return generateMeetingSpotRecommendations(intent, userLocation, apiData)
    case "plan_day":
      return generateDayPlan(intent, userLocation, apiData)
    case "find_specific_place":
      return generateSpecificPlaceRecommendations(intent, userLocation, apiData)
    default:
      return generateGeneralRecommendations(intent, userLocation, apiData)
  }
}

function generatePlaceRecommendations(intent: IntentResult, userLocation: any, apiData?: any): string {
  if (!userLocation) {
    return "I'd love to recommend places for you! First, could you share your current location so I can suggest nearby attractions?"
  }
  
  if (apiData?.results && apiData.results.length > 0) {
    const places = apiData.results.slice(0, 5)
    let response = `Based on your location in ${userLocation.name}, here are some great places to explore:\n\n`
    
    places.forEach((place: any, index: number) => {
      const distance = place.distance ? `${place.distance}m away` : "nearby"
      const category = place.categories?.[0]?.name || "attraction"
      response += `${index + 1}. **${place.name}** - ${category} (${distance})\n`
      if (place.rating) {
        response += `   Rating: ⭐ ${place.rating}/10\n`
      }
    })
    
    response += `\nThese are just a few options! Would you like me to suggest more specific types of places or help you plan a route?`
    return response
  }
  
  return `I found some great places near ${userLocation.name}! Let me get the latest recommendations for you.`
}

function generateFoodRecommendations(intent: IntentResult, userLocation: any, apiData?: any): string {
  if (!userLocation) {
    return "I'd love to recommend restaurants! First, could you share your current location?"
  }
  
  if (apiData?.results && apiData.results.length > 0) {
    const restaurants = apiData.results.slice(0, 5)
    let response = `Here are some great dining options near ${userLocation.name}:\n\n`
    
    restaurants.forEach((restaurant: any, index: number) => {
      const distance = restaurant.distance ? `${restaurant.distance}m away` : "nearby"
      const category = restaurant.categories?.[0]?.name || "restaurant"
      response += `${index + 1}. **${restaurant.name}** - ${category} (${distance})\n`
      if (restaurant.rating) {
        response += `   Rating: ⭐ ${restaurant.rating}/10\n`
      }
    })
    
    response += `\nWould you like me to filter by cuisine type, price range, or distance?`
    return response
  }
  
  return `I'm finding the best restaurants near ${userLocation.name} for you!`
}

function generateFreeActivityRecommendations(intent: IntentResult, userLocation: any, apiData?: any): string {
  if (!userLocation) {
    return "I'd love to suggest free activities! First, could you share your current location?"
  }
  
  if (apiData?.results && apiData.results.length > 0) {
    const places = apiData.results.slice(0, 5)
    let response = `Here are some great free activities near ${userLocation.name}:\n\n`
    
    places.forEach((place: any, index: number) => {
      const distance = place.distance ? `${place.distance}m away` : "nearby"
      const category = place.categories?.[0]?.name || "activity"
      response += `${index + 1}. **${place.name}** - ${category} (${distance})\n`
      if (place.rating) {
        response += `   Rating: ⭐ ${place.rating}/10\n`
      }
    })
    
    response += `\nAll of these are completely free! Would you like me to suggest more budget-friendly options or help you plan a day around these activities?`
    return response
  }
  
  return `I'm finding the best free activities near ${userLocation.name} for you!`
}

function generateMeetingSpotRecommendations(intent: IntentResult, userLocation: any, apiData?: any): string {
  if (!userLocation) {
    return "I'd love to help you find a meeting spot! First, could you share your current location?"
  }
  
  if (apiData?.results && apiData.results.length > 0) {
    const places = apiData.results.slice(0, 3)
    let response = `Here are some great meeting spots near ${userLocation.name}:\n\n`
    
    places.forEach((place: any, index: number) => {
      const distance = place.distance ? `${place.distance}m away` : "nearby"
      const category = place.categories?.[0]?.name || "meeting spot"
      response += `${index + 1}. **${place.name}** - ${category} (${distance})\n`
      if (place.rating) {
        response += `   Rating: ⭐ ${place.rating}/10\n`
      }
    })
    
    response += `\nThese are perfect for meeting up with friends! Would you like me to help you find the exact midpoint between two locations?`
    return response
  }
  
  return `I'm finding the best meeting spots near ${userLocation.name} for you!`
}

function generateDayPlan(intent: IntentResult, userLocation: any, apiData?: any): string {
  if (!userLocation) {
    return "I'd love to help you plan your day! First, could you share your current location?"
  }
  
  if (apiData?.stops && apiData.stops.length > 0) {
    let response = `Here's a great day plan for ${userLocation.name}:\n\n`
    
    apiData.stops.forEach((stop: any, index: number) => {
      response += `${index + 1}. **${stop.task}**\n`
    })
    
    if (apiData.summary) {
      response += `\n**Summary:** Total distance: ${apiData.summary.distance_km}km, Estimated time: ${apiData.summary.eta_min} minutes`
    }
    
    response += `\nWould you like me to adjust this plan or add more specific activities?`
    return response
  }
  
  return `I'm creating a personalized day plan for ${userLocation.name} for you!`
}

function generateSpecificPlaceRecommendations(intent: IntentResult, userLocation: any, apiData?: any): string {
  if (!userLocation) {
    return "I'd love to recommend specific places! First, could you share your current location?"
  }
  
  if (apiData?.results && apiData.results.length > 0) {
    const places = apiData.results.slice(0, 3)
    let response = `Here are some great options near ${userLocation.name}:\n\n`
    
    places.forEach((place: any, index: number) => {
      const distance = place.distance ? `${place.distance}m away` : "nearby"
      const category = place.categories?.[0]?.name || "place"
      response += `${index + 1}. **${place.name}** - ${category} (${distance})\n`
      if (place.rating) {
        response += `   Rating: ⭐ ${place.rating}/10\n`
      }
    })
    
    return response
  }
  
  return `I'm finding the best options near ${userLocation.name} for you!`
}

function generateGeneralRecommendations(intent: IntentResult, userLocation: any, apiData?: any): string {
  if (!userLocation) {
    return "I'd love to help you explore! First, could you share your current location so I can provide personalized recommendations?"
  }
  
  return `I'm here to help you explore ${userLocation.name}! You can ask me about:
• Places to visit and attractions
• Restaurants and food options  
• Free activities and budget-friendly options
• Meeting spots for friends
• Day planning and itineraries
• Specific types of places (parks, museums, etc.)

What would you like to explore today?`
}
