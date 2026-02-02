"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import {
  ArrowLeft,
  Save,
  User,
  Briefcase,
  MapPin,
  Globe,
  Award,
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { JournalistProfile, MembershipTier, VerificationStatus } from "@prisma/client"
import { formatDate } from "@/lib/utils"

interface JournalistWithUser extends JournalistProfile {
  user: {
    name: string | null
    email: string | null
    createdAt: string
  }
  mentor?: {
    id: string
    user: {
      name: string | null
    }
  } | null
  mentees: Array<{
    id: string
    user: {
      name: string | null
    }
  }>
  _count: {
    cases: number
    publications: number
    mentees: number
  }
}

const membershipTierDescriptions = {
  ASSOCIATE: "New member building their portfolio",
  VERIFIED: "Established journalist with verified credentials",
  SENIOR: "Experienced journalist with significant body of work",
  MENTOR: "Senior journalist mentoring others in the network"
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<JournalistWithUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    bio: "",
    experience: "",
    specialization: "",
    location: "",
    languages: "",
    website: "",
    socialMedia: "",
  })

  useEffect(() => {
    if (session?.user?.role === "JOURNALIST") {
      fetchProfile()
    } else if (session) {
      router.push("/")
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/journalists/me")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          bio: data.bio || "",
          experience: data.experience || "",
          specialization: data.specialization || "",
          location: data.location || "",
          languages: data.languages ? JSON.parse(data.languages).join(", ") : "",
          website: data.website || "",
          socialMedia: data.socialMedia ? JSON.stringify(JSON.parse(data.socialMedia), null, 2) : "",
        })
      } else if (response.status === 404) {
        setError("Journalist profile not found")
      } else {
        setError("Failed to load profile")
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) return

    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const submitData = {
        ...formData,
        languages: formData.languages ? JSON.stringify(formData.languages.split(",").map(l => l.trim())) : "",
        socialMedia: formData.socialMedia ? formData.socialMedia : "",
      }

      const response = await fetch("/api/journalists/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        fetchProfile() // Refresh profile data
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      setError("An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to view your profile.{" "}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Sign in here
              </Link>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  if (session.user.role !== "JOURNALIST") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This page is only available to journalists. Please apply for journalist membership.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Profile not found</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">
                Manage your journalist profile and public information
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Profile updated successfully!</AlertDescription>
            </Alert>
          )}

          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{profile.user.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{profile.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(profile.user.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Verification Status</Label>
                  <div className="flex items-center gap-1">
                    {profile.isVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600">
                          {profile.verificationStatus}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <Label className="text-sm font-medium">Membership Tier</Label>
                  <p className="text-sm font-medium">{profile.membershipTier}</p>
                  <p className="text-xs text-muted-foreground">
                    {membershipTierDescriptions[profile.membershipTier]}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Active Cases</Label>
                  <p className="text-2xl font-bold">{profile._count.cases}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Publications</Label>
                  <p className="text-2xl font-bold">{profile._count.publications}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
                <CardDescription>
                  Update your public profile information. This will be visible to other users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself and your work as a journalist..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => handleInputChange("experience", e.target.value)}
                      placeholder="e.g., 5 years, 10+ years"
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange("specialization", e.target.value)}
                      placeholder="e.g., Investigative Journalism, Political Reporting"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="City, State/Country"
                    />
                  </div>

                  <div>
                    <Label htmlFor="languages">Languages</Label>
                    <Input
                      id="languages"
                      value={formData.languages}
                      onChange={(e) => handleInputChange("languages", e.target.value)}
                      placeholder="e.g., English, Hindi, Bengali"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://yourwebsite.com"
                      type="url"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="socialMedia">Social Media Links (JSON)</Label>
                  <Textarea
                    id="socialMedia"
                    value={formData.socialMedia}
                    onChange={(e) => handleInputChange("socialMedia", e.target.value)}
                    placeholder='{"twitter": "https://twitter.com/username", "linkedin": "https://linkedin.com/in/username"}'
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter social media links in JSON format
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/journalists/${profile.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Public Profile
                </Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}