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

// ── API request / response shapes ─────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

/** Shape returned by the backend UserResource / AuthResource. */
export interface UserResource {
  id: number
  name: string
  email: string
  role: Role
  avatar?: string
}

/**
 * Laravel JsonResource wraps every response under a `data` key.
 * This generic type represents that envelope.
 */
export interface LaravelResource<T> {
  data: T
}

/** Inner payload of the POST /login response. */
export interface AuthPayload {
  token: string
  token_type: string
  user: UserResource
}

/** Full shape returned by POST /login (Laravel resource envelope). */
export type AuthResponse = LaravelResource<AuthPayload>
