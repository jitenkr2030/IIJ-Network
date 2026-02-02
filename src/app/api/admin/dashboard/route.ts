import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, CaseStatus, VerificationStatus, MembershipTier } from "@prisma/client"

// GET /api/admin/dashboard - Get admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Get dashboard statistics
    const [
      totalUsers,
      totalJournalists,
      totalCases,
      publishedCases,
      pendingVerifications,
      recentCases,
      recentUsers,
      caseStats,
      journalistStats
    ] = await Promise.all([
      db.user.count(),
      db.journalistProfile.count(),
      db.case.count(),
      db.case.count({ where: { status: CaseStatus.PUBLISHED } }),
      db.journalistProfile.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      db.case.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          journalist: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          journalistProfile: {
            select: {
              verificationStatus: true,
              membershipTier: true
            }
          }
        }
      }),
      db.case.groupBy({
        by: ["status"],
        _count: true
      }),
      db.journalistProfile.groupBy({
        by: ["verificationStatus"],
        _count: true
      })
    ])

    // Calculate additional stats
    const activeCases = totalCases - publishedCases
    const verifiedJournalists = journalistStats.find(s => s.verificationStatus === VerificationStatus.VERIFIED)?._count || 0
    const publicUsers = totalUsers - totalJournalists

    return NextResponse.json({
      overview: {
        totalUsers,
        totalJournalists,
        verifiedJournalists,
        publicUsers,
        totalCases,
        publishedCases,
        activeCases,
        pendingVerifications
      },
      caseStats: caseStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count
        return acc
      }, {} as Record<string, number>),
      journalistStats: journalistStats.reduce((acc, stat) => {
        acc[stat.verificationStatus] = stat._count
        return acc
      }, {} as Record<string, number>),
      recentCases,
      recentUsers
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}