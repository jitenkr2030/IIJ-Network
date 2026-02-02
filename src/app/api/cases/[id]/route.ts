import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { CaseStatus, Priority } from "@prisma/client"
import { z } from "zod"
import { canEditCase } from "@/lib/auth-helpers"

const updateCaseSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  content: z.string().optional(),
  category: z.string().min(1, "Category is required").optional(),
  tags: z.string().optional(),
  location: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(CaseStatus).optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/cases/[id] - Get single case
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id

    const caseItem = await db.case.findUnique({
      where: { id: caseId },
      include: {
        journalist: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        timeline: {
          orderBy: { eventDate: "desc" }
        },
        documents: {
          orderBy: { createdAt: "desc" }
        },
        sources: {
          orderBy: { createdAt: "desc" }
        },
        authorities: {
          orderBy: { createdAt: "desc" }
        },
        updates: {
          orderBy: { createdAt: "desc" }
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            documents: true,
            comments: true,
            updates: true,
            timeline: true
          }
        }
      }
    })

    if (!caseItem) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      )
    }

    // Check access permissions
    const session = await getServerSession(authOptions)
    if (!caseItem.isPublic && (!session || (
      session.user.role === "PUBLIC" ||
      (session.user.role === "JOURNALIST" && session.user.journalistProfile?.id !== caseItem.journalistId)
    ))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json(caseItem)
  } catch (error) {
    console.error("Case fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/cases/[id] - Update case
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

    const caseId = params.id
    const body = await request.json()
    const validatedData = updateCaseSchema.parse(body)

    // Get existing case
    const existingCase = await db.case.findUnique({
      where: { id: caseId },
      include: { journalist: true }
    })

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      )
    }

    // Check edit permissions
    if (!canEditCase(session.user, existingCase.journalistId)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Update slug if title changed
    let updateData: any = { ...validatedData }
    if (validatedData.title && validatedData.title !== existingCase.title) {
      const newSlug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      // Check if new slug already exists (excluding current case)
      const slugExists = await db.case.findFirst({
        where: {
          slug: newSlug,
          id: { not: caseId }
        }
      })

      if (slugExists) {
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        updateData.slug = `${newSlug}-${randomSuffix}`
      } else {
        updateData.slug = newSlug
      }
    }

    // Set publishedAt if publishing
    if (validatedData.status === CaseStatus.PUBLISHED && existingCase.status !== CaseStatus.PUBLISHED) {
      updateData.publishedAt = new Date()
    }

    const updatedCase = await db.case.update({
      where: { id: caseId },
      data: updateData,
      include: {
        journalist: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedCase)
  } catch (error) {
    console.error("Case update error:", error)
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

// DELETE /api/cases/[id] - Delete case
export async function DELETE(
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

    const caseId = params.id

    // Get existing case
    const existingCase = await db.case.findUnique({
      where: { id: caseId }
    })

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      )
    }

    // Check edit permissions
    if (!canEditCase(session.user, existingCase.journalistId)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    await db.case.delete({
      where: { id: caseId }
    })

    return NextResponse.json(
      { message: "Case deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Case deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}