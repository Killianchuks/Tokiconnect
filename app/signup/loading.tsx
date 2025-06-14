import { Skeleton } from "@/components/ui/skeleton"
import { SiteHeader } from "@/components/site-header"

export default function SignupLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-10 w-3/4 mx-auto mt-6" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
          </div>

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div>
                <Skeleton className="h-5 w-16 mb-2" />
                <Skeleton className="h-6 w-full mb-1" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>

            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-48 mx-auto" />
          </div>
        </div>
      </main>
    </div>
  )
}
