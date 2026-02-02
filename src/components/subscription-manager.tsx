"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Bell,
  Mail,
  CheckCircle,
  AlertCircle,
  Settings,
  Info,
  Globe,
  FileText,
  Users,
  Shield
} from "lucide-react"

interface SubscriptionData {
  email: string
  isActive: boolean
  preferences: {
    caseUpdates: boolean
    newCases: boolean
    verificationAlerts: boolean
    systemAnnouncements: boolean
    journalistNews: boolean
  }
  frequency: "IMMEDIATE" | "DAILY" | "WEEKLY" | "NEVER"
}

interface SubscriptionManagerProps {
  trigger?: React.ReactNode
}

export function SubscriptionManager({ trigger }: SubscriptionManagerProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  const [subscription, setSubscription] = useState<SubscriptionData>({
    email: session?.user?.email || "",
    isActive: false,
    preferences: {
      caseUpdates: true,
      newCases: true,
      verificationAlerts: false,
      systemAnnouncements: true,
      journalistNews: false
    },
    frequency: "DAILY"
  })

  useEffect(() => {
    if (session && isOpen) {
      fetchSubscription()
    }
  }, [session, isOpen])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications/subscribe")
      if (response.ok) {
        const data = await response.json()
        if (data.subscribed) {
          setSubscription(prev => ({
            ...prev,
            email: data.email,
            isActive: true,
            preferences: data.preferences || prev.preferences,
            frequency: data.frequency || prev.frequency
          }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!subscription.email.trim()) {
      setError("Email is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: subscription.email,
          preferences: subscription.preferences
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to save subscription")
      }
    } catch (error) {
      console.error("Subscription save error:", error)
      setError("An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handlePreferenceChange = (key: string, value: boolean) => {
    setSubscription(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  const DefaultTrigger = (
    <Button variant="outline" size="sm">
      <Settings className="mr-2 h-4 w-4" />
      Notification Settings
    </Button>
  )

  if (!session) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || DefaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <DialogTitle>Notification Preferences</DialogTitle>
          </div>
          <DialogDescription>
            Manage how you receive updates from IIJN. Stay informed about cases that matter to you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading preferences...</p>
            </div>
          ) : (
            <>
              {/* Email Subscription */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={subscription.email}
                      onChange={(e) => setSubscription(prev => ({ ...prev, email: e.target.value }))}
                      className="w-64"
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isActive">Enable Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates about your subscribed cases and platform news
                      </p>
                    </div>
                    <Checkbox
                      id="isActive"
                      checked={subscription.isActive}
                      onCheckedChange={(checked) => setSubscription(prev => ({ ...prev, isActive: checked as boolean }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="frequency">Email Frequency</Label>
                      <p className="text-xs text-muted-foreground">
                        How often you'd like to receive email updates
                      </p>
                    </div>
                    <Select
                      value={subscription.frequency}
                      onValueChange={(value: any) => setSubscription(prev => ({ ...prev, frequency: value }))}
                      disabled={!subscription.isActive}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="NEVER">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notification Types</CardTitle>
                  <CardDescription>
                    Choose what types of updates you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <div>
                        <Label htmlFor="caseUpdates">Case Updates</Label>
                        <p className="text-xs text-muted-foreground">
                          When cases you follow are updated
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      id="caseUpdates"
                      checked={subscription.preferences.caseUpdates}
                      onCheckedChange={(checked) => handlePreferenceChange("caseUpdates", checked as boolean)}
                      disabled={!subscription.isActive}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <div>
                        <Label htmlFor="newCases">New Cases</Label>
                        <p className="text-xs text-muted-foreground">
                          New cases in your areas of interest
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      id="newCases"
                      checked={subscription.preferences.newCases}
                      onCheckedChange={(checked) => handlePreferenceChange("newCases", checked as boolean)}
                      disabled={!subscription.isActive}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <Label htmlFor="verificationAlerts">Verification Alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          When content you follow is verified
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      id="verificationAlerts"
                      checked={subscription.preferences.verificationAlerts}
                      onCheckedChange={(checked) => handlePreferenceChange("verificationAlerts", checked as boolean)}
                      disabled={!subscription.isActive}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <div>
                        <Label htmlFor="systemAnnouncements">System Announcements</Label>
                        <p className="text-xs text-muted-foreground">
                          Important platform updates and news
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      id="systemAnnouncements"
                      checked={subscription.preferences.systemAnnouncements}
                      onCheckedChange={(checked) => handlePreferenceChange("systemAnnouncements", checked as boolean)}
                      disabled={!subscription.isActive}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <Label htmlFor="journalistNews">Journalist News</Label>
                        <p className="text-xs text-muted-foreground">
                          Updates from journalists you follow
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      id="journalistNews"
                      checked={subscription.preferences.journalistNews}
                      onCheckedChange={(checked) => handlePreferenceChange("journalistNews", checked as boolean)}
                      disabled={!subscription.isActive}
                    />
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your notification preferences have been saved successfully!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}