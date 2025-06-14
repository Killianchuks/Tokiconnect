"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, UserPlus, CheckCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { teacherService, languageService } from "@/lib/api-service"

// Define interfaces for our data types
interface Teacher {
  id: string
  name: string
  email: string
  languages?: string[]
  students?: number
  rating?: number
  status: string
  bio?: string
  hourlyRate?: number
}

interface Language {
  id: string
  name: string
}

interface NewTeacher {
  name: string
  email: string
  password: string
  languages: string[]
  bio: string
  hourlyRate: string
}

interface TeacherStats {
  totalTeachers: number
  activeTeachers: number
  averageRating: number
  languagesTaught: number
}

export default function TeachersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddTeacherDialog, setShowAddTeacherDialog] = useState(false)
  const [showTeacherDetailsDialog, setShowTeacherDetailsDialog] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [stats, setStats] = useState<TeacherStats>({
    totalTeachers: 0,
    activeTeachers: 0,
    averageRating: 0,
    languagesTaught: 0,
  })
  const [newTeacher, setNewTeacher] = useState<NewTeacher>({
    name: "",
    email: "",
    password: "",
    languages: [],
    bio: "",
    hourlyRate: "",
  })

  useEffect(() => {
    fetchTeachers()
    fetchLanguages()
  }, [])

  const fetchTeachers = async () => {
    setIsLoading(true)
    try {
      const response = await teacherService.getTeachers({
        search: searchQuery || undefined,
      })

      setTeachers(response || [])

      // Update stats
      if (response) {
        setStats({
          totalTeachers: response.length,
          activeTeachers: response.filter((t) => t.status === "active").length,
          averageRating: response.reduce((acc, t) => acc + (t.rating || 0), 0) / response.length || 0,
          languagesTaught: Array.from(new Set(response.flatMap((t) => t.languages || []))).length,
        })
      }
    } catch (error) {
      console.error("Error fetching teachers:", error)
      toast({
        title: "Error",
        description: "Failed to load teachers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLanguages = async () => {
    try {
      const response = await languageService.getLanguages()
      setLanguages(response || [])
    } catch (error) {
      console.error("Error fetching languages:", error)
    }
  }

  const handleSearch = () => {
    fetchTeachers()
  }

  const handleAddTeacher = async () => {
    try {
      if (!newTeacher.name || !newTeacher.email || !newTeacher.password || !newTeacher.languages.length) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Create a user with teacher role
      const userData = {
        name: newTeacher.name,
        email: newTeacher.email,
        password: newTeacher.password,
        role: "teacher",
        languages: newTeacher.languages,
        bio: newTeacher.bio,
        hourlyRate: Number.parseFloat(newTeacher.hourlyRate) || 0,
      }

      await teacherService.createTeacher(userData)
      toast({
        title: "Teacher added",
        description: `${newTeacher.name} has been added successfully`,
      })
      setShowAddTeacherDialog(false)
      setNewTeacher({
        name: "",
        email: "",
        password: "",
        languages: [],
        bio: "",
        hourlyRate: "",
      })
      fetchTeachers()
    } catch (error: unknown) {
      console.error("Error adding teacher:", error)
      toast({
        title: "Failed to add teacher",
        description: error instanceof Error ? error.message : "An error occurred while adding the teacher",
        variant: "destructive",
      })
    }
  }

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setShowTeacherDetailsDialog(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    router.push(`/admin/teachers/edit/${teacher.id}`)
  }

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      await teacherService.approveTeacher(teacherId)
      toast({
        title: "Teacher approved",
        description: "The teacher has been approved successfully",
      })
      fetchTeachers()
    } catch (error: unknown) {
      console.error("Error approving teacher:", error)
      toast({
        title: "Failed to approve teacher",
        description: error instanceof Error ? error.message : "An error occurred while approving the teacher",
        variant: "destructive",
      })
    }
  }

  const handleRejectTeacher = async (teacherId: string) => {
    try {
      await teacherService.rejectTeacher(teacherId)
      toast({
        title: "Teacher rejected",
        description: "The teacher has been rejected successfully",
      })
      fetchTeachers()
    } catch (error: unknown) {
      console.error("Error rejecting teacher:", error)
      toast({
        title: "Failed to reject teacher",
        description: error instanceof Error ? error.message : "An error occurred while rejecting the teacher",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Teachers</h2>
        <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={() => setShowAddTeacherDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Teacher
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages Taught</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.languagesTaught}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading teachers...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No teachers found. Try adjusting your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(teacher.languages || []).map((language) => (
                            <Badge key={language} variant="outline">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{teacher.students || 0}</TableCell>
                      <TableCell>{teacher.rating?.toFixed(1) || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={teacher.status === "active" ? "default" : "secondary"}
                          className={
                            teacher.status === "active"
                              ? "bg-green-500"
                              : teacher.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                          }
                        >
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewTeacher(teacher)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditTeacher(teacher)}>
                            Edit
                          </Button>
                          {teacher.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleApproveTeacher(teacher.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleRejectTeacher(teacher.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* Add Teacher Dialog */}
      <Dialog open={showAddTeacherDialog} onOpenChange={setShowAddTeacherDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>Create a new teacher account. Fill in all required fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="languages">Languages *</Label>
              <Select
                onValueChange={(value) => {
                  if (!newTeacher.languages.includes(value)) {
                    setNewTeacher({
                      ...newTeacher,
                      languages: [...newTeacher.languages, value],
                    })
                  }
                }}
              >
                <SelectTrigger id="languages">
                  <SelectValue placeholder="Select languages" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.id} value={language.name}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-2">
                {newTeacher.languages.map((language) => (
                  <Badge key={language} variant="outline" className="flex items-center gap-1">
                    {language}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => {
                        setNewTeacher({
                          ...newTeacher,
                          languages: newTeacher.languages.filter((l) => l !== language),
                        })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                placeholder="25.00"
                value={newTeacher.hourlyRate}
                onChange={(e) => setNewTeacher({ ...newTeacher, hourlyRate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Tell us about your teaching experience..."
                value={newTeacher.bio}
                onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeacherDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeacher} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
              Add Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Details Dialog */}
      <Dialog open={showTeacherDetailsDialog} onOpenChange={setShowTeacherDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>Detailed information about {selectedTeacher?.name}</DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <p className="text-sm">{selectedTeacher.name}</p>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <p className="text-sm">{selectedTeacher.email}</p>
              </div>
              <div className="space-y-1">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-1">
                  {(selectedTeacher.languages || []).map((language) => (
                    <Badge key={language} variant="outline">
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Hourly Rate</Label>
                <p className="text-sm">${selectedTeacher.hourlyRate || "Not set"}</p>
              </div>
              <div className="space-y-1">
                <Label>Rating</Label>
                <p className="text-sm">{selectedTeacher.rating?.toFixed(1) || "No ratings yet"}</p>
              </div>
              <div className="space-y-1">
                <Label>Students</Label>
                <p className="text-sm">{selectedTeacher.students || 0}</p>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <p className="text-sm capitalize">{selectedTeacher.status}</p>
              </div>
              <div className="space-y-1">
                <Label>Bio</Label>
                <p className="text-sm">{selectedTeacher.bio || "No bio provided"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeacherDetailsDialog(false)}>
              Close
            </Button>
            {selectedTeacher && (
              <Button
                onClick={() => {
                  setShowTeacherDetailsDialog(false)
                  handleEditTeacher(selectedTeacher)
                }}
                className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
              >
                Edit Teacher
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
