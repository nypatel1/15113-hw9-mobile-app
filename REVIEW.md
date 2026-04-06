# Code Review — Study Session Tracker

Reviewed against `SPEC.md` on 2026-04-06.

---

## Spec Compliance

### 1. [PASS] Start and stop a live study timer tied to a chosen subject

`app/(tabs)/index.tsx` lines 55–73 (`handleStart`) and 75–111 (`handleStop`) implement start/stop correctly. The timer uses `setInterval` with a `Date.now()` delta against a stored `startTimeRef`, which avoids cumulative drift. Good approach.

### 2. [PASS] Select or type in a subject before beginning a session

`app/(tabs)/index.tsx` lines 157–171 provide a `TextInput` for free text entry. Lines 173–195 render a horizontally scrollable list of recent-subject chips that set the input on tap. This matches the spec's recommendation of "free-text with a recents suggestion list below it."

### 3. [PASS] Auto-save each completed session to local storage

`handleStop` (line 99) calls `addSession(session)` which persists to AsyncStorage via `utils/storage.ts` line 23. The `StudySession` object contains all required fields.

### 4. [PASS] View full history of past sessions grouped by date

`app/(tabs)/explore.tsx` lines 60–72 build a `dateMap` and convert it to `SectionList` sections. Section headers display formatted date labels ("Today", "Yesterday", or a short date).

### 5. [FAIL] Per-subject totals should reflect the weekly window, not all-time

`app/(tabs)/explore.tsx` lines 74–81 compute per-subject totals across **all** sessions, but display them inside a card titled "Weekly Summary (Last 7 Days)" (line 103). The `weeklyTotal` correctly filters via `isWithinLastSevenDays`, but `subjectTotals` does not. A user with months of data will see inflated per-subject numbers that contradict the "Last 7 Days" heading.

**Fix:** Filter the `subjectTotals` accumulation with the same `isWithinLastSevenDays` check, or move the per-subject breakdown out of the weekly summary card.

### 6. [PASS] Delete individual sessions via long-press with confirmation

`app/(tabs)/explore.tsx` lines 42–58 implement `handleLongPress` with an `Alert.alert` confirmation dialog containing Cancel and a destructive Delete button. Matches the spec recommendation exactly.

### 7. [WARN] Milestone message triggers on every qualifying stop, not just when "crossing" 1 hour

The spec says the message should appear "when a session total crosses 1 hour for the day." The implementation in `app/(tabs)/index.tsx` lines 113–126 fires the message whenever `todayTotal >= 3600` after any session save. This means once a user is past 1 hour, the message reappears after every subsequent session — not only the first time the threshold is crossed. Functionally harmless but does not match the spec's wording.

**Fix:** Before saving, snapshot the pre-save total; after saving, check if the total went from below to at-or-above the threshold.

### 8. [PASS] Data model matches spec

`utils/storage.ts` lines 6–12 define `StudySession` with exactly the fields the spec requires: `id`, `subject`, `startTime`, `durationSeconds`, `date`. The `SubjectList` (persisted string array) is managed by `getSubjects`/`addSubject`.

### 9. [PASS] Fully offline, AsyncStorage-only

No network calls anywhere in the codebase. All persistence goes through `@react-native-async-storage/async-storage`.

### 10. [PASS] Two-tab bottom navigation (Timer / History)

`app/(tabs)/_layout.tsx` defines a `Tabs` navigator with "Timer" (index) and "History" (explore) tabs, matching the spec's screen table.

### 11. [PASS] Sessions under 10 seconds are discarded

`app/(tabs)/index.tsx` lines 84–88 check `duration < MIN_SESSION_SECONDS` (10) and show an alert explaining the discard. Matches the spec's recommendation.

### 12. [PASS] Subject picker: free-text with recent suggestions

See finding #2 above. Both input modes are present and work together.

### 13. [PASS] No auth, no cloud sync, no analytics

The app contains no login flow, no network requests, and no analytics or telemetry SDKs — all consistent with the spec's constraints.

---

## Bugs

### 14. [FAIL] `getTodayDate()` returns UTC date, not the user's local date

`utils/helpers.ts` line 16: `new Date().toISOString().split('T')[0]` produces a UTC date string. A student studying at 11 PM in US Eastern time will have their session stamped with tomorrow's UTC date. This causes sessions to appear under the wrong date group in History and can make the milestone check compare against the wrong day.

**Fix:** Use local date components instead:

```typescript
export function getTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 15. [FAIL] Dark-mode hex alpha produces invalid color strings

`app/(tabs)/index.tsx` lines 139 and 198 append alpha suffixes to `colors.tint` (e.g., `colors.tint + '10'`). In dark mode, `tintColorDark` is `'#fff'` (`constants/theme.ts` line 9), so the result is `'#fff10'` — not a valid 8-digit hex color. React Native may silently ignore it or render incorrectly.

**Fix:** Either normalize the tint to a full 6-digit hex (`#ffffff`) or use an `rgba()` helper to apply alpha.

### 16. [WARN] Summary card border doesn't adapt to dark mode

`app/(tabs)/explore.tsx` line 198: `borderColor: '#e0e0e0'` is hardcoded light-gray. In dark mode this creates a visible bright outline that clashes with the dark background.

**Fix:** Conditionally set the border color, e.g., `borderColor: colorScheme === 'dark' ? '#333' : '#e0e0e0'`.

---

## Missing Error Handling

### 17. [WARN] `getSessions` / `getSubjects` don't guard against corrupt JSON

`utils/storage.ts` lines 15–16 and 35–36 call `JSON.parse(data)` on raw AsyncStorage values without a try/catch. If storage is corrupted (truncated write, device crash), the app will throw an unhandled error and likely white-screen.

**Fix:** Wrap each `JSON.parse` in a try/catch that returns the default (empty array) on failure.

### 18. [WARN] `deleteSession` callback has no error handling

`app/(tabs)/explore.tsx` lines 51–53: the `onPress` for the destructive "Delete" button awaits `deleteSession` and `loadSessions` with no try/catch. A storage error here will surface as an unhandled promise rejection.

### 19. [WARN] `loadSessions` in History screen has no error handling

`app/(tabs)/explore.tsx` line 26: `getSessions()` is awaited without a try/catch. If storage read fails, the error is unhandled.

---

## Code Quality

### 20. [WARN] `generateId` is not a UUID

The spec says the id should be a "UUID generated at save time." `utils/helpers.ts` line 2 generates `Date.now().toString(36) + Math.random()...`, which is unique in practice but not a UUID. Consider using `crypto.randomUUID()` (available in Hermes on modern RN) or the `uuid` package for spec compliance.

### 21. [WARN] `Fonts` constant is defined but never used

`constants/theme.ts` lines 30–53 export a `Fonts` object that is not imported anywhere in the codebase. This is dead code.

### 22. [WARN] No `+not-found` route defined

The project deleted `modal.tsx` and has no `+not-found.tsx` catch-all route. If a deep link or invalid route is navigated to, expo-router will show its default error screen instead of a graceful fallback.

### 23. [WARN] Section list order depends on storage insertion order, not an explicit date sort

`app/(tabs)/explore.tsx` lines 60–72 build sections by iterating sessions in array order. This works because `addSession` uses `unshift` (newest first), but it's an implicit contract. If any code path ever changes insertion order, sections will silently display in the wrong order.

**Fix:** Sort the `dateMap` keys descending before building sections.

### 24. [WARN] No accessibility labels on interactive elements

Neither the Start/Stop `Pressable` in `index.tsx` (line 242) nor the session-row `Pressable` in `explore.tsx` (line 142) have `accessibilityLabel` or `accessibilityRole` props. Screen reader users will have a poor experience.

### 25. [WARN] Duplicate subject-list logic in Timer screen and storage layer

`app/(tabs)/index.tsx` line 102–104 manually reorders the local `recentSubjects` state to move the used subject to the front, duplicating the same MRU logic already in `addSubject` (`utils/storage.ts` lines 39–43). The local state update is an optimization, but the duplicated logic is a maintenance risk.

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 10    |
| FAIL    | 3     |
| WARN    | 12    |

**Critical issues to fix before shipping:**

1. **#5** — Per-subject totals are all-time but displayed as weekly.
2. **#14** — UTC date stamping causes wrong date grouping for non-UTC users.
3. **#15** — Invalid hex color strings in dark mode from shorthand `#fff` + alpha suffix.
