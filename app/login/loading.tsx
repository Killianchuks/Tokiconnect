import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"

export default function LoginLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader showAuthButtons={false} />
      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Skeleton className="h-20 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="mt-4 text-center">
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <Skeleton className="h-4 w-32 bg-white" />
                </div>
              </div>
              <div className="mt-4">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="border-t py-6 md:py-0 bg-[#8B5A2B] text-white">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 bg-white/20" />
            <Skeleton className="h-4 w-48 bg-white/20" />
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Skeleton className="h-4 w-12 bg-white/20" />
            <Skeleton className="h-4 w-12 bg-white/20" />
            <Skeleton className="h-4 w-12 bg-white/20" />
          </nav>
        </div>
      </footer>
    </div>
  )
}
