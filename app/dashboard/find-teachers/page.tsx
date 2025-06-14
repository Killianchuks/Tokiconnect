"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { StarRating } from "@/components/star-rating"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, DollarSign, Filter, Search, X, Globe, AlertCircle } from "lucide-react"
import { LanguageSearch } from "@/components/language-search"
import { languages } from "@/components/language-selector"
import type { Teacher } from "@/types/teacher"

export default function FindTeachersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [priceRange, setPriceRange] = useState([0, 100])
  const [dayOfWeek, setDayOfWeek] = useState("")
  const [timeOfDay, setTimeOfDay] = useState("")
  const [activeFilters, setActiveFilters] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    filterTeachers()

    // Count active filters
    let count = 0
    if (searchQuery) count++
    if (selectedLanguage) count++
    if (priceRange[0] > 0 || priceRange[1] < 100) count++
    if (dayOfWeek) count++
    if (timeOfDay) count++
    setActiveFilters(count)
  }, [teachers, searchQuery, selectedLanguage, priceRange, dayOfWeek, timeOfDay])

  const fetchTeachers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/teachers")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch teachers: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Validate the data structure
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: expected an array of teachers")
      }

      setTeachers(data as Teacher[])
      setFilteredTeachers(data as Teacher[])
    } catch (err) {
      console.error("Error fetching teachers:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load teachers. Please try again later."
      setError(errorMessage)
      toast({
        title: "Error",
        description: "Failed to load teachers. Please try again later.",
        variant: "destructive",
      })
      // Initialize with empty arrays instead of mock data
      setTeachers([])
      setFilteredTeachers([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterTeachers = () => {
    if (!teachers || teachers.length === 0) {
      setFilteredTeachers([])
      return
    }

    let filtered = [...teachers]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (teacher) =>
          teacher.name?.toLowerCase().includes(query) ||
          teacher.bio?.toLowerCase().includes(query) ||
          (Array.isArray(teacher.specialties) &&
            teacher.specialties.some((specialty) => specialty?.toLowerCase().includes(query))),
      )
    }

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter(
        (teacher) =>
          Array.isArray(teacher.languages) &&
          teacher.languages.some((lang) => {
            // Handle both string arrays and object arrays
            if (typeof lang === "string") {
              return lang.toLowerCase() === selectedLanguage.toLowerCase()
            } else if (lang && typeof lang === "object" && lang.name) {
              return lang.name.toLowerCase() === selectedLanguage.toLowerCase()
            }
            return false
          }),
      )
    }

    // Filter by price range
    filtered = filtered.filter((teacher) => teacher.hourlyRate >= priceRange[0] && teacher.hourlyRate <= priceRange[1])

    // Filter by day of week
    if (dayOfWeek) {
      filtered = filtered.filter(
        (teacher) =>
          Array.isArray(teacher.availability) &&
          teacher.availability.some((slot) => {
            return slot?.day?.toLowerCase() === dayOfWeek.toLowerCase()
          }),
      )
    }

    // Filter by time of day
    if (timeOfDay) {
      filtered = filtered.filter(
        (teacher) =>
          Array.isArray(teacher.availability) &&
          teacher.availability.some((slot) => {
            if (!slot?.startTime) return false
            const startHour = Number.parseInt(slot.startTime.split(":")[0])
            if (timeOfDay === "morning") {
              return startHour >= 6 && startHour < 12
            } else if (timeOfDay === "afternoon") {
              return startHour >= 12 && startHour < 17
            } else if (timeOfDay === "evening") {
              return startHour >= 17 && startHour < 22
            } else if (timeOfDay === "night") {
              return startHour >= 22 || startHour < 6
            }
            return true
          }),
      )
    }

    setFilteredTeachers(filtered)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedLanguage("")
    setPriceRange([0, 100])
    setDayOfWeek("")
    setTimeOfDay("")
    setFilteredTeachers(teachers)
  }

  const handleViewProfile = (teacherId: string | number) => {
    router.push(`/dashboard/teacher/${teacherId}`)
  }

  const handleBookLesson = (teacherId: string | number) => {
    router.push(`/dashboard/book-lesson/${teacherId}`)
  }

  const handleMessage = (teacherId: string | number) => {
    router.push(`/dashboard/messages?teacher=${teacherId}`)
  }

  const retryFetch = () => {
    fetchTeachers()
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col space-y-4 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Find Teachers</h2>
        <p className="text-muted-foreground">
          Browse our qualified teachers and find the perfect match for your language learning journey.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <div className="flex-shrink-0 text-red-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-red-700">{error}</p>
              <p className="mt-3 text-sm md:mt-0 md:ml-6">
                <Button variant="ghost" size="sm" onClick={retryFetch} className="text-red-700 hover:text-red-600">
                  Retry
                </Button>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Language Search Hero Section */}
      <Card className="mb-8 bg-gradient-to-r from-[#8B5A2B]/10 to-[#8B5A2B]/5">
        <CardContent className="p-6 md:p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">What language do you want to learn?</h3>
            <p className="text-muted-foreground mb-6">
              Choose from over 100 languages and find the perfect teacher for your needs.
            </p>
            <div className="max-w-md mx-auto">
              <LanguageSearch
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                placeholder="Search for a language..."
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["spanish", "french", "japanese", "mandarin", "german"].map((lang) => {
                const language = languages.find((l) => l.value === lang)
                return (
                  <Button
                    key={lang}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-full",
                      selectedLanguage === lang ? "bg-[#8B5A2B] text-white hover:bg-[#8B5A2B]/90" : "",
                    )}
                    onClick={() => setSelectedLanguage(lang === selectedLanguage ? "" : lang)}
                  >
                    {language?.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              {activeFilters > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters} active
                </Badge>
              )}
            </div>
            <CardDescription>Refine your search to find the perfect teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="price">Price</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="search" className="text-sm font-medium mb-2 block">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by name or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="language" className="text-sm font-medium mb-2 block">
                      Language
                    </label>
                    <LanguageSearch
                      value={selectedLanguage}
                      onChange={setSelectedLanguage}
                      placeholder="Select language"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="price" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="price-range" className="text-sm font-medium">
                      Price Range ($/hour)
                    </label>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {priceRange[0]} - {priceRange[1]}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 px-2">
                    <Slider
                      id="price-range"
                      defaultValue={[0, 100]}
                      max={100}
                      step={5}
                      value={priceRange}
                      onValueChange={setPriceRange}
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-sm">${priceRange[0]}</span>
                      <span className="text-sm">${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="availability" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="day-of-week" className="text-sm font-medium mb-2 block">
                      Day of Week
                    </label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                      <SelectTrigger id="day-of-week" className="w-full">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any day</SelectItem>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="time-of-day" className="text-sm font-medium mb-2 block">
                      Time of Day
                    </label>
                    <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                      <SelectTrigger id="time-of-day" className="w-full">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any time</SelectItem>
                        <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                        <SelectItem value="evening">Evening (5PM - 10PM)</SelectItem>
                        <SelectItem value="night">Night (10PM - 6AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={resetFilters} disabled={activeFilters === 0}>
              Reset All
            </Button>
            <Button onClick={filterTeachers} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </CardFooter>
        </Card>

        {/* Active filters */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                Search: {searchQuery}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setSearchQuery("")}>
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </Badge>
            )}
            {selectedLanguage && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                Language: {languages.find((l) => l.value === selectedLanguage)?.label || selectedLanguage}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setSelectedLanguage("")}>
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 100) && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                Price: ${priceRange[0]} - ${priceRange[1]}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setPriceRange([0, 100])}>
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </Badge>
            )}
            {dayOfWeek && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                Day: {dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setDayOfWeek("")}>
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </Badge>
            )}
            {timeOfDay && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                Time: {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setTimeOfDay("")}>
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </Badge>
            )}
          </div>
        )}

        {/* Teachers List */}
        <div className="space-y-6">
          {isLoading ? (
            // Loading skeletons
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="p-4 flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-32 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-10 text-center">
                <div className="mx-auto mb-4 rounded-full bg-background p-3 w-12 h-12 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No teachers found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {selectedLanguage ? (
                    <>
                      We couldn't find any teachers for{" "}
                      {languages.find((l) => l.value === selectedLanguage)?.label || selectedLanguage}. Try selecting a
                      different language or adjusting your filters.
                    </>
                  ) : (
                    <>
                      We couldn't find any teachers matching your current filters. Try adjusting your search criteria or
                      check back later.
                    </>
                  )}
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Reset all filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher: Teacher) => (
                <Card key={teacher.id} className="overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={teacher.avatar || "/placeholder.svg"} alt={teacher.name} />
                        <AvatarFallback>{teacher.name?.substring(0, 2) || "??"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{teacher.name}</CardTitle>
                        <div className="flex items-center mt-1">
                          <StarRating rating={teacher.rating || 0} />
                          <span className="text-xs text-muted-foreground ml-2">({teacher.reviewCount || 0})</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(teacher.languages) &&
                        teacher.languages.map((language, idx) => {
                          // Handle both string arrays and object arrays
                          const langName = typeof language === "string" ? language : language?.name || ""
                          return (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="bg-[#8B5A2B]/10 text-[#8B5A2B] hover:bg-[#8B5A2B]/20"
                            >
                              {langName}
                            </Badge>
                          )
                        })}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                        <span className="font-semibold">${teacher.hourlyRate || 0}/hour</span>
                      </div>
                      {(teacher.discountPercent ?? 0) > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          {teacher.discountPercent}% off
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {teacher.bio || "No bio available"}
                    </p>

                    <div className="space-y-1 mb-3">
                      <div className="text-sm font-medium">Availability:</div>
                      {Array.isArray(teacher.availability) && teacher.availability.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.availability.slice(0, 3).map((slot, idx) => (
                            <div key={idx} className="flex items-center text-xs bg-muted rounded px-2 py-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="font-medium mr-1">{slot.day?.substring(0, 3) || "???"}</span>
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                {slot.startTime || "??"} - {slot.endTime || "??"}
                              </span>
                            </div>
                          ))}
                          {teacher.availability.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{teacher.availability.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No availability information</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <Button
                        className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90 col-span-2"
                        onClick={() => handleBookLesson(teacher.id)}
                      >
                        Book Lesson
                      </Button>
                      <Button variant="outline" onClick={() => handleViewProfile(teacher.id)}>
                        Profile
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
