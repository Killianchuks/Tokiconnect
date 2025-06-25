"use client"

import { DialogTrigger } from "@/components/ui/dialog"
import ClientOnly from "@/components/client-only"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Search, Filter, UserPlus, Edit, Trash, Ban, CheckCircle, Eye, AlertCircle, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { User, UserFilters, NewUser } from "@/types/admin" // Ensure User and NewUser types include hourlyRate

// Define a type for your user statistics response
interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalTeachers: number;
  totalStudents: number;
  newUsersLast30Days: number;
  // Add other stats as defined in your /api/admin/stats/users route
}


export default function UsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)
  const [showFilterDialog, setShowFilterDialog] = useState<boolean>(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState<boolean>(false)
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [filters, setFilters] = useState<UserFilters>({
    role: "all",
    status: "all",
    sortBy: "newest",
  })
  const [newUser, setNewUser] = useState<NewUser>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "student",
    language: "",
    hourlyRate: undefined, // Default to undefined to match optional property
  })

  // NEW STATE: To store user statistics
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);


  useEffect(() => {
    fetchUsers();
    fetchUserStatistics(); // NEW: Fetch statistics when component mounts
  }, []);

  // NEW FUNCTION: To fetch user statistics
  const fetchUserStatistics = async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      console.log("Fetching user statistics...");
      const response = await fetch("/api/admin/stats/users");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data: UserStats = await response.json();
      console.log("Received user statistics:", data);
      setUserStats(data);
    } catch (err) {
      console.error("Error fetching user statistics:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load user statistics";
      setStatsError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load user statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };


  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Fetching users with filters:", filters)

      const response = await fetch(`/api/admin/users${buildQueryString()}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      console.log("Received users data:", data)

      if (data && Array.isArray(data.users)) {
        setUsers(data.users)
      } else if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.error("Unexpected data format:", data)
        setUsers([])
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load users"
      setError(errorMessage)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const buildQueryString = () => {
    const params = new URLSearchParams()

    if (filters.role !== "all") {
      params.append("role", filters.role)
    }

    if (filters.status !== "all") {
      params.append("status", filters.status)
    }

    if (searchQuery) {
      params.append("search", searchQuery)
    }

    if (filters.sortBy !== "newest") {
      params.append("sortBy", filters.sortBy);
    }


    const queryString = params.toString()
    return queryString ? `?${queryString}` : ""
  }

  const handleSearch = () => {
    fetchUsers()
  }

  // CORRECTED: handleFilterChange to properly spread previous state and use keyof
  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters((prev: UserFilters) => ({ ...prev, [key]: value }));
  }

  const applyFilters = () => {
    fetchUsers()
    setShowFilterDialog(false)
  }

  const handleAddUser = async () => {
    try {
      if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password || !newUser.role) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const userData = {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        language: newUser.language || undefined,
        hourlyRate: newUser.role === 'teacher' ? newUser.hourlyRate : undefined,
      }

      console.log("Creating new user:", userData)

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      toast({
        title: "User added",
        description: `${newUser.firstName} ${newUser.lastName} has been added successfully as a ${newUser.role}`,
      })

      setShowAddUserDialog(false)
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "student",
        language: "",
        hourlyRate: undefined, // Reset hourlyRate too
      })

      fetchUsers()
      fetchUserStatistics();
    } catch (err) {
      console.error("Error adding user:", err)
      const errorMessage = err instanceof Error ? err.message : "An error occurred while adding the user"
      toast({
        title: "Failed to add user",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowUserDetailsDialog(true)
  }

  const handleEditUser = (user: User) => {
    router.push(`/admin/users/edit/${user.id}`)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      if (!userToDelete) return

      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error ${response.status}: ${errorText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          // If not JSON, use raw text
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "User deleted",
        description: `${userToDelete.name} has been deleted successfully`,
      })

      setShowDeleteDialog(false)
      setUserToDelete(null)
      fetchUsers()
      fetchUserStatistics();
    } catch (err) {
      console.error("Error deleting user:", err)
      const errorMessage = err instanceof Error ? err.message : "An error occurred while deleting the user"
      toast({
        title: "Failed to delete user",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error ${response.status}: ${errorText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          //
        }
        throw new Error(errorMessage);
      }

      const user = users.find((u) => u.id === userId)
      if (user) {
        toast({
          title: `User ${newStatus === "active" ? "activated" : "suspended"}`,
          description: `${user.name} has been ${newStatus === "active" ? "activated" : "suspended"}.`,
        })
      }

      fetchUsers()
      fetchUserStatistics();
    } catch (err) {
      console.error(`Error changing user status:`, err)
      const errorMessage = err instanceof Error ? err.message : "Failed to update user status"
      toast({
        title: "Action failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCheckDatabase = async () => {
    try {
      const response = await fetch("/api/admin/debug/list-all-users")
      const data = await response.json()

      toast({
        title: "Database Check",
        description: `Found ${data.count} users in database`,
      })

      console.log("Database users:", data.users)
    } catch (err) {
      console.error("Error checking database:", err)
      const errorMessage = err instanceof Error ? err.message : "Could not check database"
      toast({
        title: "Database Check Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleRawUserCheck = async () => {
    try {
      const response = await fetch("/api/admin/debug/list-raw-users")
      const data = await response.json()

      toast({
        title: "Raw Database Check",
        description: `Found ${data.count} users in raw database query`,
      })

      console.log("Raw database users:", data.users)
    } catch (err) {
      console.error("Error checking raw database:", err)
      const errorMessage = err instanceof Error ? err.message : "Could not check raw database"
      toast({
        title: "Raw Database Check Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <ClientOnly
      fallback={
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Users</h1>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      }
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCheckDatabase}>
              Check Database
            </Button>
            <Button variant="outline" onClick={handleRawUserCheck}>
              Raw User Check
            </Button>
            <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={() => setShowAddUserDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* NEW SECTION: User Statistics Dashboard */}
        <h2 className="text-2xl font-semibold mb-4">User Statistics</h2>
        {isLoadingStats ? (
          <div className="flex justify-center items-center h-24 mb-6">
            <p>Loading statistics...</p>
          </div>
        ) : statsError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Statistics Error</AlertTitle>
            <AlertDescription>{statsError}</AlertDescription>
          </Alert>
        ) : userStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently active accounts</p>
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalTeachers}</div>
                <p className="text-xs text-muted-foreground">Users with teacher role</p>
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Users with student role</p>
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users (Last 30 Days)</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.newUsersLast30Days}</div>
                <p className="text-xs text-muted-foreground">Recently registered accounts</p>
              </CardContent>
            </Card>
          </div>
        ) : null}


        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Search
          </Button>
          <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Users</DialogTitle>
                <DialogDescription>Apply filters to narrow down the user list.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={filters.role} onValueChange={(value) => handleFilterChange("role", value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
<SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                    <SelectTrigger id="sortBy">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={applyFilters} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No users found. Try adjusting your search or filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : user.role === "teacher"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : user.status === "suspended"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "active" ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, "suspended")}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, "active")}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user)}>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Add User Dialog */}
            <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account. Fill in all required fields.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: "student" | "teacher" | "admin") =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newUser.role === "teacher" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="language">Primary Language</Label>
                        <Input
                          id="language"
                          placeholder="Spanish, French, etc."
                          value={newUser.language || ""}
                          onChange={(e) => setNewUser({ ...newUser, language: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Hourly Rate</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          placeholder="e.g., 25.00"
                          value={newUser.hourlyRate || ""}
                          onChange={(e) => setNewUser({ ...newUser, hourlyRate: Number(e.target.value) || undefined })}
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                    Add User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* User Details Dialog */}
            <Dialog open={showUserDetailsDialog} onOpenChange={setShowUserDetailsDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>User Details</DialogTitle>
                  <DialogDescription>Detailed information about {selectedUser?.name}</DialogDescription>
                </DialogHeader>
                {selectedUser && (
                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <p className="text-sm">{selectedUser.name}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Role</Label>
                      <p className="text-sm capitalize">{selectedUser.role}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Status</Label>
                      <p className="text-sm capitalize">{selectedUser.status}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Join Date</Label>
                      <p className="text-sm">{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                    </div>
                    {selectedUser.role === "teacher" && (
                      <>
                        <div className="space-y-1">
                          <Label>Languages</Label>
                          <p className="text-sm">{selectedUser.language || "Not specified"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="hourlyRate">Hourly Rate</Label>
                          <p className="text-sm">{selectedUser.hourlyRate ? `$${selectedUser.hourlyRate.toFixed(2)}` : "Not set"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label>Rating</Label>
                          <p className="text-sm">{selectedUser.rating || "No ratings yet"}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUserDetailsDialog(false)}>
                    Close
                  </Button>
                  {selectedUser && (
                    <Button
                      onClick={() => {
                        setShowUserDetailsDialog(false)
                        handleEditUser(selectedUser)
                      }}
                      className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
                    >
                      Edit User
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </ClientOnly>
  )
}