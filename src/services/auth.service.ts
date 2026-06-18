/**
 * Auth service — all authentication API calls in one place.
 *
 * Endpoints used:
 *   POST /login         — unified login (admin + user)
 *   GET  /admin/me      — fetch the authenticated admin profile
 *   GET  /user/me       — fetch the authenticated user profile
 *   POST /logout        — unified logout (requires Bearer token)
 */

import { apiClient } from "@/lib/api"
import type { AuthPayload, AuthResponse, LaravelResource, LoginRequest, UserResource } from "@/types/auth"
import { Role } from "@/types/auth"

export const authService = {
  /**
   * POST /login
   * Unwraps Laravel's `data` envelope and returns the inner auth payload.
   */
  async login(data: LoginRequest): Promise<AuthPayload> {
    const res = await apiClient.post<AuthResponse>("/login", data)
    return res.data
  },

  /**
   * GET /admin/me  or  GET /user/me
   * Unwraps Laravel's `data` envelope and returns the user profile.
   */
  async getMe(role: Role, signal?: AbortSignal): Promise<UserResource> {
    const path = role === Role.admin ? "/admin/me" : "/user/me"
    const res = await apiClient.get<LaravelResource<UserResource>>(path, signal)
    return res.data
  },

  /**
   * POST /logout
   * Invalidates the current Sanctum token server-side.
   * Requires Authorization: Bearer <token> (handled by ApiClient).
   */
  logout(): Promise<void> {
    return apiClient.post<void>("/logout")
  },
}
