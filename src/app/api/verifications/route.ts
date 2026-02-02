import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { VerificationTarget, VerificationStatus, VerifierType } from "@prisma/client"
import { z } from "zod"

const createVerificationSchema = z.object({
  targetId: z.string().min(1, "Target ID is required"),
  targetType: z.nativeEnum(VerificationTarget),
  status: z.nativeEnum(VerificationStatus),
  confidence: z.number().min(1).max(100).optional(),
  notes: z.string().optional(),
  evidence: z.string().optional(),
})

// GET /api/verifications - List verifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get("targetId")
    const targetType = searchParams.get("targetType")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const skip = (page - 1) * limit
    const where: any = {}

    if (targetId) where.targetId = targetId
    if (targetType) where.targetType = targetType as VerificationTarget

    // Filter based on user role
    if (session.user.role === "PUBLIC") {
      // Public users can only see verifications for public content
      // This would need to be implemented based on your business logic
    } else if (session.user.role === "JOURNALIST") {
      // Journalists can see verifications for their own content and public content
      where.OR = [
        { verifierId: session.user.id },
        // Add conditions for public content
      ]
    }
    // Admins and moderators can see all verifications

    const [verifications, total] = await Promise.all([
      db.verification.findMany({
        where,
        include: {
          verifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.verification.count({ where })
    ])

    return NextResponse.json({
      verifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Verifications fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/verifications - Create new verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createVerificationSchema.parse(body)

    // Determine verifier type based on user role
    let verifierType = VerifierType.PUBLIC
    if (session.user.role === "JOURNALIST") {
      verifierType = VerifierType.JOURNALIST
    } else if (session.user.role === "ADMIN" || session.user.role === "MODERATOR") {
      verifierType = VerifierType.ADMIN
    }

    // Check if user has permission to verify this target
    // This would need business logic based on target type and user role

    const verification = await db.verification.create({
      data: {
        ...validatedData,
        verifierId: session.user.id,
        verifierType
      },
      include: {
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(verification, { status: 201 })
  } catch (error) {
    console.error("Verification creation error:", error)
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