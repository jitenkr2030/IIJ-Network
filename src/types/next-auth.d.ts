import { UserRole, JournalistProfile } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      isActive: boolean
      journalistProfile?: JournalistProfile | null
    }
  }

  interface User {
    role: UserRole
    isActive: boolean
    journalistProfile?: JournalistProfile | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    isActive: boolean
    journalistProfile?: JournalistProfile | null
  }
}