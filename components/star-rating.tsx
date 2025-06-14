"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating?: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating = 0,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(rating)

  const handleClick = (index: number) => {
    if (!interactive) return

    const newRating = index + 1
    setSelectedRating(newRating)
    onRatingChange?.(newRating)
  }

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  }

  const displayRating = interactive ? hoverRating || selectedRating : rating

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(maxRating)].map((_, index) => (
        <Star
          key={index}
          className={cn(
            sizeClasses[size],
            "cursor-pointer transition-all",
            index < displayRating ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300",
            interactive && "hover:scale-110",
          )}
          onClick={() => handleClick(index)}
          onMouseEnter={() => interactive && setHoverRating(index + 1)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
    </div>
  )
}
