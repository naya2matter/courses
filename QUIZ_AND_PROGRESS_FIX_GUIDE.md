# Quiz Display & Progress API Bug - Fix Guide

## 🐛 Issues Identified

### Issue 1: Progress API Called Too Frequently
- **Problem:** Progress API is called every **1-2 seconds** instead of every **2 minutes**
- **Evidence:** Your logs show `LEARNING_SESSION_PROGRESS_CALLED` every 2-5 seconds
- **Impact:** High server load, database overload, incorrect metrics

### Issue 2: Quiz Not Showing in Online Course Detail Page
- **Problem:** Quiz badge/interface not visible to users even when module has quiz
- **Evidence:** Code exists (line 276-281 in `online-course-detail-page.tsx`) but not rendering
- **Possible Causes:**
  1. Backend not sending `has_quiz: true`
  2. Frontend logic issue
  3. Missing quiz data in API response

---

## 🔍 DIAGNOSTICS - Check These First

### Step 1: Check Browser Console for Data

Open browser DevTools (F12) → Console tab, then run:

```javascript
// Check if course data has quiz info
const courseData = JSON.parse(localStorage.getItem('online-course-detail') || '{}');
console.log('Course modules:', courseData.modules?.map(m => ({
  title: m.title,
  has_quiz: m.has_quiz,
  quiz_status: m.quiz_status
})));
```

Or check the Network tab:
1. Open Network tab
2. Refresh the course detail page
3. Find the API call to `/user/online-courses/getById/{id}`
4. Check the response - look for `has_quiz` fields

### Step 2: Check Backend API Response

Run this SQL to check if modules have quizzes:

```sql
-- Check modules with quizzes
SELECT 
    m.id,
    m.name,
    m.has_quiz,
    q.id as quiz_id,
    q.title as quiz_title
FROM course_online_modules m
LEFT JOIN quizzes q ON q.module_id = m.id
WHERE m.course_online_id = 5  -- Replace with your course ID
ORDER BY m.order_number;
```

---

## 🔧 FIXES

### FIX 1: Progress API Bug (CRITICAL)

**File:** `courses/src/pages/user/online-courses/hooks/use-learning-session.ts`

**Problem:** `sendProgressSnapshot` is called on every video `timeupdate` event (250ms)

**Solution:** Add throttling to only send every 30 seconds minimum

```typescript
// Add near top of useLearningSession function
const lastProgressSentAtRef = useRef<number>(0)
const MIN_PROGRESS_INTERVAL = 30000 // 30 seconds

// Modify sendProgressSnapshot function
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
    return
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
}, [onRealError, persistSessionSnapshot, toMetrics, trackDisplayedCompletion])

// Update callers to use force=true for important events:
// - onVideoPause: force=true
// - onVideoEnd: force=true  
// - onVideoSeek: force=true
// - 2-minute ticker: force=false (default, throttled)
```

---

### FIX 2: Quiz Not Showing

#### Option A: Frontend Fix (if backend sends correct data)

**File:** `courses/src/pages/user/online-courses/online-course-detail-page.tsx`

Add debug logging to see what data is received:

```typescript
// Add inside ModuleAccordion component, near the top:
useEffect(() => {
  console.log('Module data:', {
    title: module.title,
    has_quiz: module.has_quiz,
    quiz_status: module.quiz_status,
  });
}, [module]);
```

If `has_quiz` is `true` but still not showing, check the JSX rendering:

```typescript
// Around line 276-281, verify this condition:
{module.has_quiz && (
  <Badge variant="outline" className="...">
    Quiz
  </Badge>
)}
```

#### Option B: Backend Fix (if not sending quiz data)

**File:** `new-courses/app/Http/Resources/User/OnlineCourse/UserCourseDetailResource.php`

Check that `has_quiz` is correctly populated:

```php
// In the modules map function, verify:
'has_quiz'     => $mod['module']->has_quiz,
```

If the database field is missing or always false, check the migration:

```php
// Should have this in create_course_online_modules_table:
$table->boolean('has_quiz')->default(false);
```

---

## ✅ TESTING CHECKLIST

### Progress API Fix
- [ ] Play video for 1 minute → Only 0-1 progress calls (not 20+)
- [ ] Pause video → Progress call immediately (forced)
- [ ] Resume video → Throttling resumes
- [ ] End video → End session called

### Quiz Display Fix
- [ ] Open course with quiz module
- [ ] Check console log shows `has_quiz: true`
- [ ] Verify "Quiz" badge appears on module
- [ ] Click quiz badge → Opens quiz

---

## 📞 NEED HELP?

If issues persist, gather this info:

1. **Browser Console:** Screenshot of module data log
2. **Network Tab:** Screenshot of `/getById/{id}` response
3. **Database:** Results of quiz check SQL query
4. **Logs:** Last 50 lines of progress API calls
