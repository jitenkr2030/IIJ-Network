import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/signin")
  }
  return user
}

export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireAuth()
  
  const roles = Array.isArray(role) ? role : [role]
  
  if (!roles.includes(user.role)) {
    redirect("/unauthorized")
  }
  
  return user
}

export async function requireJournalist() {
  return await requireRole(UserRole.JOURNALIST)
}

export async function requireAdmin() {
  return await requireRole([UserRole.ADMIN, UserRole.MODERATOR])
}

export function isJournalist(user: any): boolean {
  return user?.role === UserRole.JOURNALIST
}

export function isAdmin(user: any): boolean {
  return user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR
}

export function canEditCase(user: any, caseJournalistId?: string): boolean {
  if (isAdmin(user)) return true
  if (isJournalist(user) && user.journalistProfile?.id === caseJournalistId) return true
  return false
}