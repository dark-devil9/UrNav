"use client"

import { useCallback } from "react"
import { toast } from "sonner"

type PlaceMemory = {
  id: string
  name: string
}

const DISLIKED_KEY = "urnav_disliked_places"
const PREFERENCES_KEY = "urnav_preferences"

function readArray(key: string): PlaceMemory[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as PlaceMemory[]) : []
  } catch {
    return []
  }
}

function writeArray(key: string, value: PlaceMemory[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function useMemory() {
  const addDisliked = useCallback((place: PlaceMemory) => {
    const list = readArray(DISLIKED_KEY)
    if (!list.find((p) => p.id === place.id)) {
      writeArray(DISLIKED_KEY, [...list, place])
    }
    toast("Hidden (disliked)", {
      description: `${place.name} will be excluded from suggestions.`,
      action: {
        label: "Undo",
        onClick: () => removeDisliked(place.id),
      },
    })
  }, [])

  const removeDisliked = useCallback((id: string) => {
    const list = readArray(DISLIKED_KEY)
    writeArray(DISLIKED_KEY, list.filter((p) => p.id !== id))
  }, [])

  const addPreference = useCallback((pref: PlaceMemory) => {
    const list = readArray(PREFERENCES_KEY)
    if (!list.find((p) => p.id === pref.id)) {
      writeArray(PREFERENCES_KEY, [...list, pref])
    }
    toast.success("Preference saved", { description: `${pref.name} added to your likes.` })
  }, [])

  const getDisliked = useCallback(() => readArray(DISLIKED_KEY), [])
  const getPreferences = useCallback(() => readArray(PREFERENCES_KEY), [])

  return { addDisliked, removeDisliked, addPreference, getDisliked, getPreferences }
}


