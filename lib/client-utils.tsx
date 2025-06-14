"use client"

import { useState, useEffect, type ReactNode } from "react"
import Image, { type ImageProps } from "next/image"

// Hook to safely use client-side only code
export function useClientOnly<T>(initialValue: T): [T, boolean] {
  const [value, setValue] = useState<T>(initialValue)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return [value, isMounted]
}

// Component to wrap client-only rendering
interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Safe image component with error handling
interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined
  fallback?: ReactNode
}

export function SafeImage({ src, alt, fallback, ...props }: SafeImageProps) {
  const [error, setError] = useState(false)

  // Reset error state when src changes
  useEffect(() => {
    setError(false)
  }, [src])

  if (error) {
    return <>{fallback}</>
  }

  return <Image src={src || "/placeholder.svg"} alt={alt} {...props} onError={() => setError(true)} />
}
