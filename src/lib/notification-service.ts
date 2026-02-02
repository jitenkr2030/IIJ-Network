import { db } from "@/lib/db"
import { NotificationType, NotificationPriority, EmailFrequency } from "@prisma/client"

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  priority?: NotificationPriority
  entityId?: string
  entityType?: string
}

export interface EmailData {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
  templateId?: string
  data?: any
}

class NotificationService {
  // Create a new notification
  async createNotification(data: NotificationData) {
    try {
      const notification = await db.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
          priority: data.priority || NotificationPriority.MEDIUM,
          entityId: data.entityId,
          entityType: data.entityType
        }
      })

      // Trigger real-time notification if needed
      await this.triggerRealTimeNotification(notification)

      return notification
    } catch (error) {
      console.error("Failed to create notification:", error)
      throw error
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.notification.count({ where: { userId } })
    ])

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    return await db.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true
      }
    })
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string) {
    return await db.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    return await db.notification.count({
      where: {
        userId,
        isRead: false
      }
    })
  }

  // Create email subscription
  async createEmailSubscription(userId: string, email: string, preferences?: any) {
    return await db.emailSubscription.upsert({
      where: { userId },
      update: {
        email,
        preferences: preferences ? JSON.stringify(preferences) : null,
        isActive: true
      },
      create: {
        userId,
        email,
        preferences: preferences ? JSON.stringify(preferences) : null
      }
    })
  }

  // Queue email for sending
  async queueEmail(data: EmailData) {
    return await db.emailQueue.create({
      data: {
        to: data.to,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
        templateId: data.templateId,
        data: data.data ? JSON.stringify(data.data) : null
      }
    })
  }

  // Send notification to case subscribers
  async notifyCaseSubscribers(caseId: string, type: NotificationType, title: string, message: string, data?: any) {
    // Get all active subscribers for this case
    const subscriptions = await db.caseSubscription.findMany({
      where: {
        caseId,
        isActive: true
      },
      include: {
        user: {
          include: {
            emailSubscription: true
          }
        }
      }
    })

    const notifications = []

    for (const subscription of subscriptions) {
      // Create in-app notification
      const notification = await this.createNotification({
        userId: subscription.userId,
        type,
        title,
        message,
        data,
        entityId: caseId,
        entityType: "case"
      })
      notifications.push(notification)

      // Queue email if user has email subscription
      if (subscription.user.emailSubscription?.isActive) {
        await this.queueEmail({
          to: subscription.user.emailSubscription.email,
          subject: `IIJN: ${title}`,
          htmlContent: this.generateEmailHtml(title, message, data),
          textContent: this.generateEmailText(title, message, data),
          data
        })
      }
    }

    return notifications
  }

  // Send notification to journalist followers
  async notifyJournalistFollowers(journalistId: string, type: NotificationType, title: string, message: string, data?: any) {
    // This would be implemented when we have a follower system
    // For now, we'll send to admin users
    const adminUsers = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "MODERATOR"] },
        isActive: true
      }
    })

    const notifications = []

    for (const admin of adminUsers) {
      const notification = await this.createNotification({
        userId: admin.id,
        type,
        title,
        message,
        data,
        entityId: journalistId,
        entityType: "journalist"
      })
      notifications.push(notification)
    }

    return notifications
  }

  // Trigger real-time notification (WebSocket, Push, etc.)
  private async triggerRealTimeNotification(notification: any) {
    // This would integrate with WebSocket or push notification service
    // For now, we'll just log it
    console.log(`Real-time notification triggered for user ${notification.userId}:`, notification.title)
  }

  // Generate HTML email content
  private generateEmailHtml(title: string, message: string, data?: any) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>IIJN - Indian Independent Journalists Network</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>${message}</p>
            ${data?.caseUrl ? `<p><a href="${data.caseUrl}" class="button">View Case</a></p>` : ''}
          </div>
          <div class="footer">
            <p>This notification was sent by the Indian Independent Journalists Network.</p>
            <p>If you no longer wish to receive these emails, please update your subscription preferences.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate plain text email content
  private generateEmailText(title: string, message: string, data?: any) {
    let text = `${title}\n\n${message}\n\n`
    text += `---\nIndian Independent Journalists Network (IIJN)\n`
    text += `Platform-Independent Journalism Association\n`
    
    if (data?.caseUrl) {
      text += `\nView Case: ${data.caseUrl}\n`
    }
    
    text += `\nTo unsubscribe from these notifications, please update your preferences in your profile.`
    
    return text
  }

  // Process email queue (would be called by a cron job)
  async processEmailQueue() {
    const pendingEmails = await db.emailQueue.findMany({
      where: {
        status: "PENDING",
        attempts: { lt: 3 } // Max 3 attempts
      },
      take: 10 // Process 10 at a time
    })

    for (const email of pendingEmails) {
      try {
        // Update status to sending
        await db.emailQueue.update({
          where: { id: email.id },
          data: { status: "SENDING" }
        })

        // Here you would integrate with an email service like SendGrid, Nodemailer, etc.
        // For now, we'll simulate sending
        await this.simulateEmailSend(email)

        // Mark as sent
        await db.emailQueue.update({
          where: { id: email.id },
          data: {
            status: "SENT",
            sentAt: new Date()
          }
        })
      } catch (error) {
        console.error(`Failed to send email ${email.id}:`, error)
        
        // Increment attempts and mark as failed if max attempts reached
        const newAttempts = email.attempts + 1
        await db.emailQueue.update({
          where: { id: email.id },
          data: {
            attempts: newAttempts,
            status: newAttempts >= 3 ? "FAILED" : "PENDING",
            error: error.message
          }
        })
      }
    }
  }

  // Simulate email sending (replace with real email service)
  private async simulateEmailSend(email: any) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // In production, this would be:
    // await sendgrid.send({
    //   to: email.to,
    //   from: 'noreply@iijn.org',
    //   subject: email.subject,
    //   html: email.htmlContent,
    //   text: email.textContent
    // })
    
    console.log(`Email sent to ${email.to}: ${email.subject}`)
  }
}

export const notificationService = new NotificationService()