import { Skeleton } from "@/components/ui/skeleton"

export default function LanguagesLoading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Skeleton className="h-10 w-[250px]" />
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full" />
            ))}
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  )
}
