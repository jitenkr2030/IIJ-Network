import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notificationService } from "@/lib/notification-service"
import { z } from "zod"

const subscribeSchema = z.object({
  email: z.string().email("Valid email is required"),
  preferences: z.any().optional(),
})

// POST /api/notifications/subscribe - Subscribe to email notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = subscribeSchema.parse(body)

    const subscription = await notificationService.createEmailSubscription(
      session.user.id,
      validatedData.email,
      validatedData.preferences
    )

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error("Subscription error:", error)
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

// GET /api/notifications/subscribe - Get user's subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // This would need to be implemented in the service
    // For now, return a placeholder
    return NextResponse.json({
      subscribed: false,
      email: session.user.email,
      preferences: {}
    })
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}