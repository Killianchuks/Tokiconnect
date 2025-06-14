import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface FindTeachersButtonProps {
  className?: string
}

export function FindTeachersButton({ className }: FindTeachersButtonProps) {
  return (
    <Button asChild className={`bg-[#8B5A2B] hover:bg-[#8B5A2B]/90 ${className}`}>
      <Link href="/dashboard/find-teachers">
        <Search className="mr-2 h-4 w-4" />
        Find a Teacher
      </Link>
    </Button>
  )
}
