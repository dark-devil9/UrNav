export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://urnav-backend.onrender.com"

function getToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("urnav_token")
}

export async function apiFetch<T>(path: string, options: { method?: HttpMethod; body?: any; headers?: Record<string, string> } = {}): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data?.detail || data?.message || message
    } catch {}
    throw new Error(message)
  }
  if (res.status === 204) return undefined as unknown as T
  return (await res.json()) as T
}

export async function searchPlaces(params: { lat: number; lon: number; query?: string; radius?: number; tags?: string }) {
  const q = new URLSearchParams()
  q.set("lat", String(params.lat))
  q.set("lon", String(params.lon))
  if (params.query) q.set("query", params.query)
  if (params.radius) q.set("radius", String(params.radius))
  if (params.tags) q.set("tags", params.tags)
  return apiFetch<{ results: any[] }>(`/places/search?${q.toString()}`)
}

export async function geocode(query: string, bias?: { lat: number; lon: number }) {
  const q = new URLSearchParams({ query })
  if (bias) {
    q.set("lat", String(bias.lat))
    q.set("lon", String(bias.lon))
  }
  return apiFetch<{ lat: number; lon: number; name: string; id: string }>(`/places/geocode?${q.toString()}`)
}

export async function reverseGeocode(lat: number, lon: number) {
  const q = new URLSearchParams()
  q.set("lat", String(lat))
  q.set("lon", String(lon))
  return apiFetch<{ lat: number; lon: number; name: string; id: string }>(`/places/geocode?${q.toString()}`)
}

export async function meetFriend(user: { lat: number; lon: number }, friend: { lat: number; lon: number }, activity?: string, radius?: number) {
  return apiFetch<{ midpoint: { lat: number; lon: number }; results: any[] }>("/modes/meet-friend", {
    method: "POST",
    body: { user, friend, activity, radius },
  })
}

export async function login(body: { email?: string; phone?: string; password: string }) {
  return apiFetch<{ access_token: string; refresh_token: string; token_type: string }>("/auth/login", {
    method: "POST",
    body,
  })
}

export async function signup(body: { email?: string; phone?: string; password: string }) {
  return apiFetch<{ access_token: string; refresh_token: string; token_type: string }>("/auth/signup", {
    method: "POST",
    body,
  })
}

export async function planDay(params: { text?: string; tasks?: string[]; origin?: { lat: number; lng: number }; user_id?: string }) {
  return apiFetch<{ 
    origin: { lat: number; lng: number }; 
    tasks: Array<{
      task: string;
      place: string;
      lat: number | null;
      lng: number | null;
      category: string;
      distance: number | null;
      rating: number | null;
      fsq_id: string | null;
      status: string;
      added_at: string;
    }>; 
    summary: { 
      distance_km: number; 
      eta_min: number;
      total_tasks: number;
      pending_tasks: number;
      completed_tasks: number;
    } 
  }>(
    "/modes/plan-day",
    {
      method: "POST",
      body: params,
    },
  )
}

export async function explorer(lat: number, lon: number, radius?: number) {
  const q = new URLSearchParams()
  q.set("lat", String(lat))
  q.set("lon", String(lon))
  if (radius) q.set("radius", String(radius))
  return apiFetch<{ results: any[] }>(`/modes/explorer?${q.toString()}`)
}

export async function getFreePlaces(lat: number, lon: number) {
  const q = new URLSearchParams()
  q.set("lat", String(lat))
  q.set("lon", String(lon))
  return apiFetch<{ results: any[] }>(`/modes/free-places?${q.toString()}`)
}

export async function me() {
  return apiFetch<{ id: number; email?: string; phone?: string; preferences?: any; dislikes?: any; location_awareness: boolean }>("/auth/me")
}

export async function placeDetails(id: string) {
  return apiFetch<any>(`/places/${id}`)
}

export async function placePhotos(id: string, limit = 6) {
  const q = new URLSearchParams()
  q.set("limit", String(limit))
  return apiFetch<any[]>(`/places/${id}/photos?${q.toString()}`)
}

export async function placeTips(id: string, limit = 6) {
  const q = new URLSearchParams()
  q.set("limit", String(limit))
  return apiFetch<any[]>(`/places/${id}/tips?${q.toString()}`)
}