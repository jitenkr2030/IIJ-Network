import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DocumentType } from "@prisma/client"
import { z } from "zod"
import { unlink } from "fs/promises"
import { join } from "path"

const updateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  documentType: z.nativeEnum(DocumentType).optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/documents/[id] - Get single document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id

    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            slug: true,
            journalistId: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check access permissions
    const session = await getServerSession(authOptions)
    if (!document.isPublic && (!session || (
      session.user.role === "PUBLIC" ||
      (session.user.role === "JOURNALIST" && document.case.journalistId !== session.user.journalistProfile?.id)
    ))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Document fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[id] - Update document
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

    const documentId = params.id
    const body = await request.json()
    const validatedData = updateDocumentSchema.parse(body)

    // Get existing document
    const existingDocument = await db.document.findUnique({
      where: { id: documentId },
      include: {
        case: true
      }
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check edit permissions
    if (session.user.role === "JOURNALIST" && existingDocument.case.journalistId !== session.user.journalistProfile?.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const updatedDocument = await db.document.update({
      where: { id: documentId },
      data: validatedData,
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

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("Document update error:", error)
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

// DELETE /api/documents/[id] - Delete document
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

    const documentId = params.id

    // Get existing document
    const existingDocument = await db.document.findUnique({
      where: { id: documentId },
      include: {
        case: true
      }
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check delete permissions
    if (session.user.role === "JOURNALIST" && existingDocument.case.journalistId !== session.user.journalistProfile?.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), existingDocument.filePath)
      await unlink(filePath)
    } catch (error) {
      console.error("Failed to delete file:", error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db.document.delete({
      where: { id: documentId }
    })

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Document deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}