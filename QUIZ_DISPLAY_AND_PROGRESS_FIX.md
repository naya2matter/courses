# Quiz Display & Progress API Bug - Complete Fix Guide

## 🐛 Issues Identified

### Issue 1: Quiz Badge Shows But No Way to Take Quiz

**Problem:** The "Quiz" badge appears on modules with `has_quiz: true`, but there's **no button, link, or interface** for users to actually take the quiz.

**Evidence from your code** (`online-course-detail-page.tsx` line 276-285):
```tsx
{module.has_quiz && (
  <Badge variant="outline" className="...">
    Quiz
  </Badge>
)}
```

This only shows a badge - no click handler, no link, no quiz interface!

### Issue 2: Progress API Flooding Backend

**Problem:** Progress API is called every **2 seconds** instead of every **2 minutes**.

**Evidence from your logs:**
```
[09:12:56] PROGRESS_CALLED
[09:12:58] PROGRESS_CALLED  ← 2 seconds! (Should be 120s)
[09:13:00] PROGRESS_CALLED
```

**Root Cause:** Video `timeupdate` event fires every 250ms and triggers `sendProgressSnapshot` on every update.

---

## 🔧 FIX 1: Add Quiz Interface (CRITICAL)

### Step 1: Add Quiz Button to Module Accordion

**File:** `courses/src/pages/user/online-courses/online-course-detail-page.tsx`

**Find:** The `ModuleAccordion` component (around line 400)

**Add this inside the module accordion, after the content list:**

```tsx
{/* Content list */}
<div className={...}>
  {/* ... existing content list code ... */}
</div>

{/* QUIZ SECTION - ADD THIS */}
{!isLocked && module.has_quiz && (
  <div className="border-t border-white/6 px-4 py-4">
    <div className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
          <svg className="size-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white/90">
            Module Quiz
          </h4>
          <p className="text-xs text-white/50">
            {module.quiz_status === 'completed' 
              ? 'Quiz completed' 
              : module.quiz_status === 'in_progress'
              ? 'Quiz in progress'
              : 'Test your knowledge with this quiz'
            }
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={module.quiz_status === 'completed' ? 'outline' : 'default'}
        className={module.quiz_status === 'completed' 
          ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
          : 'bg-amber-500 hover:bg-amber-600 text-white'
        }
        onClick={() => {
          // Navigate to quiz page
          navigate(`/user/quizzes/${module.id}/start`)
        }}
      >
        {module.quiz_status === 'completed' 
          ? 'View Results' 
          : module.quiz_status === 'in_progress'
          ? 'Continue Quiz'
          : 'Start Quiz'
        }
      </Button>
    </div>
  </div>
)}
```

### Step 2: Import Required Components

At the top of the file, make sure you have:

```tsx
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"  // Already imported
```

---

## 🔧 FIX 2: Progress API Throttling (CRITICAL)

**File:** `courses/src/pages/user/online-courses/hooks/use-learning-session.ts`

### Step 1: Add Throttle Refs

Find the refs section (near line 50-80) and add:

```typescript
// Add after other refs
const lastProgressSentAtRef = useRef<number>(0)
const MIN_PROGRESS_INTERVAL = 30000 // 30 seconds minimum between API calls
```

### Step 2: Modify sendProgressSnapshot

Find `sendProgressSnapshot` function (around line 350) and modify:

```typescript
const sendProgressSnapshot = useCallback(async (position: number, completion: number, force = false) => {
  if (!sessionIdRef.current || endedRef.current) return

  // THROTTLE: Only send if 30s passed or forced (pause/end events)
  const now = Date.now()
  const timeSinceLastSend = now - lastProgressSentAtRef.current
  
  if (!force && timeSinceLastSend < MIN_PROGRESS_INTERVAL) {
    // Still update local state, just skip API call
    const payload = toMetrics(position, completion)
    latestPositionRef.current = payload.playback_position
    trackDisplayedCompletion(payload.completion_percentage)
    persistSessionSnapshot()
    return // Skip API call
  }
  
  lastProgressSentAtRef.current = now

  const payload = toMetrics(position, completion)
  latestPositionRef.current = payload.playback_position
  trackDisplayedCompletion(payload.completion_percentage)
  persistSessionSnapshot()

  try {
    await sendSessionProgress(sessionIdRef.current, payload)
  } catch (err) {
    if (isAbortError(err)) return
    // ... rest of error handling
  }
}, [onRealError, persistSessionSnapshot, toMetrics, trackDisplayedCompletion])
```

### Step 3: Update Callers to Use force=true

Find `onVideoPause`, `onVideoEnd`, `onVideoSeek` and update to force immediate send:

```typescript
// In onVideoPause:
void sendProgressSnapshot(latestPositionRef.current, latestCompletionRef.current, true) // force=true

// In onVideoEnd:
void sendProgressSnapshot(position, 100, true) // force=true

// In onVideoSeek:
void sendProgressSnapshot(to, latestCompletionRef.current, true) // force=true

// 2-minute ticker (keep as false):
void sendProgressSnapshot(latestPositionRef.current, latestCompletionRef.current, false) // throttled
```

---

## ✅ Testing Checklist

### Quiz Display
- [ ] Open course detail page
- [ ] Check browser console for "Module data:" log
- [ ] Verify module with `has_quiz: true` shows quiz section
- [ ] Click "Start Quiz" button → navigates to quiz

### Progress API
- [ ] Play video for 1 minute
- [ ] Check backend logs - should see ~2 progress calls (not 30+)
- [ ] Pause video - should see immediate progress call
- [ ] Resume video - throttling should resume

---

## 📞 Need More Help?

If issues persist, share:
1. Browser console screenshot of module data
2. Backend logs showing progress call frequency
3. Any error messages in console