import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MessageCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Learn Languages with Native Speakers
                  </h1>
                  <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Connect with native speakers for personalized language lessons. Improve your conversational skills
                    with real-world practice.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup?role=student">
                    <Button className="w-full bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">Find a Teacher</Button>
                  </Link>
                  <Link href="/signup?role=teacher">
                    <Button variant="outline" className="w-full border-[#8B5A2B] text-[#8B5A2B] hover:bg-[#8B5A2B]/10">
                      Become a Teacher
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="TOKI CONNECT Logo"
                  width={550}
                  height={550}
                  className="rounded-lg object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-[#F5F5F5] scroll-mt-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Platform Features</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to learn or teach languages effectively
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Users className="h-12 w-12 text-[#8B5A2B]" />
                <h3 className="text-xl font-bold">Native Teachers</h3>
                <p className="text-center text-gray-500">
                  Learn from verified native speakers who understand the cultural nuances of the language
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <MessageCircle className="h-12 w-12 text-[#8B5A2B]" />
                <h3 className="text-xl font-bold">Live Conversations</h3>
                <p className="text-center text-gray-500">
                  Practice through video calls and messaging with real-time feedback
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Image src="/logo.png" alt="TOKI CONNECT Logo" width={48} height={48} className="h-12 w-12" />
                <h3 className="text-xl font-bold">Multiple Languages</h3>
                <p className="text-center text-gray-500">
                  Choose from dozens of languages with teachers from around the world
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 scroll-mt-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Simple steps to start learning or teaching
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-8">
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B5A2B] text-white">1</div>
                <h3 className="text-xl font-bold">Create an Account</h3>
                <p className="text-center text-gray-500">
                  Sign up as a student looking to learn or a teacher ready to share your language
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B5A2B] text-white">2</div>
                <h3 className="text-xl font-bold">Connect</h3>
                <p className="text-center text-gray-500">
                  Browse profiles, check availability, and book sessions that fit your schedule
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B5A2B] text-white">3</div>
                <h3 className="text-xl font-bold">Learn & Earn</h3>
                <p className="text-center text-gray-500">
                  Students improve their skills while teachers earn from sharing their native language
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-[#F5F5F5] scroll-mt-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">What Our Users Say</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear from students and teachers using our platform
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:gap-12 mt-8">
              <div className="flex flex-col space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div>
                    <h3 className="text-lg font-bold">Sarah K.</h3>
                    <p className="text-sm text-gray-500">Learning Spanish</p>
                  </div>
                </div>
                <p className="text-gray-500">
                  "I've tried many language apps, but nothing compares to practicing with a native speaker. My Spanish
                  has improved dramatically in just a few months!"
                </p>
              </div>
              <div className="flex flex-col space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div>
                    <h3 className="text-lg font-bold">Miguel R.</h3>
                    <p className="text-sm text-gray-500">Teaching Spanish</p>
                  </div>
                </div>
                <p className="text-gray-500">
                  "Teaching on this platform has been rewarding both financially and culturally. I've connected with
                  students worldwide while earning a steady income."
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Get Started?</h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join our community of language learners and teachers today
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/login?role=student">
                  <Button size="lg" className="w-full bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                    Find a Teacher
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login?role=teacher">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-[#8B5A2B] text-[#8B5A2B] hover:bg-[#8B5A2B]/10"
                  >
                    Become a Teacher
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0 bg-[#8B5A2B] text-white">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="TOKI CONNECT Logo" width={30} height={30} />
            <p className="text-sm">© 2025 TOKI CONNECT. All rights reserved.</p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link
              href="mailto:support@tokiconnect.com"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
