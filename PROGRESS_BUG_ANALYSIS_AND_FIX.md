# Progress API Bug Analysis and Fix Guide

## 🔴 CRITICAL BUG IDENTIFIED

From your logs, the progress API is being called **every 2-3 seconds** instead of every **2 minutes (120 seconds)** as intended.

### Log Evidence (Problem)

```
[09:11:12] PROGRESS_CALLED
[09:11:14] PROGRESS_CALLED  ← 2 seconds later
[09:11:15] PROGRESS_CALLED  ← 1 second later
[09:11:19] PROGRESS_CALLED  ← 4 seconds later
[09:11:20] PROGRESS_CALLED  ← 1 second later
```

**Expected:** Calls every 120 seconds (2 minutes)  
**Actual:** Calls every 1-4 seconds

### Impact
- **High server load** - unnecessary API calls
- **Database overhead** - progress updates every few seconds
- **Incorrect metrics** - "active playback time" tracking is wrong
- **Session never ends** - as you noticed, end session is not called

---

## 🔍 Root Cause Analysis

The 2-minute ticker (`setInterval` with 120000ms) is working correctly, BUT there are **multiple other triggers** calling `sendProgressSnapshot`:

### 1. Video `timeupdate` Event (MAIN CULPRIT)

**File:** `online-content-viewer-page.tsx`

```typescript
function handleTimeUpdate() {
  if (!videoRef.current) return
  lastKnownTimeRef.current = videoRef.current.currentTime
  onProgress(videoRef.current.currentTime, videoRef.current.duration)  // ← Called every 250ms!
}
```

The `handleTimeUpdate` is called by the video player's `timeupdate` event, which fires **every 250ms (4 times per second)**!

### 2. `onVideoProgress` Calls `sendProgressSnapshot`

**File:** `use-learning-session.ts`

```typescript
const onVideoProgress = useCallback((position: number, duration: number) => {
  latestPositionRef.current = Math.max(0, position)
  if (duration > 0) {
    const computed = clampCompletion((position / duration) * 100)
    trackDisplayedCompletion(computed)

    for (const milestone of MILESTONES) {
      if (computed >= milestone && !milestonesRef.current.has(milestone)) {
        milestonesRef.current.add(milestone)
        pushEvent({ type: "milestone", at: position, pct: milestone })
        void sendProgressSnapshot(position, latestCompletionRef.current)  // ← Called on every milestone!
      }
    }
  }

  toMetrics(latestPositionRef.current, latestCompletionRef.current)
}, [pushEvent, sendProgressSnapshot, toMetrics, trackDisplayedCompletion])
```

The `onVideoProgress` callback is triggered by every `timeupdate` event, and it:
1. Updates position
2. Checks for milestones
3. **Calls `sendProgressSnapshot` on EVERY video progress update!**

### 3. Other Triggers

- `onVideoPause` → calls `sendProgressSnapshot`
- `onVideoSeek` → calls `sendProgressSnapshot`
- `onVideoEnd` → calls `sendProgressSnapshot`

### The Real Problem

The `sendProgressSnapshot` function is being called **way too frequently** - not just by the 2-minute ticker, but by:
- Video `timeupdate` events (4 times per second!)
- Every pause, seek, and milestone

---

## ✅ THE FIX

We need to **rate-limit** the progress API calls. The solution is to ensure `sendProgressSnapshot` only actually sends an API request if enough time has passed since the last call.

### Option 1: Throttle at the Service Level (RECOMMENDED)

**File:** `use-learning-session.ts`

Add a "last sent" timestamp and only send if 30+ seconds have passed:

```typescript
// Add this ref near the top of useLearningSession
const lastProgressSentAtRef = useRef<number>(0)
const MIN_PROGRESS_INTERVAL = 30000 // 30 seconds minimum between API calls

const sendProgressSnapshot = useCallback(async (position: number, completion: number) => {
  if (!sessionIdRef.current || endedRef.current) return

  // THROTTLE: Only send if 30+ seconds since last send (or forced)
  const now = Date.now()
  const timeSinceLastSend = now - lastProgressSentAtRef.current
  if (timeSinceLastSend < MIN_PROGRESS_INTERVAL) {
    // Still update local state, just don't call API
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
    // ... error handling
  }
}, [/* deps */])
```

### Option 2: Separate Throttled vs Immediate Updates

Create two functions:
- `sendProgressSnapshot` - throttled (30s minimum)
- `forceProgressSnapshot` - immediate (for critical events like pause, end)

```typescript
const sendProgressSnapshot = useCallback(async (position: number, completion: number) => {
  // Throttled version - only sends every 30s
  const now = Date.now()
  if (now - lastProgressSentAtRef.current < MIN_PROGRESS_INTERVAL) {
    return // Skip
  }
  await actuallySendProgress(position, completion)
}, [])

const forceProgressSnapshot = useCallback(async (position: number, completion: number) => {
  // Immediate version - always sends
  await actuallySendProgress(position, completion)
}, [])

// Use sendProgressSnapshot for timeupdate events (throttled)
// Use forceProgressSnapshot for pause, seek, end events (immediate)
```

### Option 3: Fix in Video Player (Quick Fix)

**File:** `online-content-viewer-page.tsx`

Simply remove the `onProgress` call from `handleTimeUpdate`:

```typescript
function handleTimeUpdate() {
  if (!videoRef.current) return
  lastKnownTimeRef.current = videoRef.current.currentTime
  // REMOVE THIS LINE:
  // onProgress(videoRef.current.currentTime, videoRef.current.duration)
}
```

**Note:** This is a quick fix but removes real-time progress tracking. Only use this as a temporary solution.

---

## 🎯 RECOMMENDED SOLUTION

**Use Option 1 (Throttle at Service Level)** because:
1. ✅ Minimal code changes
2. ✅ Maintains all functionality
3. ✅ Protects backend from excessive calls
4. ✅ Easy to tune the throttle interval

### Implementation Steps

1. Add `lastProgressSentAtRef` and `MIN_PROGRESS_INTERVAL` to `use-learning-session.ts`
2. Modify `sendProgressSnapshot` to check time since last send
3. Test with video playback
4. Monitor logs to confirm 30s intervals instead of every second

---

## 📊 Expected Behavior After Fix

### Before Fix (Current - BROKEN)
```
[09:00:00] Video starts playing
[09:00:01] PROGRESS_CALLED (1s) ← TOO FREQUENT!
[09:00:02] PROGRESS_CALLED (2s)
[09:00:03] PROGRESS_CALLED (3s)
... 100+ calls per minute ...
```

### After Fix (Expected - CORRECT)
```
[09:00:00] Video starts playing
[09:00:30] PROGRESS_CALLED (30s) ← CORRECT!
[09:01:00] PROGRESS_CALLED (60s)
[09:01:30] PROGRESS_CALLED (90s)
... 2 calls per minute ...
```

---

## ✅ Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| Progress API called every 1-3 seconds | Video `timeupdate` event triggers `sendProgressSnapshot` on every frame | Add 30-second throttle to `sendProgressSnapshot` |
| Session end not called | Possibly related to excessive progress calls or separate issue | Fix progress first, then investigate end session |

**Next Action:** Implement Option 1 (throttle) in `use-learning-session.ts` and test.
