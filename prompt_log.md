# Prompt Log — Study Session Tracker

## AI Tools Used

- **Cursor IDE** (Agent mode) with Claude as the underlying model
- Three separate Cursor Agent chat sessions across three phases: build, review, fix

---

## Phase 1: Build

### Prompt 1 — Initial build

- I have an Expo/React Native project scaffolded with the default starter template. Build out a fully functional study session tracker app based on the spec defined in SPEC.md. The app needs two tabs, a Timer screen for starting and stopping study sessions tied to a subject, and a History screen that shows past sessions grouped by date with per-subject totals. Use AsyncStorage for all persistence, no backend. Follow the data model, acceptance criteria, and open-question recommendations in the spec.

The agent scaffolded the entire app from the starter template in one pass.

### Prompt 2 — UI layout fix

- The subject input field is overlapping the timer display and pushing it off the visible screen area. Restructure the Timer screen layout so the timer is the dominant, vertically centered element on screen.

The agent replaced the ScrollView with a 3-zone flex layout.

### Prompt 3 — Timer text clipping

- The timer digits are barely visible, I can only see a thin horizontal sliver of the numbers instead of the full text. Diagnose why the large font-size timer text is being clipped, fix the root cause, and while you're in there redesign the timer display to be something like a centered circular ring with the time inside it.


### Prompt 4 — Data persistence debugging

- Study sessions are not being saved. When I stop a timer and switch to the History tab, nothing appears. When I restart the app, all data is gone.

**Manual note:** It was a a dependency version mismatch — `npm install` pulled AsyncStorage v3 because `npx expo install` had failed on a network error.

### Prompt 5 — Explain React Native app architecture

- I'm brand new to React Native and Expo. Can you explain at a high level how all these files work together to create a running app? Specifically walk me through: how does expo-router use the file/folder structure inside app/ to create navigation? What do the _layout.tsx files do versus the screen files? Also trace the full data flow when I press "Stop Session", how does the session object get created, persisted to AsyncStorage, and then show up on the History tab?

Helped me understand expo-router's file-based routing, the React component lifecycle, and the storage data flow.

### Prompt 6 — React Native vs web development

- What's the difference between building a React Native app and building a regular React website? Also explain why React Native apps feel more "native" than a website wrapped in a WebView.

Clarified the mental model shift from web to native while showing that the React programming model itself is identical.

### Prompt 7 — UI polish and consistency pass

- Do a full UI polish pass on both screens. Choose a consistent 2-3 color palette that works in both light and dark mode. Make sure all text is readable, add clear screen titles with contextual subtitles. Make the start/stop button feel tappable with a drop shadow and press animation.


---

## Phase 2: Review

A separate Cursor Agent chat was used to simulate an independent reviewer.

### Prompt 8 — Code review against spec

> Review the React Native/Expo code in this project against the spec in SPEC.md. 
For each acceptance criterion in the spec, verify whether the code actually implements it correctly. 
Also check for:
- Bugs or logic errors
- Missing error handling
- Code quality issues (unclear naming, repeated code, etc.)
- Best practices for React Native or other technologies

Format your review as a numbered list of findings, each marked as [PASS], [FAIL], or [WARN]. 
Be specific. Reference file names and line numbers. 

Produced 25 findings: 10 PASS, 3 FAIL, 12 WARN.

### Prompt 9 — Explain useState and SafeAreaView

- I see useState and SafeAreaView used throughout the codebase. What exactly does useState do, why can't I just use a normal variable to track values in a component? And why do I need SafeAreaView wrapping each screen?

Learned that useState gives components persistent memory across re-renders, and SafeAreaView insets content away from hardware obstructions.

---

## Phase 3: Fix

### Prompt 10 — Fix review findings

- Go through the REVIEW.md file in the repository. Read every finding. Fix all items flagged as [FAIL] and any [WARN] items that are critical, specifically missing error handling, data correctness bugs, and dark mode rendering issues. 

Fixed 3 FAIL and 5 critical WARN items across 4 files.

---

## Manual Interventions

1. **AsyncStorage version** — Flagged the "not storing data" symptom after testing on device. The agent diagnosed it as AsyncStorage v3 (pulled by `npm install` fallback) being incompatible with Expo SDK 54 and downgraded to v2.2.0.

2. **UI iteration** — Two rounds of visual feedback were needed. The initial generated layout had the input covering the timer, and the timer text was clipped to a sliver due to a lineHeight conflict in ThemedText.

