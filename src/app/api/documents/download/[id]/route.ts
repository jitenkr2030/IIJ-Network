import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFile } from "fs/promises"
import { join } from "path"

// GET /api/documents/download/[id] - Download document file
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

    // Read file from disk
    const filePath = join(process.cwd(), document.filePath)
    try {
      const fileBuffer = await readFile(filePath)
      
      // Set appropriate headers for file download
      const headers = new Headers()
      headers.set("Content-Type", document.fileType)
      headers.set("Content-Length", fileBuffer.length.toString())
      headers.set("Content-Disposition", `attachment; filename="${document.fileName}"`)
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      })
    } catch (fileError) {
      console.error("File read error:", fileError)
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error("Document download error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}