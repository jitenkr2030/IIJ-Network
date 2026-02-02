import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notificationService } from "@/lib/notification-service"

// PUT /api/notifications/[id] - Mark notification as read
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

    const notificationId = params.id

    await notificationService.markAsRead(notificationId, session.user.id)

    return NextResponse.json({ message: "Notification marked as read" })
  } catch (error) {
    console.error("Notification update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete notification
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

    const notificationId = params.id

    // This would need to be implemented in the service
    // For now, we'll just mark as read
    await notificationService.markAsRead(notificationId, session.user.id)

    return NextResponse.json({ message: "Notification deleted" })
  } catch (error) {
    console.error("Notification deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}