"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import {
  Users,
  FileText,
  Eye,
  AlertCircle,
  TrendingUp,
  Calendar,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  BarChart3,
  Settings,
  Shield,
  List,
  ArrowRight
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface DashboardStats {
  overview: {
    totalUsers: number
    totalJournalists: number
    verifiedJournalists: number
    publicUsers: number
    totalCases: number
    publishedCases: number
    activeCases: number
    pendingVerifications: number
  }
  caseStats: Record<string, number>
  journalistStats: Record<string, number>
  recentCases: Array<{
    id: string
    title: string
    status: string
    createdAt: string
    journalist: {
      user: {
        name: string | null
      }
    }
  }>
  recentUsers: Array<{
    id: string
    name: string | null
    email: string
    role: string
    createdAt: string
    journalistProfile?: {
      verificationStatus: string
      membershipTier: string
    }
  }>
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
  CLOSED: "bg-red-100 text-red-800",
}

const verificationColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-100 text-gray-800",
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      router.push("/")
      return
    }
    fetchDashboardStats()
  }, [session, router])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/dashboard")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError("Failed to load dashboard data")
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin dashboard.
            </p>
          </div>
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
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDashboardStats}>Retry</Button>
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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Platform overview and management controls
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  User Management
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/verification">
                  <Shield className="mr-2 h-4 w-4" />
                  Verifications
                </Link>
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.overview.publicUsers} public, {stats.overview.totalJournalists} journalists
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Journalists</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.verifiedJournalists}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.overview.pendingVerifications} pending verification
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.totalCases}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.overview.publishedCases} published, {stats.overview.activeCases} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.pendingVerifications}</div>
                <p className="text-xs text-muted-foreground">
                  Journalist verifications pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="cases">Cases</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Case Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Case Status Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.caseStats).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[status as keyof typeof statusColors]}>
                              {status.replace("_", " ")}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Journalist Verification Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Journalist Verification Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.journalistStats).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={verificationColors[status as keyof typeof verificationColors]}>
                              {status.replace("_", " ")}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cases" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Cases</CardTitle>
                    <Button variant="outline" asChild>
                      <Link href="/cases">
                        <List className="mr-2 h-4 w-4" />
                        View All Cases
                      </Link>
                    </Button>
                  </div>
                  <CardDescription>
                    Latest journalism cases created on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentCases.map((caseItem) => (
                      <div key={caseItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{caseItem.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            By {caseItem.journalist.user.name || "Unknown"} • {formatDate(caseItem.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[caseItem.status as keyof typeof statusColors]}>
                            {caseItem.status.replace("_", " ")}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/cases/${caseItem.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Users</CardTitle>
                    <Button variant="outline" asChild>
                      <Link href="/admin/users">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                      </Link>
                    </Button>
                  </div>
                  <CardDescription>
                    Latest users who joined the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{user.name || "Unknown"}</h4>
                            <Badge variant="outline">{user.role}</Badge>
                            {user.journalistProfile && (
                              <Badge className={verificationColors[user.journalistProfile.verificationStatus as keyof typeof verificationColors]}>
                                {user.journalistProfile.verificationStatus}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email} • Joined {formatDate(user.createdAt)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Activity</CardTitle>
                  <CardDescription>
                    Recent activity across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Activity Tracking</h3>
                    <p className="text-muted-foreground">
                      Detailed activity logs and analytics will be available in the next update.
                    </p>
                  </div>
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