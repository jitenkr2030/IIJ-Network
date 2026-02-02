import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { MembershipTier, VerificationStatus } from "@prisma/client"
import { z } from "zod"

const updateProfileSchema = z.object({
  bio: z.string().optional(),
  experience: z.string().optional(),
  specialization: z.string().optional(),
  location: z.string().optional(),
  languages: z.string().optional(),
  website: z.string().optional(),
  socialMedia: z.string().optional(),
})

// GET /api/journalists - List journalists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const search = searchParams.get("search") || ""
    const specialization = searchParams.get("specialization") || ""
    const location = searchParams.get("location") || ""
    const verification = searchParams.get("verification") || ""

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { bio: { contains: search } },
        { specialization: { contains: search } }
      ]
    }

    if (specialization) {
      where.specialization = { contains: specialization }
    }

    if (location) {
      where.location = { contains: location }
    }

    if (verification === "verified") {
      where.isVerified = true
    } else if (verification === "unverified") {
      where.isVerified = false
    }

    const [journalists, total] = await Promise.all([
      db.journalistProfile.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              cases: true,
              publications: true,
              mentees: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.journalistProfile.count({ where })
    ])

    return NextResponse.json({
      journalists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Journalists fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}