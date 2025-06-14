import { Skeleton } from "@/components/ui/skeleton"

export default function ScheduleLoading() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-4 w-full max-w-[450px]" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-10 w-[300px]" />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex justify-between pt-4">
                  <Skeleton className="h-9 w-[100px]" />
                  <Skeleton className="h-9 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
