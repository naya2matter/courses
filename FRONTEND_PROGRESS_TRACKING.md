# Frontend Progress Tracking System Documentation

## Overview

This document explains how the online course platform tracks user progress in real-time. The system is designed to capture accurate learning metrics while the user watches videos or reads PDF documents.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Components](#key-components)
3. [Progress Update Mechanism](#progress-update-mechanism)
4. [Data Flow Diagram](#data-flow-diagram)
5. [Important Time Intervals](#important-time-intervals)
6. [Session Management](#session-management)
7. [File Structure](#file-structure)

---

## Architecture Overview

The progress tracking system uses a **Learning Session** pattern where each content view starts a new session. The session tracks:

- **Playback position** (seconds for video, page number for PDF)
- **Completion percentage** (0-100%)
- **Active playback time** (time actually watching/reading)
- **User interactions** (pauses, seeks, speed changes, etc.)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Video Player │  │ PDF Viewer   │  │ Progress State   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API SERVER (Laravel)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Sessions     │  │ Progress     │  │ Analytics        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Learning Session Hook (`use-learning-session.ts`)

**Location:** [`src/pages/user/online-courses/hooks/use-learning-session.ts`](src/pages/user/online-courses/hooks/use-learning-session.ts)

This is the core of the progress tracking system. It manages:
- Session lifecycle (start, update, end)
- Real-time progress calculation
- Event tracking (play, pause, seek, etc.)
- Session persistence (localStorage backup)

Key features:
```typescript
// Progress ticker - sends progress every 2 minutes (120 seconds)
const startProgressTicker = useCallback(() => {
  if (progressTickerRef.current != null) return
  progressTickerRef.current = window.setInterval(() => {
    void sendProgressSnapshot(latestPositionRef.current, latestCompletionRef.current)
  }, 120000) // 2 minutes
}, [])
```

### 2. Content Viewer Page

**Location:** [`src/pages/user/online-courses/online-content-viewer-page.tsx`](src/pages/user/online-courses/online-content-viewer-page.tsx)

This page displays the video player or PDF viewer and connects the UI events to the learning session hook.

**Video Player Component:**
- Handles video events: play, pause, seek, timeupdate, ended
- Syncs with learning session on every significant event

**PDF Viewer Component:**
- Tracks page changes
- Calculates completion based on unique pages viewed

### 3. Service Layer

**Location:** [`src/services/userOnlineCourse.service.ts`](src/services/userOnlineCourse.service.ts)

Handles all API communication:
- `startLearningSession()` - Creates a new learning session
- `sendSessionProgress()` - Sends periodic progress updates
- `endLearningSession()` - Finalizes the session
- `updatePdfProgress()` - Specific endpoint for PDF progress

### 4. Types Definitions

**Location:** [`src/types/user-online-course.ts`](src/types/user-online-course.ts)

Defines all TypeScript interfaces:
- `SessionMetrics` - Core metrics (position, completion, playback time)
- `LearningSessionEvent` - User interaction events
- `SessionStart/Progress/End Payloads` - API request types

---

## Progress Update Mechanism

### When Does Progress Update?

The progress tracking system updates in several scenarios:

#### 1. **Periodic Auto-Save (Every 2 minutes)**
```typescript
// From use-learning-session.ts line 319
progressTickerRef.current = window.setInterval(() => {
  void sendProgressSnapshot(latestPositionRef.current, latestCompletionRef.current)
}, 120000) // 120 seconds = 2 minutes
```

This ensures that even if the user watches a 30-minute video without pausing, progress is saved every 2 minutes.

#### 2. **On User Interactions**
- **Video Play/Pause** - Updates immediately when user pauses
- **Video Seek** - Updates after seeking to new position
- **Video End** - Final update when video completes
- **PDF Page Change** - Updates when user navigates pages

#### 3. **On Milestone Events**
```typescript
// From use-learning-session.ts
const MILESTONES = [25, 50, 75, 95] as const

// When completion crosses a milestone (e.g., 25%, 50%)
for (const milestone of MILESTONES) {
  if (computed >= milestone && !milestonesRef.current.has(milestone)) {
    milestonesRef.current.add(milestone)
    pushEvent({ type: "milestone", at: position, pct: milestone })
    void sendProgressSnapshot(position, latestCompletionRef.current)
  }
}
```

#### 4. **On Page Visibility Change**
When user switches tabs or minimizes browser:
```typescript
const handleVisibility = useCallback(() => {
  if (document.visibilityState === "hidden") {
    addPlaybackSlice()
    pushEvent({ type: "visibility_hidden", at: latestPositionRef.current })
  }
  // Send progress update
  void sendProgressSnapshot(position, latestCompletionRef.current)
}, [])
```

#### 5. **On Page Close/Navigation**
When user closes the tab or navigates away:
```typescript
const handlePageHide = useCallback(() => {
  if (latestContentTypeRef.current === "video") {
    void flushProgressSnapshot({ useKeepAlive: true })
  } else {
    void endSession({ useKeepAlive: true, reason: "pagehide" })
  }
}, [])
```
Uses `keepalive: true` to ensure the request completes even after page close.

### What Data is Sent?

Each progress update sends a `SessionMetrics` object:

```typescript
interface SessionMetrics {
  active_playback_time: number    // Seconds actually watching (excludes pauses)
  playback_position: number        // Current position (seconds for video, page for PDF)
  completion_percentage: number    // 0-100
  skip_count: number              // Number of forward skips > 10 seconds
  seek_count: number              // Total seek operations
  replay_count: number            // Seeks backward
  pause_count: number             // Number of pauses
  speed_changes: number           // Playback rate changes
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION                              │
│  (Play, Pause, Seek, Page Change, Tab Switch, Close)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    use-learning-session Hook                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Event Log  │  │ Metrics    │  │ Ticker     │  │ Snapshot   │    │
│  │ (50 max)   │  │ (refs)     │  │ (2 min)    │  │ (sessionSt)│    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ Immediate │   │ Periodic │   │ Final    │
            │ Updates   │   │ (2 min)  │   │ (Close)  │
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  └───────────────┼───────────────┘
                                  ▼
            ┌─────────────────────────────────────┐
            │   userOnlineCourse.service.ts       │
            │   API Layer                         │
            │                                     │
            │   • startLearningSession()          │
            │   • sendSessionProgress()           │
            │   • endLearningSession()            │
            │   • updatePdfProgress()             │
            └───────────────────┬─────────────────┘
                                │
                                ▼
            ┌─────────────────────────────────────┐
            │        LARAVEL BACKEND             │
            │                                     │
            │   • learning_sessions table        │
            │   • content_progress table         │
            │   • Course progress calculation    │
            │   • Analytics & Reporting          │
            └─────────────────────────────────────┘
```

---

## Important Time Intervals

| Interval | Purpose | File |
|----------|---------|------|
| **2 minutes (120,000ms)** | Auto-save progress snapshot | `use-learning-session.ts:319` |
| **Real-time** | Event tracking (play, pause, seek, etc.) | `use-learning-session.ts` |
| **Milestones (25%, 50%, 75%, 95%)** | Triggered progress save at completion milestones | `use-learning-session.ts` |
| **On visibility change** | Immediate save when tab is hidden | `use-learning-session.ts` |
| **On page close** | Best-effort save with `keepalive` | `use-learning-session.ts` |

---

## Session Management

### Session Lifecycle

1. **Session Start**
   - Triggered when user clicks play (video) or opens PDF
   - API: `POST /user/online-courses/sessions/start`
   - Returns: `session_id`, `resume_position`, `is_completed`

2. **Active Session**
   - Tracks all user interactions
   - Sends progress every 2 minutes
   - Persists snapshot to sessionStorage (for crash recovery)

3. **Session End**
   - Triggered by: video end, page close, manual navigation
   - API: `POST /user/online-courses/sessions/{id}/end`
   - Calculates final metrics and completion status

### Session Persistence

The system uses `sessionStorage` to persist session state. This enables:
- Crash recovery (browser crash, power failure)
- Page refresh recovery
- Tab switch recovery

```typescript
// Snapshot is saved after every significant event
writePersistedSnapshot(courseId, contentId, {
  version: 1,
  sessionId: sessionIdRef.current,
  startedAt: startedAtRef.current,
  latestPosition: latestPositionRef.current,
  latestCompletion: latestCompletionRef.current,
  metrics: metricsRef.current,
  events: eventsRef.current,
  // ... more fields
})
```

---

## File Structure

```
courses/src/
├── pages/user/online-courses/
│   ├── hooks/
│   │   └── use-learning-session.ts    # Core progress tracking hook
│   ├── online-content-viewer-page.tsx  # Video/PDF viewer with progress
│   ├── online-course-detail-page.tsx   # Course overview with progress bars
│   └── online-courses-page.tsx         # Course listing with progress
│
├── services/
│   └── userOnlineCourse.service.ts     # API calls for progress tracking
│
├── types/
│   └── user-online-course.ts           # TypeScript interfaces
│
└── components/ui/
    └── progress.tsx                    # Progress bar UI component
```

---

## Summary

The frontend progress tracking system works as follows:

1. **Every 2 minutes**, the system automatically sends a progress snapshot to the backend
2. **On every user interaction** (play, pause, seek, page change), progress is updated immediately
3. **At milestone achievements** (25%, 50%, 75%, 95% completion), an extra progress save is triggered
4. **When the user leaves the page**, a best-effort save is attempted using `keepalive`
5. **During active playback**, a "progress ticker" runs every 2 minutes to auto-save

The system is designed to be robust against:
- Browser crashes (via sessionStorage backup)
- Network failures (fire-and-forget progress updates)
- Page closes (keepalive requests)
- Tab switching (visibilitychange events)
