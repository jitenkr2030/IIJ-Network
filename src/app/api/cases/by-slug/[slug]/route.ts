import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/cases/by-slug/[slug] - Get case by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    const caseItem = await db.case.findUnique({
      where: { slug },
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