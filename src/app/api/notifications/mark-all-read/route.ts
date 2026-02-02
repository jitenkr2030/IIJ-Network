import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notificationService } from "@/lib/notification-service"

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await notificationService.markAllAsRead(session.user.id)

    return NextResponse.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Mark all read error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}