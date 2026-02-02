import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { CaseStatus, Priority, NotificationType } from "@prisma/client"
import { z } from "zod"
import { notificationService } from "@/lib/notification-service"

const createCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.string().optional(),
  location: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  isPublic: z.boolean().default(false),
})

// GET /api/cases - List cases
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const status = searchParams.get("status") || ""
    const journalistId = searchParams.get("journalistId") || ""

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { content: { contains: search } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status as CaseStatus
    }

    if (journalistId) {
      where.journalistId = journalistId
    }

    // Only show public cases or user's own cases
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === "PUBLIC") {
      where.isPublic = true
    } else if (session.user.role === "JOURNALIST") {
      // Journalists can see their own cases (draft/private) and all public cases
      if (!where.OR) where.OR = []
      where.OR.push(
        { isPublic: true },
        { journalistId: session.user.journalistProfile?.id }
      )
    }
    // Admins can see all cases

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
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
          _count: {
            select: {
              documents: true,
              comments: true,
              updates: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.case.count({ where })
    ])

    return NextResponse.json({
      cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Cases fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/cases - Create new case
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "JOURNALIST" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only journalists can create cases" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createCaseSchema.parse(body)

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if slug already exists
    const existingCase = await db.case.findUnique({
      where: { slug }
    })

    let finalSlug = slug
    if (existingCase) {
      // Append random suffix if slug exists
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      finalSlug = `${slug}-${randomSuffix}`
    }

    const caseData = {
      title: validatedData.title,
      description: validatedData.description,
      content: validatedData.content,
      category: validatedData.category,
      tags: validatedData.tags,
      location: validatedData.location,
      priority: validatedData.priority,
      isPublic: validatedData.isPublic,
      slug: finalSlug,
      journalistId: session.user.journalistProfile?.id,
      status: CaseStatus.DRAFT
    }

    const newCase = await db.case.create({
      data: caseData,
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

    // Send notification to admin users about new case
    if (newCase.isPublic) {
      await notificationService.notifyJournalistFollowers(
        newCase.journalistId || "",
        NotificationType.CASE_PUBLISHED,
        `New Case Published: ${newCase.title}`,
        `${newCase.journalist?.user.name || "A journalist"} has published a new case: ${newCase.description}`,
        {
          caseId: newCase.id,
          caseSlug: newCase.slug,
          journalistName: newCase.journalist?.user.name
        }
      )
    }

    return NextResponse.json(newCase, { status: 201 })
  } catch (error) {
    console.error("Case creation error:", error)
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