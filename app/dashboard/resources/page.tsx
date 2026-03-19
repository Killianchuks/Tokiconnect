"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Calendar, ExternalLink, MessageSquare, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { USER_LOGIN_ROUTE } from "@/lib/auth-route-config"

type DashboardUser = {
  id: string
  role: string
  name?: string
  email?: string
  token?: string
}

type ResourceItem = {
  id: string
  teacher_id: string
  teacher_name: string
  title: string
  description: string
  resource_type: string
  language: string
  resource_url?: string | null
  created_at: string
}

const RESOURCE_TYPES = [
  { value: "tip", label: "Helpful Tip" },
  { value: "book", label: "Book" },
  { value: "link", label: "Link" },
  { value: "resource", label: "General Resource" },
]

export default function ResourcesPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [resourceType, setResourceType] = useState("tip")
  const [language, setLanguage] = useState("")
  const [resourceUrl, setResourceUrl] = useState("")
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null)

  const isTeacher = user?.role === "teacher"

  const getStoredAuthToken = () => {
    if (typeof window === "undefined") return null

    const directToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    if (directToken) return directToken

    const storedUser = localStorage.getItem("linguaConnectUser")
    if (!storedUser) return null

    try {
      const parsedUser = JSON.parse(storedUser) as { token?: string }
      return parsedUser.token || null
    } catch {
      return null
    }
  }

  const loadResources = async (currentUser: DashboardUser, q = searchQuery, lang = languageFilter) => {
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (lang !== "all") params.set("language", lang)
    if (currentUser.role === "teacher") params.set("teacherId", currentUser.id)

    const token = getStoredAuthToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`/api/resources?${params.toString()}`, {
      credentials: "include",
      headers,
    })

    if (!response.ok) {
      throw new Error("Failed to fetch resources")
    }

    const data = await response.json()
    setResources(data.resources || [])
  }

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedUser = localStorage.getItem("linguaConnectUser")
        if (!storedUser) {
          window.location.href = USER_LOGIN_ROUTE
          return
        }

        const parsed = JSON.parse(storedUser) as DashboardUser
        setUser(parsed)
        await loadResources(parsed, "", "all")
      } catch (error) {
        console.error("Error loading resources:", error)
        toast({
          title: "Error",
          description: "Could not load learning resources.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const languages = useMemo(() => {
    const unique = new Set(resources.map((item) => item.language).filter(Boolean))
    return ["all", ...Array.from(unique)]
  }, [resources])

  const handleSearch = async () => {
    if (!user) return
    try {
      setLoading(true)
      await loadResources(user, searchQuery, languageFilter)
    } catch (error) {
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setResourceType("tip")
    setLanguage("")
    setResourceUrl("")
    setEditingResourceId(null)
  }

  const startEditing = (resource: ResourceItem) => {
    setEditingResourceId(resource.id)
    setTitle(resource.title || "")
    setDescription(resource.description || "")
    setResourceType(resource.resource_type || "tip")
    setLanguage(resource.language || "")
    setResourceUrl(resource.resource_url || "")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleUpload = async () => {
    if (!user) return
    if (!title.trim() || !language.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and language are required.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = getStoredAuthToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const method = editingResourceId ? "PUT" : "POST"
      const response = await fetch("/api/resources", {
        method,
        credentials: "include",
        headers,
        body: JSON.stringify({
          id: editingResourceId,
          teacherId: user.id,
          title,
          description,
          resourceType,
          language,
          resourceUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to upload resource" }))
        throw new Error(data.error || "Failed to upload resource")
      }

      resetForm()

      await loadResources(user, searchQuery, languageFilter)

      toast({
        title: editingResourceId ? "Updated" : "Posted",
        description: editingResourceId
          ? "Your resource has been updated."
          : "Your resource has been posted for students.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post resource",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    const confirmed = window.confirm("Delete this resource? This cannot be undone.")
    if (!confirmed) return

    try {
      const token = getStoredAuthToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch("/api/resources", {
        method: "DELETE",
        credentials: "include",
        headers,
        body: JSON.stringify({ id, teacherId: user.id }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to delete resource" }))
        throw new Error(data.error || "Failed to delete resource")
      }

      setResources((prev) => prev.filter((item) => item.id !== id))

      if (editingResourceId === id) {
        resetForm()
      }

      toast({
        title: "Deleted",
        description: "Resource removed successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
        <p className="text-muted-foreground">
          {isTeacher
            ? "Post helpful tips, books, links, or study resources for your students."
            : "Search resources by language and connect with the teacher who posted them."}
        </p>
      </div>

      {isTeacher ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingResourceId ? "Edit Resource" : "Post a Resource"}</CardTitle>
            <CardDescription>
              {editingResourceId
                ? "Update your resource details below."
                : "Add tips, books, links, or other materials to help students."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-title">Title</Label>
                <Input id="resource-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: 10 Daily Spanish Conversation Tips" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-language">Language</Label>
                <Input id="resource-language" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Example: Spanish" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-url">Link (optional)</Label>
                <Input id="resource-url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-description">Description</Label>
              <Textarea
                id="resource-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a short explanation of how this helps students."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={isSubmitting}>
                {isSubmitting ? (editingResourceId ? "Updating..." : "Posting...") : editingResourceId ? "Update Resource" : "Post Resource"}
              </Button>
              {editingResourceId ? (
                <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Find Resources</CardTitle>
            <CardDescription>Use language and keyword search to find the right materials.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <div className="space-y-2">
              <Label htmlFor="search-query">Search</Label>
              <Input
                id="search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Book title, tip, keyword..."
              />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang === "all" ? "All Languages" : lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full md:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {!loading && resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No resources available yet</h3>
              <p className="text-muted-foreground mt-2">
                {isTeacher
                  ? "Your resources will be posted for students as soon as you add them."
                  : "Helpful resources will be posted by teachers soon."}
              </p>
            </CardContent>
          </Card>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="py-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{resource.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{resource.language}</Badge>
                    <Badge variant="outline">{resource.resource_type}</Badge>
                  </div>
                </div>

                {resource.description ? <p className="text-muted-foreground">{resource.description}</p> : null}

                <div className="text-sm text-muted-foreground">Posted by {resource.teacher_name}</div>

                <div className="flex flex-wrap gap-2">
                  {resource.resource_url ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={resource.resource_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Resource
                      </a>
                    </Button>
                  ) : null}

                  {!isTeacher ? (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/messages?teacherId=${resource.teacher_id}`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Reach Teacher
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/dashboard/book-lesson/${resource.teacher_id}`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Meeting
                        </Link>
                      </Button>
                    </>
                  ) : (
                    resource.teacher_id === user?.id ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => startEditing(resource)}>
                          Edit Resource
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(resource.id)}>
                          Delete Resource
                        </Button>
                      </>
                    ) : null
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
