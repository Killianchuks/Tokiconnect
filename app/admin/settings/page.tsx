"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [generalSettings, setGeneralSettings] = useState({
    siteName: "TOKI CONNECT",
    siteDescription: "Language Learning Platform",
    supportEmail: "support@tokiconnect.com",
    maxFileSize: "10",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    lessonReminders: true,
    marketingEmails: false,
    systemUpdates: true,
  })

  const [commissionSettings, setCommissionSettings] = useState({
    platformFee: "15",
    minimumPayout: "50",
    payoutSchedule: "monthly",
  })

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationSettingsChange = (name: string, checked: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleCommissionSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCommissionSettings((prev) => ({ ...prev, [name]: value }))
  }

  const saveSettings = (settingsType: string) => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Settings Saved",
        description: `${settingsType} settings have been updated successfully.`,
      })
    }, 1000)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your platform's general settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  name="siteName"
                  value={generalSettings.siteName}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  name="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  value={generalSettings.supportEmail}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Maximum File Upload Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  name="maxFileSize"
                  type="number"
                  value={generalSettings.maxFileSize}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => saveSettings("General")}
                disabled={isLoading}
                className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationSettingsChange("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lessonReminders">Lesson Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminders before scheduled lessons</p>
                </div>
                <Switch
                  id="lessonReminders"
                  checked={notificationSettings.lessonReminders}
                  onCheckedChange={(checked) => handleNotificationSettingsChange("lessonReminders", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive promotional and marketing emails</p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) => handleNotificationSettingsChange("marketingEmails", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="systemUpdates">System Updates</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications about system updates</p>
                </div>
                <Switch
                  id="systemUpdates"
                  checked={notificationSettings.systemUpdates}
                  onCheckedChange={(checked) => handleNotificationSettingsChange("systemUpdates", checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => saveSettings("Notification")}
                disabled={isLoading}
                className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <CardDescription>Configure platform fees and payout settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformFee">Platform Fee (%)</Label>
                <Input
                  id="platformFee"
                  name="platformFee"
                  type="number"
                  value={commissionSettings.platformFee}
                  onChange={handleCommissionSettingsChange}
                />
                <p className="text-sm text-muted-foreground">Percentage fee taken from each lesson payment</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumPayout">Minimum Payout Amount ($)</Label>
                <Input
                  id="minimumPayout"
                  name="minimumPayout"
                  type="number"
                  value={commissionSettings.minimumPayout}
                  onChange={handleCommissionSettingsChange}
                />
                <p className="text-sm text-muted-foreground">Minimum balance required for teacher payouts</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                <select
                  id="payoutSchedule"
                  name="payoutSchedule"
                  value={commissionSettings.payoutSchedule}
                  onChange={handleCommissionSettingsChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-sm text-muted-foreground">How often teacher payouts are processed</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => saveSettings("Commission")}
                disabled={isLoading}
                className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passwordPolicy">Password Policy</Label>
                <select
                  id="passwordPolicy"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="standard">Standard (8+ characters)</option>
                  <option value="strong">Strong (8+ chars, uppercase, number)</option>
                  <option value="very-strong">Very Strong (12+ chars, uppercase, number, symbol)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <Switch id="twoFactorAuth" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sessionTimeout">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                </div>
                <Switch id="sessionTimeout" defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                <Input id="sessionDuration" type="number" defaultValue="60" />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => saveSettings("Security")}
                disabled={isLoading}
                className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
