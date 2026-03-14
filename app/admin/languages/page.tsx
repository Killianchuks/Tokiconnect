"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { languages as allLanguages, regions } from "@/components/language-selector"
import { Globe, Users, BookOpen, TrendingUp } from "lucide-react"
import { adminFetch } from "@/lib/admin-fetch"

interface LanguageData {
  id: string
  name: string
  code: string
  region: string
  nativeName?: string
  teachers: number
  students: number
  lessons: number
  status: "Active" | "Inactive"
}

interface LanguageStats {
  totalLanguages: number
  activeLanguages: number
  mostPopular: string
  fastestGrowing: string
  totalTeachers: number
}

export default function LanguagesPage() {
  const [loading, setLoading] = useState(true)
  const [languageData, setLanguageData] = useState<LanguageData[]>([])
  const [filteredData, setFilteredData] = useState<LanguageData[]>([])
  const [stats, setStats] = useState<LanguageStats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch language stats from API
        const response = await adminFetch("/api/admin/languages/stats")
        const statsData = await response.json()
        
        // Create language data from the comprehensive list with teacher counts
        const languagesWithStats: LanguageData[] = allLanguages.map((lang, index) => {
          const teacherCount = statsData.teachersByLanguage?.[lang.value] || 0
          const studentCount = statsData.studentsByLanguage?.[lang.value] || 0
          const lessonCount = statsData.lessonsByLanguage?.[lang.value] || 0
          
          return {
            id: String(index + 1),
            name: lang.label,
            code: lang.value,
            region: lang.region,
            nativeName: lang.nativeName,
            teachers: teacherCount,
            students: studentCount,
            lessons: lessonCount,
            status: teacherCount > 0 ? "Active" as const : "Inactive" as const,
          }
        })
        
        // Sort by teachers (active languages first)
        const sortedLanguages = languagesWithStats.sort((a, b) => b.teachers - a.teachers)
        
        setLanguageData(sortedLanguages)
        setFilteredData(sortedLanguages)
        
        // Calculate stats
        const activeLanguages = sortedLanguages.filter(lang => lang.teachers > 0)
        const totalTeachers = sortedLanguages.reduce((sum, lang) => sum + lang.teachers, 0)
        const mostPopular = activeLanguages[0]?.name || "N/A"
        
        setStats({
          totalLanguages: allLanguages.length,
          activeLanguages: activeLanguages.length,
          mostPopular,
          fastestGrowing: statsData.fastestGrowing || "Korean",
          totalTeachers,
        })
      } catch (error) {
        console.error("Failed to fetch languages data:", error)
        
        // Fallback to show all languages without stats
        const fallbackData: LanguageData[] = allLanguages.map((lang, index) => ({
          id: String(index + 1),
          name: lang.label,
          code: lang.value,
          region: lang.region,
          nativeName: lang.nativeName,
          teachers: 0,
          students: 0,
          lessons: 0,
          status: "Inactive" as const,
        }))
        
        setLanguageData(fallbackData)
        setFilteredData(fallbackData)
        setStats({
          totalLanguages: allLanguages.length,
          activeLanguages: 0,
          mostPopular: "N/A",
          fastestGrowing: "N/A",
          totalTeachers: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter languages when search query or region changes
  useEffect(() => {
    let filtered = languageData
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lang => 
        lang.name.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query) ||
        (lang.nativeName && lang.nativeName.toLowerCase().includes(query)) ||
        lang.region.toLowerCase().includes(query)
      )
    }
    
    if (selectedRegion !== "all") {
      filtered = filtered.filter(lang => lang.region === selectedRegion)
    }
    
    setFilteredData(filtered)
  }, [searchQuery, selectedRegion, languageData])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Languages</h2>
          <p className="text-muted-foreground">
            Comprehensive list of {allLanguages.length}+ native languages available on the platform
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by name, native name, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <select 
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Regions</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Languages</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalLanguages}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Languages</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeLanguages}</div>
            )}
            <p className="text-xs text-muted-foreground">Languages with teachers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalTeachers}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold truncate">{stats?.mostPopular}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Language List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Language List 
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredData.length} languages)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>Native Name</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-center">Teachers</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Lessons</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Globe className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No languages found matching your search</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((language) => (
                      <TableRow key={language.id}>
                        <TableCell className="font-medium">{language.name}</TableCell>
                        <TableCell className="text-muted-foreground">{language.nativeName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{language.region}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{language.teachers}</TableCell>
                        <TableCell className="text-center">{language.students}</TableCell>
                        <TableCell className="text-center">{language.lessons}</TableCell>
                        <TableCell>
                          <Badge
                            variant={language.status === "Active" ? "default" : "secondary"}
                            className={language.status === "Active" ? "bg-green-500" : ""}
                          >
                            {language.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
