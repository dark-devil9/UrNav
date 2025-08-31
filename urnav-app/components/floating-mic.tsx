"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FloatingMic({ onToggle }: { onToggle?: (recording: boolean) => void }) {
  const [recording, setRecording] = useState(false)
  const [level, setLevel] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!recording) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setLevel(0)
      return
    }
    const animate = () => {
      setLevel((prev) => {
        const next = prev + (Math.random() - 0.5) * 0.2
        return Math.max(0, Math.min(1, next))
      })
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [recording])

  return (
    <div className="fixed bottom-24 right-4 md:right-6 z-40">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring when recording */}
        {recording && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              boxShadow: `0 0 0 6px hsl(var(--primary) / 0.15)`,
            }}
          />
        )}
        <Button
          size="icon"
          className="h-14 w-14 rounded-full"
          aria-label={recording ? "Stop recording" : "Start recording"}
          onClick={() => {
            setRecording((r) => {
              const next = !r
              onToggle?.(next)
              return next
            })
          }}
        >
          {recording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        {/* Waveform bars */}
        {recording && (
          <div className="absolute -left-24 hidden md:flex items-end gap-1" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-sm"
                style={{ height: `${Math.max(4, 48 * (0.4 + level * Math.random()))}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


