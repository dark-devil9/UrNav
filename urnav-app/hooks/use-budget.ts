"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "urnav_budget_mode"

export function useBudgetMode() {
  const [budgetMode, setBudgetMode] = useState<boolean>(false)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved != null) setBudgetMode(saved === "1")
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, budgetMode ? "1" : "0")
    }
  }, [budgetMode])

  return { budgetMode, setBudgetMode }
}


