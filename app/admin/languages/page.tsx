"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { languageService } from "@/lib/api-service"
import { Skeleton } from "@/components/ui/skeleton"

interface Language {
  id: string
  name: string
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
}

export default function LanguagesPage() {
  const [loading, setLoading] = useState(true)
  const [languages, setLanguages] = useState<Language[]>([])
  const [stats, setStats] = useState<LanguageStats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const languagesData = await languageService.getLanguages()

        // Calculate stats from the languages data
        const totalLanguages = languagesData.length
        const activeLanguages = languagesData.filter((lang) => lang.status === "Active").length

        // Find most popular language (most students)
        const mostPopular = [...languagesData].sort((a, b) => b.students - a.students)[0]?.name || "N/A"

        // For fastest growing, we would need growth data, but for now we'll use a placeholder
        // In a real app, you would fetch this from an API endpoint
        const fastestGrowing = "Korean" // Placeholder

        setLanguages(languagesData)
        setStats({
          totalLanguages,
          activeLanguages,
          mostPopular,
          fastestGrowing,
        })
      } catch (error) {
        console.error("Failed to fetch languages data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = async () => {
    try {
      setLoading(true)
      const filteredLanguages = await languageService.getLanguages()
      // Filter languages by name client-side
      // In a real app, you would pass the search query to the API
      const filtered = filteredLanguages.filter((lang) => lang.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setLanguages(filtered)
    } catch (error) {
      console.error("Failed to search languages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLanguage = () => {
    // Implement add language functionality
    console.log("Add new language")
  }

  const handleViewLanguage = (languageId: string) => {
    // Implement view language functionality
    console.log("View language:", languageId)
  }

  const handleEditLanguage = (languageId: string) => {
    // Implement edit language functionality
    console.log("Edit language:", languageId)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Languages</h2>
        <Button onClick={handleAddLanguage}>Add New Language</Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          className="max-w-sm"
          placeholder="Search languages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Languages</CardTitle>
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
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeLanguages}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.mostPopular}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fastest Growing</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.fastestGrowing}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Language List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Language</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Lessons</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {languages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No languages found
                    </TableCell>
                  </TableRow>
                ) : (
                  languages.map((language) => (
                    <TableRow key={language.id}>
                      <TableCell className="font-medium">{language.name}</TableCell>
                      <TableCell>{language.teachers}</TableCell>
                      <TableCell>{language.students}</TableCell>
                      <TableCell>{language.lessons}</TableCell>
                      <TableCell>
                        <Badge
                          variant={language.status === "Active" ? "default" : "secondary"}
                          className={language.status === "Active" ? "bg-green-500" : "bg-gray-500"}
                        >
                          {language.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewLanguage(language.id)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditLanguage(language.id)}>
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
