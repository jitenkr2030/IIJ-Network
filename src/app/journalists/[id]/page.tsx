"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Briefcase,
  Award,
  FileText,
  CheckCircle,
  Globe,
  Mail,
  Users,
  ExternalLink,
  Shield,
  Clock
} from "lucide-react"
import { JournalistProfile, Case, Publication } from "@prisma/client"
import { formatDate, formatDateTime } from "@/lib/utils"

interface JournalistWithDetails extends JournalistProfile {
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
  cases: Array<Case & {
    _count: {
      comments: number
      documents: number
      updates: number
    }
  }>
  publications: Publication[]
  _count: {
    cases: number
    publications: number
    mentees: number
  }
}

const membershipTierColors = {
  ASSOCIATE: "bg-gray-100 text-gray-800",
  VERIFIED: "bg-blue-100 text-blue-800",
  SENIOR: "bg-purple-100 text-purple-800",
  MENTOR: "bg-green-100 text-green-800",
}

const verificationStatusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-100 text-gray-800",
}

export default function JournalistProfilePage() {
  const params = useParams()
  const [journalist, setJournalist] = useState<JournalistWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const id = params.id as string

  useEffect(() => {
    fetchJournalist()
  }, [id])

  const fetchJournalist = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/journalists/${id}`)
      if (response.ok) {
        const data = await response.json()
        setJournalist(data)
      } else if (response.status === 404) {
        setError("Journalist profile not found")
      } else {
        setError("Failed to load journalist profile")
      }
    } catch (error) {
      console.error("Failed to fetch journalist:", error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
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

  if (error || !journalist) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <User className="h-4 w-4" />
              <AlertDescription>{error || "Journalist profile not found"}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/journalists">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Journalists
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const socialMediaLinks = journalist.socialMedia ? JSON.parse(journalist.socialMedia) : {}

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/journalists">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Journalists
              </Link>
            </Button>
          </div>

          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold">
                      {journalist.user.name || "Unknown Journalist"}
                    </h1>
                    {journalist.isVerified && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={membershipTierColors[journalist.membershipTier]}>
                      {journalist.membershipTier}
                    </Badge>
                    <Badge variant="outline">
                      {journalist._count.cases} Active Cases
                    </Badge>
                    <Badge variant="outline">
                      {journalist._count.publications} Publications
                    </Badge>
                    {journalist.mentees.length > 0 && (
                      <Badge variant="outline">
                        Mentor to {journalist.mentees.length}
                      </Badge>
                    )}
                  </div>

                  {journalist.bio && (
                    <p className="text-muted-foreground text-lg">
                      {journalist.bio}
                    </p>
                  )}
                </div>

                {/* Contact & Links */}
                <div className="space-y-2">
                  {journalist.user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${journalist.user.email}`} className="text-primary hover:underline">
                        {journalist.user.email}
                      </a>
                    </div>
                  )}
                  
                  {journalist.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={journalist.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Website
                        <ExternalLink className="h-3 w-3 ml-1 inline" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                {journalist.specialization && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Specialization</div>
                      <div className="text-muted-foreground">
                        {journalist.specialization}
                      </div>
                    </div>
                  </div>
                )}
                
                {journalist.experience && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Experience</div>
                      <div className="text-muted-foreground">
                        {journalist.experience}
                      </div>
                    </div>
                  </div>
                )}

                {journalist.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-muted-foreground">
                        {journalist.location}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Member Since</div>
                    <div className="text-muted-foreground">
                      {formatDate(journalist.user.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages */}
              {journalist.languages && (
                <div className="mt-4">
                  <div className="font-medium text-sm mb-2">Languages</div>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(journalist.languages).map((lang: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentorship */}
              {journalist.mentor && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Mentor:</span>
                    <Link href={`/journalists/${journalist.mentor.id}`} className="text-primary hover:underline">
                      {journalist.mentor.user.name}
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs defaultValue="cases" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cases">
                Cases ({journalist._count.cases})
              </TabsTrigger>
              <TabsTrigger value="publications">
                Publications ({journalist._count.publications})
              </TabsTrigger>
              <TabsTrigger value="mentees">
                Mentees ({journalist._count.mentees})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cases" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Cases</CardTitle>
                  <CardDescription>
                    Public interest journalism cases this journalist is working on.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {journalist.cases.length > 0 ? (
                    <div className="space-y-4">
                      {journalist.cases.map((caseItem) => (
                        <div key={caseItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <Link href={`/cases/${caseItem.slug}`} className="font-medium hover:text-primary">
                              {caseItem.title}
                            </Link>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {caseItem.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{caseItem.category}</span>
                              <span>{formatDate(caseItem.createdAt)}</span>
                              <span>{caseItem._count.comments} comments</span>
                              <span>{caseItem._count.documents} documents</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/cases/${caseItem.slug}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No public cases available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Publications</CardTitle>
                  <CardDescription>
                    Published work by this journalist.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {journalist.publications.length > 0 ? (
                    <div className="space-y-4">
                      {journalist.publications.map((pub) => (
                        <div key={pub.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{pub.title}</h4>
                            {pub.summary && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {pub.summary}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {pub.publicationOutlet && <span>{pub.publicationOutlet}</span>}
                              {pub.publishedAt && <span>{formatDate(pub.publishedAt)}</span>}
                            </div>
                          </div>
                          {pub.url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={pub.url} target="_blank" rel="noopener noreferrer">
                                Read
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No publications listed yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mentees" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mentees</CardTitle>
                  <CardDescription>
                    Journalists being mentored by this journalist.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {journalist.mentees.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {journalist.mentees.map((mentee) => (
                        <div key={mentee.id} className="flex items-center gap-3 p-4 border rounded-lg">
                          <User className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <Link href={`/journalists/${mentee.id}`} className="font-medium hover:text-primary">
                              {mentee.user.name}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No mentees at this time.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}