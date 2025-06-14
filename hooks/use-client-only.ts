"use client"

import { useState, useEffect } from "react"

export function useClientOnly<T>(initialValue: T): [T, boolean] {
  const [value, setValue] = useState<T>(initialValue)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return [value, isMounted]
}
