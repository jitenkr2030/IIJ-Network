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

// GET /api/journalists/me - Get current user's journalist profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!session.user.journalistProfile) {
      return NextResponse.json(
        { error: "Journalist profile not found" },
        { status: 404 }
      )
    }

    const journalist = await db.journalistProfile.findUnique({
      where: { id: session.user.journalistProfile.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true
          }
        },
        mentor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        mentees: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        cases: {
          include: {
            _count: {
              select: {
                comments: true,
                documents: true,
                updates: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        publications: {
          orderBy: { publishedAt: "desc" }
        },
        _count: {
          select: {
            cases: true,
            publications: true,
            mentees: true
          }
        }
      }
    })

    return NextResponse.json(journalist)
  } catch (error) {
    console.error("Journalist profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/journalists/me - Update current user's journalist profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!session.user.journalistProfile) {
      return NextResponse.json(
        { error: "Journalist profile not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const updatedJournalist = await db.journalistProfile.update({
      where: { id: session.user.journalistProfile.id },
      data: validatedData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json(updatedJournalist)
  } catch (error) {
    console.error("Journalist profile update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}