"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { SubscriptionManager } from "@/components/subscription-manager"
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Users,
  Shield,
  Settings,
  Check,
  Clock
} from "lucide-react"
import { NotificationType, NotificationPriority } from "@prisma/client"
import { formatDateTime } from "@/lib/utils"

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

interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
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

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState("all")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [session, currentPage, activeTab])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20"
      })

      if (activeTab === "unread") {
        params.set("unreadOnly", "true")
      }

      const response = await fetch(`/api/notifications?${params}`)
      if (response.ok) {
        const data: NotificationsResponse = await response.json()
        setNotifications(data.notifications || [])
        setTotalPages(data.pagination?.pages || 1)
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
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    const IconComponent = notificationIcons[type] || Bell
    return <IconComponent className="h-5 w-5" />
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.entityType === "case" && notification.data?.caseSlug) {
      return `/cases/${notification.data.caseSlug}`
    }
    return "#"
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your notifications.
            </p>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">
                  Stay updated with your subscribed cases and platform news
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark All as Read
                </Button>
              )}
              <SubscriptionManager />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {activeTab === "unread" 
                          ? "All your notifications have been read."
                          : "You'll see notifications here when you subscribe to cases or when there are platform updates."
                        }
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" asChild>
                          <Link href="/cases">Browse Cases</Link>
                        </Button>
                        <SubscriptionManager />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={`transition-colors ${
                          !notification.isRead ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              notification.isRead ? 'text-muted-foreground' : 'text-primary'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`font-semibold ${
                                      notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                                    }`}>
                                      {notification.title}
                                    </h3>
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs ${priorityColors[notification.priority]}`}
                                    >
                                      {notification.priority}
                                    </Badge>
                                  </div>
                                  <p className={`text-sm mb-2 ${
                                    notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDateTime(notification.createdAt)}
                                    </div>
                                    {!notification.isRead && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        <span>Unread</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex gap-2">
                                  {getNotificationLink(notification) !== "#" && (
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={getNotificationLink(notification)}>
                                        View
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                                
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Mark as read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}