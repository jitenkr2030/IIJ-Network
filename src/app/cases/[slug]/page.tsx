"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { DocumentUpload } from "@/components/document-upload"
import { VerificationSystem } from "@/components/verification-system"
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  MapPin,
  FileText,
  Paperclip,
  MessageSquare,
  Eye,
  Shield,
  Building,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Download
} from "lucide-react"
import { CaseStatus, Priority, Case, CaseTimeline, Document, Source, Authority, CaseUpdate } from "@prisma/client"
import { formatDate, formatDateTime } from "@/lib/utils"
import { canEditCase } from "@/lib/auth-helpers"

interface CaseWithDetails extends Case {
  journalist?: {
    id: string
    user: {
      name: string | null
      email: string | null
    }
  } | null
  timeline: CaseTimeline[]
  documents: Document[]
  sources: Source[]
  authorities: Authority[]
  updates: CaseUpdate[]
  comments: Array<{
    id: string
    content: string
    isPublic: boolean
    isVerified: boolean
    createdAt: string
    user: {
      name: string | null
      email: string | null
    }
  }>
  _count: {
    documents: number
    comments: number
    updates: number
    timeline: number
  }
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
  CLOSED: "bg-red-100 text-red-800",
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
}

export default function CaseDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showUpload, setShowUpload] = useState(false)

  const slug = params.slug as string

  useEffect(() => {
    fetchCase()
  }, [slug])

  const fetchCase = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cases/by-slug/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setCaseData(data)
      } else if (response.status === 404) {
        setError("Case not found")
      } else if (response.status === 403) {
        setError("Access denied")
      } else {
        setError("Failed to load case")
      }
    } catch (error) {
      console.error("Failed to fetch case:", error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUploaded = (document: any) => {
    // Refresh case data to show new document
    fetchCase()
    setShowUpload(false)
  }

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/download/${documentId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'document'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Download error:", error)
    }
  }

  const canEdit = session && caseData && canEditCase(session.user, caseData.journalistId)

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Case not found"}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/cases">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Cases
                </Link>
              </Button>
            </div>
          </div>
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/cases">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Cases
                </Link>
              </Button>
            </div>
            
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/cases/${caseData.slug}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Case
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Case Title and Meta */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={statusColors[caseData.status]}>
                      {caseData.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className={priorityColors[caseData.priority]}>
                      {caseData.priority}
                    </Badge>
                    <Badge variant="outline">
                      {caseData.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl lg:text-3xl">
                    {caseData.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {caseData.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Journalist</div>
                    <div className="text-muted-foreground">
                      {caseData.journalist?.user.name || "Unknown"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Created</div>
                    <div className="text-muted-foreground">
                      {formatDate(caseData.createdAt)}
                    </div>
                  </div>
                </div>

                {caseData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-muted-foreground">
                        {caseData.location}
                      </div>
                    </div>
                  </div>
                )}

                {caseData.publishedAt && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Published</div>
                      <div className="text-muted-foreground">
                        {formatDate(caseData.publishedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {caseData.tags && (
                <div className="mt-4">
                  <div className="font-medium text-sm mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {caseData.tags.split(",").map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="content">Story</TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline ({caseData._count.timeline})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documents ({caseData._count.documents})
              </TabsTrigger>
              <TabsTrigger value="sources">
                Sources ({caseData.sources.length})
              </TabsTrigger>
              <TabsTrigger value="updates">
                Updates ({caseData._count.updates})
              </TabsTrigger>
              <TabsTrigger value="verification">
                Verification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Full Story</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseData.content ? (
                    <div className="prose max-w-none">
                      {caseData.content.split("\\n").map((paragraph, index) => (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No full story content has been added yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Case Timeline</CardTitle>
                    {canEdit && (
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Chronological tracking of all case developments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {caseData.timeline.length > 0 ? (
                    <div className="space-y-4">
                      {caseData.timeline.map((event) => (
                        <div key={event.id} className="flex gap-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <span className="text-sm text-muted-foreground">
                                {formatDateTime(event.eventDate)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No timeline events have been added yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {showUpload && canEdit && (
                <DocumentUpload
                  caseId={caseData.id}
                  onUploadComplete={handleDocumentUploaded}
                  onCancel={() => setShowUpload(false)}
                />
              )}
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Documents & Evidence</CardTitle>
                    {canEdit && (
                      <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {showUpload ? "Cancel" : "Upload Document"}
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Supporting documents, RTI responses, FIRs, and other evidence.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {caseData.documents.length > 0 ? (
                    <div className="space-y-4">
                      {caseData.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{doc.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {doc.fileName} • {(doc.fileSize / 1024).toFixed(1)} KB
                              </p>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {doc.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{doc.documentType}</Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadDocument(doc.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No documents have been uploaded yet.
                      {canEdit && (
                        <Button 
                          variant="link" 
                          className="ml-2 p-0 h-auto"
                          onClick={() => setShowUpload(true)}
                        >
                          Upload your first document
                        </Button>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sources</CardTitle>
                    {canEdit && (
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Source
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Information about sources used in this case.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {caseData.sources.length > 0 ? (
                    <div className="space-y-4">
                      {caseData.sources.map((source) => (
                        <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">
                                {source.isAnonymous ? "Anonymous Source" : source.name}
                              </h4>
                              {source.isVerified && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              <Badge variant="outline">{source.type}</Badge>
                            </div>
                            {source.description && (
                              <p className="text-sm text-muted-foreground">
                                {source.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No sources have been added yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="updates" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Case Updates</CardTitle>
                    {canEdit && (
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Update
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Follow-ups and developments in the case.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {caseData.updates.length > 0 ? (
                    <div className="space-y-4">
                      {caseData.updates.map((update) => (
                        <div key={update.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{update.title}</h4>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(update.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{update.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No updates have been added yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4">
              <VerificationSystem
                targetId={caseData.id}
                targetType="CASE"
                title={caseData.title}
                description="Help verify the accuracy and credibility of this journalism case."
                existingVerifications={[]}
                onVerificationComplete={() => {
                  // Refresh case data to show new verification
                  fetchCase()
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}