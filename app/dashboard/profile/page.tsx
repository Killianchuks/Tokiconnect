"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LanguageSelector } from "@/components/language-selector"
import { useToast } from "@/hooks/use-toast"

// Define the UserProfile interface directly in this file
interface UserProfile {
  id?: string | number
  firstName: string
  lastName: string
  email: string
  role: "student" | "teacher" | "admin"
  language?: string
  hourlyRate?: string | number
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [language, setLanguage] = useState<string>("")
  const [hourlyRate, setHourlyRate] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false)

  useEffect(() => {
    // Load user data
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("linguaConnectUser")
        if (storedUser) {
          const user = JSON.parse(storedUser) as UserProfile
          setUserData(user)
          setFirstName(user.firstName || "")
          setLastName(user.lastName || "")
          setEmail(user.email || "")
          setLanguage(user.language || "")
          if (user.role === "teacher") {
            setHourlyRate(user.hourlyRate?.toString() || "25")
          }
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setLoading(false)
      }
    }
  }, [router])

  const handleSave = () => {
    if (!firstName || !lastName || !email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      if (!userData) {
        toast({
          title: "Error",
          description: "User data not found",
          variant: "destructive",
        })
        return
      }

      // Update user data
      const updatedUserData: UserProfile = {
        ...userData,
        firstName,
        lastName,
        email,
        language,
        hourlyRate: userData.role === "teacher" ? hourlyRate : undefined,
      }

      // Save to localStorage
      localStorage.setItem("linguaConnectUser", JSON.stringify(updatedUserData))

      setUserData(updatedUserData)
      setIsEditing(false)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating your profile",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                {isEditing ? (
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                ) : (
                  <div className="p-2 border rounded-md">{firstName}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                {isEditing ? (
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                ) : (
                  <div className="p-2 border rounded-md">{lastName}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              ) : (
                <div className="p-2 border rounded-md">{email}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="p-2 border rounded-md">{userData.role === "teacher" ? "Teacher" : "Student"}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                {userData.role === "student" ? "Language you're learning" : "Your native language"}
              </Label>
              {isEditing ? (
                <LanguageSelector
                  value={language}
                  onChange={setLanguage}
                  placeholder={userData.role === "student" ? "Select language to learn" : "Select your native language"}
                />
              ) : (
                <div className="p-2 border rounded-md">
                  {language ? language.charAt(0).toUpperCase() + language.slice(1) : "Not specified"}
                </div>
              )}
            </div>

            {userData.role === "teacher" && (
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Your hourly rate (USD)</Label>
                {isEditing ? (
                  <div className="flex items-center">
                    <span className="mr-2">$</span>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      min="5"
                      max="200"
                    />
                  </div>
                ) : (
                  <div className="p-2 border rounded-md">${hourlyRate}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
