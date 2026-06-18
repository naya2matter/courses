/**
 * Email-link token handoff.
 *
 * Background:
 *   The backend's magic-login flow validates a one-time link and then redirects
 *   the browser to a page URL carrying a brand-new Sanctum token:
 *
 *     https://app.example.com/courses/2?token=<TOKEN_FOR_THAT_USER>&course=2
 *
 *   That token belongs to the *email recipient*, not to whoever happens to be
 *   logged in already (e.g. an admin). The SPA must therefore treat a `?token=`
 *   in the URL as a forced re-login: drop the existing session and adopt the new
 *   token before any authenticated request is made.
 *
 * Why a plain function (not a hook):
 *   This has to run *before* the auth bootstrap calls `/me`. Hooks run inside
 *   render/effects — too late, and after a route has already mounted. Calling
 *   this synchronously at the very top of the AuthProvider bootstrap guarantees
 *   the swap happens first, for every route the backend might redirect to.
 */

import { apiClient, USER_ROLE_KEY } from "@/lib/api"
import { Role } from "@/types/auth"

export interface EmailTokenResult {
  /** True when a `?token=` was found in the URL and adopted. */
  consumed: boolean
}

/**
 * If the current URL contains `?token=`, adopt it as the active session and
 * strip it from the address bar. Email links are always issued for a regular
 * user, so the stored role is set to {@link Role.user}.
 *
 * Safe to call unconditionally on app start — it is a no-op when no token is
 * present.
 */
export function consumeEmailTokenFromUrl(): EmailTokenResult {
  const params = new URLSearchParams(window.location.search)
  const urlToken = params.get("token")

  if (!urlToken) return { consumed: false }

  // 1. Drop whoever was logged in before, then adopt the link's token.
  apiClient.clearToken()
  apiClient.setToken(urlToken)
  localStorage.setItem(USER_ROLE_KEY, Role.user)

  // 2. Remove `token` from the URL so a refresh / shared link can't replay it
  //    and so the secret never lingers in browser history. Any other params
  //    (e.g. `course`) are preserved.
  params.delete("token")
  const qs = params.toString()
  const cleanUrl = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
  window.history.replaceState({}, "", cleanUrl)

  return { consumed: true }
}
