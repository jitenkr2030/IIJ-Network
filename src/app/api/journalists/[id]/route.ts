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

// GET /api/journalists/[id] - Get single journalist profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const journalistId = params.id

    const journalist = await db.journalistProfile.findUnique({
      where: { id: journalistId },
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
          where: { isPublic: true },
          include: {
            _count: {
              select: {
                comments: true,
                documents: true,
                updates: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 6
        },
        publications: {
          orderBy: { publishedAt: "desc" },
          take: 6
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

    if (!journalist) {
      return NextResponse.json(
        { error: "Journalist profile not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(journalist)
  } catch (error) {
    console.error("Journalist fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/journalists/[id] - Update journalist profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const journalistId = params.id
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Get existing journalist profile
    const existingJournalist = await db.journalistProfile.findUnique({
      where: { id: journalistId }
    })

    if (!existingJournalist) {
      return NextResponse.json(
        { error: "Journalist profile not found" },
        { status: 404 }
      )
    }

    // Check if user owns this profile or is admin
    if (session.user.journalistProfile?.id !== journalistId && 
        session.user.role !== "ADMIN" && 
        session.user.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const updatedJournalist = await db.journalistProfile.update({
      where: { id: journalistId },
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
    console.error("Journalist update error:", error)
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