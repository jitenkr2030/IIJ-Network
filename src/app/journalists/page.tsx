"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import {
  Search,
  User,
  MapPin,
  Briefcase,
  CheckCircle,
  Users,
  FileText,
  Award,
  Filter
} from "lucide-react"
import { JournalistProfile, MembershipTier, VerificationStatus } from "@prisma/client"
import { formatDate } from "@/lib/utils"

interface JournalistWithUser extends JournalistProfile {
  user: {
    name: string | null
    email: string | null
    createdAt: string
  }
  _count: {
    cases: number
    publications: number
    mentees: number
  }
}

interface JournalistsResponse {
  journalists: JournalistWithUser[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
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

export default function JournalistsPage() {
  const [journalists, setJournalists] = useState<JournalistWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [location, setLocation] = useState("")
  const [verification, setVerification] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const specializations = [
    "Investigative Journalism",
    "Political Reporting",
    "Environmental Journalism",
    "Healthcare Reporting",
    "Education Reporting",
    "Legal Journalism",
    "Business Journalism",
    "Technology Journalism",
    "Sports Journalism",
    "Cultural Journalism",
    "Human Rights",
    "Corruption Investigation"
  ]

  const fetchJournalists = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        ...(search && { search }),
        ...(specialization && { specialization }),
        ...(location && { location }),
        ...(verification && { verification }),
      })

      const response = await fetch(`/api/journalists?${params}`)
      if (response.ok) {
        const data: JournalistsResponse = await response.json()
        setJournalists(data.journalists)
        setTotalPages(data.pagination.pages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error("Failed to fetch journalists:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournalists()
  }, [currentPage, search, specialization, location, verification])

  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleSpecializationChange = (value: string) => {
    setSpecialization(value)
    setCurrentPage(1)
  }

  const handleLocationChange = (value: string) => {
    setLocation(value)
    setCurrentPage(1)
  }

  const handleVerificationChange = (value: string) => {
    setVerification(value)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Verified Journalists</h1>
            <p className="text-muted-foreground">
              {total} independent journalists working for public interest
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Find Journalists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search journalists..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={specialization} onValueChange={handleSpecializationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Specializations</SelectItem>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
              />

              <Select value={verification} onValueChange={handleVerificationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearch("")
                  setSpecialization("")
                  setLocation("")
                  setVerification("")
                  setCurrentPage(1)
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Journalists Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : journalists.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No journalists found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to find journalists.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {journalists.map((journalist) => (
                <Card key={journalist.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          <Link href={`/journalists/${journalist.id}`} className="hover:text-primary">
                            {journalist.user.name || "Unknown Journalist"}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={membershipTierColors[journalist.membershipTier]}>
                            {journalist.membershipTier}
                          </Badge>
                          {journalist.isVerified && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {journalist.bio && (
                      <CardDescription className="line-clamp-3">
                        {journalist.bio}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Specialization */}
                      {journalist.specialization && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{journalist.specialization}</span>
                        </div>
                      )}

                      {/* Location */}
                      {journalist.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{journalist.location}</span>
                        </div>
                      )}

                      {/* Experience */}
                      {journalist.experience && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>{journalist.experience} experience</span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {journalist._count.cases}
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {journalist._count.publications}
                          </div>
                          {journalist._count.mentees > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {journalist._count.mentees}
                            </div>
                          )}
                        </div>
                        <div className="text-xs">
                          Since {formatDate(journalist.user.createdAt)}
                        </div>
                      </div>

                      {/* View Profile Button */}
                      <Button asChild className="w-full">
                        <Link href={`/journalists/${journalist.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}