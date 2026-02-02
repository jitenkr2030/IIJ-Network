import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notificationService } from "@/lib/notification-service"
import { z } from "zod"

const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: z.enum([
    "CASE_PUBLISHED", "CASE_UPDATED", "CASE_COMMENT", "DOCUMENT_UPLOADED",
    "VERIFICATION_REQUESTED", "VERIFICATION_COMPLETED", "SUBSCRIPTION_ALERT",
    "SYSTEM_ANNOUNCEMENT", "JOURNALIST_VERIFIED", "MENTION", "DEADLINE_REMINDER"
  ]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  data: z.any().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
})

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    if (unreadOnly) {
      // Get unread count
      const unreadCount = await notificationService.getUnreadCount(session.user.id)
      return NextResponse.json({ unreadCount })
    }

    const result = await notificationService.getUserNotifications(
      session.user.id,
      page,
      limit
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create new notification (admin only)
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

    const body = await request.json()
    const validatedData = createNotificationSchema.parse(body)

    const notification = await notificationService.createNotification(validatedData)

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("Notification creation error:", error)
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