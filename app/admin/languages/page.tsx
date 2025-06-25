"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { languageService, statsService } from "@/lib/api-service" // Import statsService
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast" // Added useToast for error messages

interface Language {
  id: string
  name: string
  teachers: number
  students: number
  lessons: number
  status: "Active" | "Inactive"
}

// Updated LanguageStats interface to match what statsService.getLanguageStats provides
interface LanguageStats {
  mostPopular: string
  fastestGrowing: string
  // totalLanguages and activeLanguages will still be calculated client-side from the main language list
  // If your backend stats endpoint provided these, we'd add them here.
}

export default function LanguagesPage() {
  const { toast } = useToast(); // Initialize useToast
  const [loading, setLoading] = useState(true)
  const [languages, setLanguages] = useState<Language[]>([])
  // Initial state for stats, including default values for client-calculated ones
  const [stats, setStats] = useState<LanguageStats & { totalLanguages: number; activeLanguages: number }>({
    totalLanguages: 0,
    activeLanguages: 0,
    mostPopular: "N/A",
    fastestGrowing: "N/A",
  });
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch the list of languages
        const languagesData = await languageService.getLanguages();
        setLanguages(languagesData);

        // Fetch language statistics from the dedicated stats API
        const languageStats = await statsService.getLanguageStats();

        // Calculate stats that are still derived client-side
        const totalLanguages = languagesData.length;
        const activeLanguages = languagesData.filter((lang) => lang.status === "Active").length;

        // Update the combined stats state
        setStats({
          totalLanguages,
          activeLanguages,
          mostPopular: languageStats.mostPopular || "N/A", // Use data from API
          fastestGrowing: languageStats.fastestGrowing || "N/A", // Use data from API
        });

      } catch (error) {
        console.error("Failed to fetch languages data or stats:", error);
        toast({
          title: "Error",
          description: "Failed to load language data or statistics.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true)
      // Pass the search query to the API if your languageService.getLanguages supports it.
      // If not, continue client-side filtering.
      // For now, assuming client-side filtering as per original code.
      const allLanguages = await languageService.getLanguages();
      const filtered = allLanguages.filter((lang) =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setLanguages(filtered);
    } catch (error) {
      console.error("Failed to search languages:", error)
      toast({
        title: "Error",
        description: "Failed to search languages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false)
    }
  }

  const handleAddLanguage = () => {
    // Implement add language functionality
    console.log("Add new language")
    toast({
      title: "Feature Not Implemented",
      description: "Add Language functionality is not yet available.",
      variant: "default",
    });
  }

  const handleViewLanguage = (languageId: string) => {
    // Implement view language functionality
    console.log("View language:", languageId)
    toast({
      title: "Feature Not Implemented",
      description: `View details for language ID: ${languageId} is not yet available.`,
      variant: "default",
    });
  }

  const handleEditLanguage = (languageId: string) => {
    // Implement edit language functionality
    console.log("Edit language:", languageId)
    toast({
      title: "Feature Not Implemented",
      description: `Edit functionality for language ID: ${languageId} is not yet available.`,
      variant: "default",
    });
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
          onKeyDown={(e) => e.key === "Enter" && handleSearch()} // Added Enter key support
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
              <div className="text-2xl font-bold">{stats.totalLanguages}</div>
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
              <div className="text-2xl font-bold">{stats.activeLanguages}</div>
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
              <div className="text-2xl font-bold">{stats.mostPopular}</div>
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
              <div className="text-2xl font-bold">{stats.fastestGrowing}</div>
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
