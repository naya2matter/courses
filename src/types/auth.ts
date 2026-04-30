export const Role = {
  admin: "admin",
  user: "user",
} as const

export type Role = (typeof Role)[keyof typeof Role]

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string
  role: Role
}
