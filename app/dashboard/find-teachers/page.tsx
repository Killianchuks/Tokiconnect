"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Calendar, Clock, DollarSign, Filter, Search, X, Globe, AlertCircle, Loader2 } from "lucide-react"
import { LanguageSearch } from "@/components/language-search"
import { languages as staticLanguages } from "@/components/language-selector"
import { teacherService, languageService } from "@/lib/api-service"
import type { Teacher } from "@/lib/api-service"

export default function FindTeachersPage() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 100])
  const [dayOfWeek, setDayOfWeek] = useState("")
  const [timeOfDay, setTimeOfDay] = useState("")
  const [activeFilters, setActiveFilters] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [availableLanguages, setAvailableLanguages] = useState<{ id: string; name: string }[]>([])

  // State to track if the initial hydration is complete
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Mark client-side render after first mount
  }, []);

  // Initialize state from URL search params on mount, ONLY IF ON CLIENT
  useEffect(() => {
    if (!isClient) return; // Only run on client after hydration

    const initialSearch = searchParams.get('search');
    const initialLanguage = searchParams.get('language');
    const initialMinPrice = searchParams.get('hourlyRateMin');
    const initialMaxPrice = searchParams.get('hourlyRateMax');

    // Only set if not null AND not the literal string "undefined"
    if (initialSearch !== null && initialSearch.toLowerCase() !== "undefined") {
      setSearchQuery(initialSearch);
    } else {
      setSearchQuery(""); // Ensure it's an empty string if "undefined" or null
    }

    if (initialLanguage !== null && initialLanguage.toLowerCase() !== "undefined") {
      setSelectedLanguage(initialLanguage);
    } else {
      setSelectedLanguage("all"); // Default to "all" if "undefined" or null
    }

    if (initialMinPrice !== null && initialMinPrice.toLowerCase() !== "undefined") {
      setPriceRange(prev => [Number.parseInt(initialMinPrice, 10), prev[1]]);
    }

    if (initialMaxPrice !== null && initialMaxPrice.toLowerCase() !== "undefined") {
      setPriceRange(prev => [prev[0], Number.parseInt(initialMaxPrice, 10)]);
    }

    fetchAvailableLanguages();
    // fetchTeachers will be triggered by the dependency array of the next useEffect as state updates.
    // If no initial params, it will fetch with default (empty) filters.
  }, [searchParams, isClient]); // Added isClient dependency

  // This useEffect re-fetches teachers from the API when filters *that impact the API call* change
  useEffect(() => {
    if (!isClient) return; // Only run on client after hydration

    const handler = setTimeout(() => {
      fetchTeachers();
    }, 300); // Debounce search input by 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, selectedLanguage, priceRange, isClient]); // Added isClient dependency

  // This useEffect re-filters the *already fetched* teachers when client-side filters change
  useEffect(() => {
    filterTeachers();

    // Count active filters
    let count = 0;
    if (searchQuery.trim() !== "") count++;
    if (selectedLanguage && selectedLanguage !== "all") count++;
    if (priceRange[0] > 0 || priceRange[1] < 100) count++;
    if (dayOfWeek && dayOfWeek !== "any") count++;
    if (timeOfDay && timeOfDay !== "any") count++;
    setActiveFilters(count);
  }, [teachers, priceRange, dayOfWeek, timeOfDay, searchQuery, selectedLanguage]);

  const fetchTeachers = async () => {
    setIsLoading(true)
    setError(null)

    const rawFilters: Record<string, string | number | undefined> = {
      search: searchQuery.trim(),
      language: selectedLanguage !== "all" ? selectedLanguage : undefined,
      hourlyRateMin: priceRange[0] > 0 ? priceRange[0] : undefined,
      hourlyRateMax: priceRange[1] < 100 ? priceRange[1] : undefined,
    };

    const cleanedFilters: Record<string, string | number> = {};
    for (const key in rawFilters) {
      const value = rawFilters[key as keyof typeof rawFilters];
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' && value === '') {
          continue;
        }
        cleanedFilters[key] = value;
      }
    }

    console.log("[FindTeachersPage] Current searchQuery state (before API call):", `"${searchQuery}"`);
    console.log("[FindTeachersPage] Cleaned filters object for API call:", cleanedFilters);

    try {
      const response = await teacherService.getPublicTeachers(cleanedFilters);

      if (!Array.isArray(response)) {
        throw new Error("Invalid data format: expected an array of teachers from API");
      }

      setTeachers(response);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load teachers. Please try again later.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableLanguages = async () => {
    try {
      const response = await languageService.getLanguages()
      setAvailableLanguages(response || [])
    } catch (error) {
      console.error("Error fetching available languages:", error)
      toast({
        title: "Error",
        description: "Failed to load available languages for filter.",
        variant: "destructive",
      });
    }
  }

  const filterTeachers = () => {
    if (!teachers || teachers.length === 0) {
      setFilteredTeachers([])
      return
    }

    let filtered = [...teachers]

    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (teacher) =>
          teacher.name?.toLowerCase().includes(query) ||
          teacher.bio?.toLowerCase().includes(query)
      );
    }

    if (selectedLanguage && selectedLanguage !== "all") {
      filtered = filtered.filter(
        (teacher) =>
          Array.isArray(teacher.languages) &&
          teacher.languages.some((lang) => lang.toLowerCase() === selectedLanguage.toLowerCase())
      );
    }

    filtered = filtered.filter((teacher) => teacher.hourlyRate >= priceRange[0] && teacher.hourlyRate <= priceRange[1]);

    setFilteredTeachers(filtered)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedLanguage("all")
    setPriceRange([0, 100])
    setDayOfWeek("any")
    setTimeOfDay("any")
    router.replace('/dashboard/find-teachers');
  }

  const handleApplyFilters = () => {
    // This button now ensures the latest state is captured and passed to the URL if needed,
    // which in turn will trigger the useEffect for fetching.
    // However, since we have debounce on searchQuery, the effect might not fire immediately for search.
    // For now, simply letting react state updates handle it is fine.
    // If more complex filters were only applied on button click, we'd build the URL here.
  };

  const handleViewProfile = (teacherId: string) => {
    router.push(`/dashboard/teacher/${teacherId}`)
  }

  const handleBookLesson = (teacherId: string) => {
    router.push(`/dashboard/book-lesson/${teacherId}`)
  }

  const handleMessage = (teacherId: string) => {
    router.push(`/dashboard/messages?teacher=${teacherId}`)
  }

  const retryFetch = () => {
    fetchTeachers()
  }

  // If not on client side yet, render a basic loading state to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2 text-muted-foreground">Loading...</p>
      </div>
    );
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
                options={availableLanguages.map(lang => ({ value: lang.name, label: lang.name }))}
                placeholder="Search for a language..."
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {staticLanguages.filter(lang => ["spanish", "french", "japanese", "mandarin", "german"].includes(lang.value.toLowerCase())).map((language) => (
                <Button
                  key={language.value}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "rounded-full",
                    selectedLanguage.toLowerCase() === language.value.toLowerCase() ? "bg-[#8B5A2B] text-white hover:bg-[#8B5A2B]/90" : "",
                  )}
                  onClick={() => setSelectedLanguage(language.value === selectedLanguage ? "all" : language.value)}
                >
                  {language.label}
                </Button>
              ))}
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
                      options={availableLanguages.map(lang => ({ value: lang.name, label: lang.name }))}
                      placeholder="Select a language"
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
                        <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                        <SelectItem value="evening">Evening (5 PM - 10 PM)</SelectItem>
                        <SelectItem value="night">Night (10 PM - 6 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={resetFilters} className="mr-2">
                Reset Filters
              </Button>
              <Button onClick={handleApplyFilters} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teacher List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-lg shadow-sm animate-pulse">
                <CardContent className="p-6 flex items-start space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-1/4 mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredTeachers.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-xl text-muted-foreground">No teachers found matching your criteria.</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`} alt={teacher.name} />
                    <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-semibold">{teacher.name}</h3>
                    <p className="text-muted-foreground text-sm">{teacher.email}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-yellow-500 text-sm mt-1">
                      {/* FIX: Ensure rating is a number before calling toFixed */}
                      <StarRating rating={Number(teacher.rating ?? 0)} />
                      <span className="ml-1 text-muted-foreground">
                        ({Number(teacher.rating ?? 0).toFixed(1)})
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-1 mt-2">
                      {(teacher.languages || []).map((language) => (
                        <Badge key={language} variant="secondary" className="bg-blue-100 text-blue-800">
                          {language}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-lg font-bold text-gray-800 mt-2">
                      {/* FIX: Ensure hourlyRate is a number before calling toFixed */}
                      ${typeof teacher.hourlyRate === "number" ? teacher.hourlyRate.toFixed(2) : "N/A"} / hour
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {teacher.bio || "No bio available."}
                    </p>
                    <Button onClick={() => handleBookLesson(teacher.id)} className="mt-4 w-full sm:w-auto bg-[#6C4F3D] hover:bg-[#6C4F3D]/90 text-white rounded-md shadow-sm">
                      Book Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
