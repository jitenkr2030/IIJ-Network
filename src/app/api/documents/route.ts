import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DocumentType } from "@prisma/client"
import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

const uploadDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  caseId: z.string().min(1, "Case ID is required"),
  documentType: z.nativeEnum(DocumentType),
  isPublic: z.boolean().default(false),
})

// GET /api/documents - List documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get("caseId")
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

    if (caseId) {
      where.caseId = caseId
    }

    // Filter based on user role and document visibility
    if (session.user.role === "PUBLIC") {
      where.isPublic = true
    } else if (session.user.role === "JOURNALIST") {
      // Journalists can see their own case documents and all public documents
      if (!where.OR) where.OR = []
      where.OR.push(
        { isPublic: true },
        {
          case: {
            journalistId: session.user.journalistProfile?.id
          }
        }
      )
    }
    // Admins can see all documents

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              title: true,
              slug: true,
              journalistId: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.document.count({ where })
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Documents fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/documents - Upload new document
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
        { error: "Only journalists can upload documents" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const metadata = JSON.parse(formData.get("metadata") as string)

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate metadata
    const validatedData = uploadDocumentSchema.parse(metadata)

    // Check if user has access to the case
    const caseItem = await db.case.findUnique({
      where: { id: validatedData.caseId }
    })

    if (!caseItem) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      )
    }

    if (session.user.role === "JOURNALIST" && caseItem.journalistId !== session.user.journalistProfile?.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", "documents")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadsDir, uniqueFileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save document info to database
    const document = await db.document.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        caseId: validatedData.caseId,
        fileName: file.name,
        filePath: `/uploads/documents/${uniqueFileName}`,
        fileType: file.type,
        fileSize: file.size,
        documentType: validatedData.documentType,
        isPublic: validatedData.isPublic,
        uploadedBy: session.user.id
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Document upload error:", error)
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