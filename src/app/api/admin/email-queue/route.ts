import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notificationService } from "@/lib/notification-service"

// POST /api/admin/email-queue - Process email queue (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    await notificationService.processEmailQueue()

    return NextResponse.json({ message: "Email queue processed successfully" })
  } catch (error) {
    console.error("Email queue processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}