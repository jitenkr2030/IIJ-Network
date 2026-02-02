"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bell, Check, CheckCircle, AlertCircle, Info, X, Settings } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { NotificationType, NotificationPriority } from "@prisma/client"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  priority: NotificationPriority
  createdAt: string
  data?: any
}

interface NotificationsProps {
  className?: string
}

const notificationIcons = {
  CASE_PUBLISHED: CheckCircle,
  CASE_UPDATED: Info,
  CASE_COMMENT: Bell,
  DOCUMENT_UPLOADED: AlertCircle,
  VERIFICATION_REQUESTED: Settings,
  VERIFICATION_COMPLETED: CheckCircle,
  SUBSCRIPTION_ALERT: Bell,
  SYSTEM_ANNOUNCEMENT: Info,
  JOURNALIST_VERIFIED: CheckCircle,
  MENTION: Bell,
  DEADLINE_REMINDER: AlertCircle,
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
}

export function Notifications({ className }: NotificationsProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (session) {
      fetchNotifications()
      fetchUnreadCount()
      
      // Set up polling for new notifications
      const interval = setInterval(fetchUnreadCount, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications?limit=10")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true")
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT"
      })
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST"
      })
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    const IconComponent = notificationIcons[type] || Bell
    return <IconComponent className="h-4 w-4" />
  }

  if (!session) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-4 cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`p-1 rounded-full ${
                    notification.isRead ? 'text-muted-foreground' : 'text-primary'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium truncate ${
                        notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        {notification.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${priorityColors[notification.priority]}`}
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                    <p className={`text-sm mb-2 line-clamp-2 ${
                      notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Button variant="ghost" className="w-full justify-center">
                View all notifications
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}