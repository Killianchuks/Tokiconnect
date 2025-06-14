"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/star-rating"
import { useToast } from "@/hooks/use-toast"

interface RateLessonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherName: string
  teacherId: string
  lessonDate: string
  lessonId: string | number
  onRatingSubmit?: (lessonId: string | number, rating: number, feedback: string) => void
}

export function RateLessonModal({
  open,
  onOpenChange,
  teacherName,
  teacherId,
  lessonDate,
  lessonId,
  onRatingSubmit,
}: RateLessonModalProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide a rating before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Submit the rating to the API
      const response = await fetch(`/api/lessons/${lessonId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          feedback,
          teacherId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit rating")
      }

      // Call the onRatingSubmit callback if provided
      if (onRatingSubmit) {
        onRatingSubmit(lessonId, rating, feedback)
      }

      toast({
        title: "Review submitted",
        description: "Thank you for reviewing your teacher!",
      })

      // Reset form and close modal
      setRating(0)
      setFeedback("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "There was a problem submitting your review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review Your Teacher</DialogTitle>
          <DialogDescription>
            Share your experience with {teacherName} from your lesson on {lessonDate}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <div className="flex justify-center py-2">
              <StarRating rating={rating} size="lg" interactive onRatingChange={setRating} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review (Optional)</label>
            <Textarea
              placeholder="Share your thoughts about the teacher and lesson..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
