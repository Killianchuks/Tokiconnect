"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { authService, teacherService, languageService } from "@/lib/api-service"
import type { Teacher, TeacherCreateData } from "@/lib/api-service" // Removed TeacherAvailability, TeacherDiscounts
import { Loader2, X, Check, ChevronsUpDown, AlertCircle, Save } from "lucide-react"

import { cn } from "@/lib/utils"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"

interface CurrentUser {
  id: string;
  email: string;
  role: "student" | "teacher" | "admin";
  first_name: string;
  last_name: string;
  language?: string;
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [studentLanguage, setStudentLanguage] = useState<string>("")
  const [teacherLanguages, setTeacherLanguages] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState<string>("")
  const [bio, setBio] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [availableLanguages, setAvailableLanguages] = useState<{ id: string; name: string }[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [openLanguageCombobox, setOpenLanguageCombobox] = useState(false);
  const [languageSearchValue, setLanguageSearchValue] = useState("");

  const [freeDemoAvailable, setFreeDemoAvailable] = useState<boolean>(false);
  const [freeDemoDuration, setFreeDemoDuration] = useState<number>(30);

  // Availability and discount states are no longer here, they are moved to SchedulePage


  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const user = await authService.getCurrentUser()
        if (!user) {
          toast({
            title: "Access Denied",
            description: "Please log in to view your profile.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }
        setCurrentUser(user)
        setFirstName(user.first_name || "")
        setLastName(user.last_name || "")
        setEmail(user.email || "")

        if (user.role === "teacher") {
          const profile = await teacherService.getMyProfile()
          if (profile) {
            setTeacherProfile(profile)
            setHourlyRate(profile.hourlyRate?.toString() || "25")
            setBio(profile.bio || "")
            setTeacherLanguages(profile.languages || [])
            setFreeDemoAvailable(profile.freeDemoAvailable || false);
            setFreeDemoDuration(profile.freeDemoDuration || 30);
            // No longer initializing availability or discounts here
          } else {
             setFetchError("Teacher profile data not found. Please contact support.");
             toast({
                title: "Profile Data Missing",
                description: "Teacher profile data could not be loaded. Please contact support.",
                variant: "destructive",
             });
          }
        } else if (user.role === "student") {
          setStudentLanguage(user.language || "")
        }

        const languages = await languageService.getLanguages()
        setAvailableLanguages(languages || [])

      } catch (error) {
        console.error("Error fetching user data:", error)
        setFetchError("Failed to load profile data. " + (error instanceof Error ? error.message : "An unknown error occurred."));
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [router, toast])


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "User data not found for saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setFetchError(null);

    try {
      if (currentUser.role === "teacher") {
        const updatedData: Parameters<typeof teacherService.updateMyProfile>[0] = {
          firstName: firstName,
          lastName: lastName,
          languages: teacherLanguages,
          bio: bio,
          hourlyRate: parseFloat(hourlyRate),
          freeDemoAvailable: freeDemoAvailable,
          freeDemoDuration: freeDemoDuration,
          // Removed: availability and discounts from the payload here
        };

        console.log("[ProfilePage CLIENT] Sending update data to API:", updatedData);

        const updatedProfile = await teacherService.updateMyProfile(updatedData);
        if (updatedProfile) {
            setTeacherProfile(updatedProfile);
            // Assuming name might come back concatenated from backend
            setFirstName(updatedProfile.name.split(' ')[0] || "");
            setLastName(updatedProfile.name.split(' ').slice(1).join(' ') || "");
            setBio(updatedProfile.bio || "");
            setHourlyRate(updatedProfile.hourlyRate?.toString() || "25");
            setTeacherLanguages(updatedProfile.languages || []);
            setFreeDemoAvailable(updatedProfile.freeDemoAvailable || false);
            setFreeDemoDuration(updatedProfile.freeDemoDuration || 30);
            // No longer re-syncing availability or discounts states here
        } else {
            setFetchError("Profile update failed. No data returned.");
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive"
            });
        }
      } else {
        // This is a placeholder for student profile updates if needed
        toast({
            title: "Student Profile Update",
            description: "Student profile updates are not yet fully implemented via API.",
            variant: "default"
        });
        // You would implement studentService.updateMyProfile here
        // For example:
        // const updatedStudentData = { language: studentLanguage };
        // const updatedStudent = await studentService.updateMyProfile(updatedStudentData);
        // if (updatedStudent) { /* update local state */ }
      }

      // Update current user state based on changes made
      setCurrentUser((prev) => prev ? { ...prev, first_name: firstName, last_name: lastName, email: email } : null);

      setIsEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      setFetchError("Failed to update profile. " + (error instanceof Error ? error.message : "An unknown error occurred."));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while updating your profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTeacherLanguage = (newLangName: string) => {
    if (newLangName && !teacherLanguages.some(lang => lang.toLowerCase() === newLangName.toLowerCase())) {
      setTeacherLanguages((prev) => [...prev, newLangName])
    }
    setOpenLanguageCombobox(false);
    setLanguageSearchValue("");
  }

  const handleRemoveTeacherLanguage = (langToRemove: string) => {
    setTeacherLanguages((prev) => prev.filter((l) => l !== langToRemove))
  }

  // Availability and discount handlers are no longer here


  if (loading) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-4 w-2/3 mb-8" />
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (fetchError || !currentUser) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8 flex flex-col items-center justify-center min-h-[60vh] text-red-600">
        <AlertCircle className="h-8 w-8 mr-2" />
        <p className="mt-2 text-center">
          {fetchError || "Profile could not be loaded. Please ensure you are logged in."}
        </p>
        <Button onClick={() => router.push("/login")} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSave}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </div>
                {!isEditing ? (
                  <Button type="button" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  {isEditing ? (
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/50">{firstName}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  {isEditing ? (
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/50">{lastName}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="p-2 border rounded-md bg-muted/50">{email}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {currentUser.role === "teacher" ? "Teacher" : "Student"}
                </div>
              </div>

              {currentUser.role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="language">Language you're learning</Label>
                  {isEditing ? (
                    <Select value={studentLanguage} onValueChange={setStudentLanguage}>
                      <SelectTrigger id="language" className="w-full">
                        <SelectValue placeholder="Select language to learn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableLanguages.map((lang) => (
                          <SelectItem key={lang.id} value={lang.name}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/50">
                      {studentLanguage ? studentLanguage : "Not specified"}
                    </div>
                  )}
                </div>
              )}

              {currentUser.role === "teacher" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell students about yourself and your teaching style..."
                        className="min-h-[120px]"
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-muted/50 min-h-[120px]">
                        {bio || "No bio available."}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher-languages">Languages You Teach</Label>
                    {isEditing ? (
                      <>
                        <Popover open={openLanguageCombobox} onOpenChange={setOpenLanguageCombobox}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={openLanguageCombobox}
                              className="w-full justify-between"
                            >
                              Add a language...
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search languages..."
                                value={languageSearchValue}
                                onValueChange={setLanguageSearchValue}
                              />
                              <CommandEmpty>No language found.</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-y-auto">
                                {availableLanguages.map((lang) => (
                                  <CommandItem
                                    key={lang.id}
                                    value={lang.name}
                                    onSelect={(currentLanguageName) => {
                                      const selectedLang = availableLanguages.find(
                                        (l) => l.name.toLowerCase() === currentLanguageName.toLowerCase()
                                      );
                                      if (selectedLang) {
                                        handleAddTeacherLanguage(selectedLang.name);
                                      }
                                    }}
                                    disabled={teacherLanguages.some(langName => langName.toLowerCase() === lang.name.toLowerCase())}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        teacherLanguages.some(langName => langName.toLowerCase() === lang.name.toLowerCase()) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {lang.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(teacherLanguages || []).map((lang) => (
                            <Badge key={lang} variant="default" className="bg-[#6C4F3D] text-white flex items-center px-3 py-1 rounded-full">
                              {lang}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-1 h-auto p-0 text-white hover:bg-transparent hover:text-gray-200"
                                onClick={() => handleRemoveTeacherLanguage(lang)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-2 border rounded-md bg-muted/50">
                          {teacherLanguages.length > 0 ? teacherLanguages.join(", ") : "No languages specified."}
                      </div>
                    )}
                  </div>

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
                      <div className="p-2 border rounded-md bg-muted/50">${hourlyRate}</div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {currentUser.role === "teacher" && (
            <>
              {/* Availability Settings Card was here, moved to SchedulePage */}

              {/* Discount Settings Card was here, moved to SchedulePage */}

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Free Demo Class Settings</CardTitle>
                  <CardDescription>Configure if you offer a free demo class to new students.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <Checkbox
                        id="freeDemoToggle"
                        checked={freeDemoAvailable}
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          setFreeDemoAvailable(checked as boolean);
                          if (!(checked as boolean)) {
                              setFreeDemoDuration(30); // Reset duration if demo is disabled
                          }
                        }}
                      />
                    ) : (
                      <Checkbox id="freeDemoToggle" checked={freeDemoAvailable} disabled />
                    )}
                    <Label htmlFor="freeDemoToggle">Offer a free demo class</Label>
                  </div>

                  {freeDemoAvailable && (
                    <div className="space-y-2">
                      <Label htmlFor="freeDemoDuration">Free Demo Duration (minutes)</Label>
                      {isEditing ? (
                        <Input
                          id="freeDemoDuration"
                          type="number"
                          value={freeDemoDuration}
                          onChange={(e) => setFreeDemoDuration(parseInt(e.target.value) || 0)}
                          placeholder="e.g., 30"
                          min="1"
                          max="60"
                        />
                      ) : (
                        <div className="p-2 border rounded-md bg-muted/50">{freeDemoDuration} minutes</div>
                      )}
                      <p className="text-sm text-muted-foreground">Typically 15-30 minutes.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <CardFooter className="flex justify-end p-6">
            <Button type="submit" className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </div>
    </div>
  )
}
