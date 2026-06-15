# Frontend Change Log and Handoff Notes

Purpose
- This file is for backend to frontend handoff.
- Every frontend change must be added here.
- Keep entries short, practical, and testable.

How to update this file
1. Add a new section at the top under Latest updates.
2. Include: date, area, files changed, what changed, why, impact, and QA steps.
3. Do not remove old entries.
4. If a change is reverted, add a new entry that says reverted and why.

Entry template
- Date:
- Area:
- Type: Feature | Fix | Refactor | Revert
- Files changed:
- What changed:
- Why:
- Impact:
- QA steps:
- Notes for frontend dev:

---

## Latest updates

### 2026-05-29 - User audio thumbnail image not showing
- Area: User audio pages (list and detail)
- Type: Fix
- Files changed:
  - src/pages/user/audio/service/user-audio.service.ts
- What changed:
  - Updated getThumbnailUrl to return the value directly when thumbnail_path is already a full URL.
  - Kept fallback behavior to build origin/storage/... only when thumbnail_path is relative.
  - Backend environment fix also applied: recreated public/storage link using php artisan storage:link.
- Why:
  - Two root causes were happening together:
  - Storage symlink issue: public/storage was a real directory, not linked to storage/app/public, so storage URLs returned 404.
  - Frontend URL issue: getThumbnailUrl prepended origin/storage to a value that was already a full URL from backend, creating an invalid doubled URL.
- Impact:
  - Audio thumbnails now resolve correctly on user pages.
  - Service now supports both backend formats:
  - Full URL from backend (used now).
  - Relative storage path (fallback compatibility).
- QA steps:
  1. Open user audio list page and confirm thumbnail appears.
  2. Open user audio detail page and confirm header image appears.
  3. In browser network, open image request and confirm 200 response.
  4. Confirm URL shape is valid (no repeated http://.../storage/http://...).
- Notes for frontend dev:
  - Backend currently returns full thumbnail URL via Storage::disk('public')->url().
  - Do not prepend origin/storage when API already returns an absolute URL.
  - If thumbnails disappear after deploy, first verify public/storage symlink on server.

### 2026-05-29 - Admin users pagination next page fix
- Area: Admin user management list page
- Type: Fix
- Files changed:
  - src/pages/admin/user-management/users/store/user.store.ts
- What changed:
  - Updated setFilters logic to keep page when page is provided.
  - Page resets to 1 only when page is not provided.
- Why:
  - Next and Previous buttons were sending page changes, but store logic always forced page back to 1.
  - This made pagination appear broken with no visible error.
- Impact:
  - Next and Previous pagination now work correctly on admin users page.
  - Search and filter updates still reset to page 1 as expected.
- QA steps:
  1. Open admin user management users page.
  2. Click Next.
  3. Confirm page number and rows update.
  4. Click Previous.
  5. Confirm it returns to the prior page.
  6. Use search, confirm results reload from page 1.
- Notes for frontend dev:
  - If you add new filters, continue passing explicit page values for pagination actions.
  - Keep reset-to-page-1 behavior only for filter and search changes.
