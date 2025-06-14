"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ClearUsersPage() {
  const router = useRouter()
  const [cleared, setCleared] = useState(false)
  const [error, setError] = useState("")

  const handleClearUsers = () => {
    try {
      // Clear all user data from localStorage
      localStorage.removeItem("linguaConnectUser")
      setCleared(true)
      setError("")
    } catch (err) {
      console.error("Error clearing users:", err)
      setError("Failed to clear users. Please try again.")
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Clear Demo Users</CardTitle>
          <CardDescription>Remove all demo users from the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cleared ? (
            <div className="p-3 text-sm text-white bg-green-500 rounded">
              All demo users have been successfully cleared!
            </div>
          ) : (
            <>
              <p>This action will remove all demo users from the system. This cannot be undone.</p>
              {error && <div className="p-3 text-sm text-white bg-red-500 rounded">{error}</div>}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Home
          </Button>
          {!cleared && (
            <Button variant="destructive" onClick={handleClearUsers}>
              Clear All Users
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
