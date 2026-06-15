# Progress Ticker Fix Analysis

## Problem Statement

**Current Issue:** The progress ticker (2-minute interval) continues to send progress updates to the backend **even when the video is paused** by the user. This causes unnecessary API calls and incorrect "active playback time" tracking.

---

## Current Implementation Analysis

### Current Code Flow (PROBLEMATIC)

```typescript
// Current startProgressTicker (lines 317-324 in use-learning-session.ts)
const startProgressTicker = useCallback(() => {
  if (progressTickerRef.current != null) return
  progressTickerRef.current = window.setInterval(() => {
    void sendProgressSnapshot(latestPositionRef.current, latestCompletionRef.current)
  }, 120000)  // 2 minutes
}, [])
```

**Problem:** This ticker starts when playback begins (`startPlaybackClock`) and NEVER checks if the video is still playing. It continues firing every 2 minutes regardless of pause state.

### Current State Management

| Ref/State | Purpose | When Updated |
|-----------|---------|--------------|
| `playingRef` | Tracks if video is actively playing | `true` on play, `false` on pause |
| `playStartedAtRef` | Timestamp when current play segment started | Set to `Date.now()` on play |
| `progressTickerRef` | Interval ID for the 2-minute ticker | Set in `startProgressTicker` |
| `sessionIdRef` | Current session ID from backend | Set when session starts |

---

## The AI-Suggested Fix

### Proposed Changes

The AI suggests adding guards to the ticker callback:

```typescript
const startProgressTicker = useCallback(() => {
  if (progressTickerRef.current != null) return

  progressTickerRef.current = window.setInterval(() => {
    // NEW GUARD CONDITIONS:
    if (
      latestContentTypeRef.current !== "video" ||  // Not video content
      !playingRef.current ||                         // Video is paused
      document.visibilityState !== "visible" ||      // Tab is hidden
      !sessionIdRef.current ||                       // No active session
      endedRef.current                               // Session ended
    ) {
      return  // Skip this tick - don't send progress
    }

    void sendProgressSnapshot(
      latestPositionRef.current,
      latestCompletionRef.current,
    )
  }, 120000)
}, [sendProgressSnapshot])
```

### Additional Changes to `handleVisibility`

```typescript
const handleVisibility = useCallback(() => {
  if (!sessionIdRef.current || endedRef.current) return

  if (document.visibilityState === "hidden") {
    addPlaybackSlice()
    stopProgressTicker()  // STOP ticker when tab hidden
    pushEvent({ type: "visibility_hidden", at: latestPositionRef.current })
  } else {
    pushEvent({ type: "visibility_visible", at: latestPositionRef.current })

    // RESTART ticker when tab visible AND video playing
    if (latestContentTypeRef.current === "video" && playingRef.current) {
      playStartedAtRef.current = Date.now()
      startProgressTicker()
    }
  }

  // ... rest of function
}, [addPlaybackSlice, pushEvent, sendProgressSnapshot, startProgressTicker, stopProgressTicker])
```

---

## My Analysis: Is This the Best Solution?

### ✅ PROS of the AI Solution

1. **Fixes the Core Problem**: Prevents progress API calls when video is paused
2. **Handles Tab Visibility**: Stops tracking when user switches tabs
3. **Backward Compatible**: Doesn't change the function signatures
4. **Session-Safe**: Checks for active session before sending

### ⚠️ CONS / Considerations

1. **Ticker Still Runs**: The interval keeps firing every 2 minutes, it just skips the API call. A more efficient approach might be to `clearInterval` on pause and restart on play.

2. **Edge Case - Pause at Exact 2-Min Mark**: If user pauses right when ticker fires, there's a race condition. The guard check helps but isn't perfect.

3. **PDF Content Not Covered**: The AI fix focuses on video. PDF progress tracking still works through different mechanisms (page change events).

---

## My Recommended Solution (Improved)

I suggest a **hybrid approach** that combines the AI's guards with more efficient interval management:

```typescript
// RECOMMENDED: More efficient ticker management

const startProgressTicker = useCallback(() => {
  // Guard: Only start for video content
  if (latestContentTypeRef.current !== "video") return
  // Guard: Only start if currently playing
  if (!playingRef.current) return
  // Guard: Don't start if already running
  if (progressTickerRef.current != null) return

  progressTickerRef.current = window.setInterval(() => {
    // Final guards before sending
    if (
      !playingRef.current ||
      document.visibilityState !== "visible" ||
      !sessionIdRef.current ||
      endedRef.current
    ) {
      return
    }

    void sendProgressSnapshot(
      latestPositionRef.current,
      latestCompletionRef.current,
    )
  }, 120000)
}, [sendProgressSnapshot])

// IMPROVED: stopPlaybackClock should clear the ticker
const stopPlaybackClock = useCallback(() => {
  addPlaybackSlice()
  playingRef.current = false
  playStartedAtRef.current = null
  stopProgressTicker() // This clears the interval
}, [addPlaybackSlice, stopProgressTicker])
```

### Key Differences from AI Solution:

| Aspect | AI Solution | My Recommendation |
|--------|-------------|-------------------|
| Ticker on pause | Keeps running, skips API | Stops completely (clearInterval) |
| Restart on play | Needs explicit restart | Naturally restarts via startPlaybackClock |
| Resource usage | Interval always firing | Interval only when playing |
| Complexity | Simpler guards | More state management |

---

## Conclusion

### Is the AI Solution Good?

**Yes**, the AI solution **will fix the problem** and is safe to implement. It's a valid approach that adds necessary guards to prevent progress API calls when the video is paused.

### My Recommendation

If you want a **quick, safe fix** → Use the **AI solution**.

If you want a **more efficient, cleaner solution** → Use **my hybrid approach** that stops the ticker entirely on pause instead of letting it fire every 2 minutes.

### Important Note

Whichever solution you choose, you should also update `handleVisibility` to stop the ticker when the tab is hidden (as shown in the AI's second code block). This prevents unnecessary API calls when the user switches to another tab.
