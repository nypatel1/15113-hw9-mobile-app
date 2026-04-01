# App Specification

<!-- Template created with CLAUDE for 15-113-->

## Overview

A mobile study session tracker that lets students log focused study sessions by subject, track elapsed time with a live timer, and review their history across all subjects. The target audience is college students who want a lightweight, no-friction way to stay accountable and see how their time is actually spent.

## Core Features

- Start and stop a live study timer tied to a chosen subject
- Select or type in a subject before beginning a session
- Auto-save each completed session (subject, date, duration) to local storage
- View full history of past sessions grouped or listed by date
- See total time studied per subject and a weekly grand total
- Delete individual sessions via long-press
- Motivational milestone message when a session total crosses 1 hour for the day

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| Student (default) | The sole user of the app on their personal device | Full read/write access to all sessions and subjects; no login required |

## Screens & Navigation

| Screen | Purpose | Navigation |
|--------|---------|------------|
| Timer (index.tsx) | Main screen — select a subject, start/stop the live timer, view current session duration | Default tab; bottom tab navigator |
| History (explore.tsx) | Browse all past sessions, see per-subject totals and weekly summary, delete sessions | Second tab in bottom tab navigator |

## Data Model

### Entities

### StudySession
- id: string (UUID generated at save time)
- subject: string (user-entered or selected from recents)
- startTime: string (ISO 8601 timestamp)
- durationSeconds: number (total elapsed seconds for the session)
- date: string (YYYY-MM-DD, derived from startTime for grouping)

### SubjectList
- subjects: string[] (persisted list of previously used subjects for quick re-selection)


## Offline Behavior

The app is fully offline by design. All data lives in AsyncStorage on the device. No network connectivity is required for any feature. Sessions saved while offline are never synced anywhere — they remain local only.

## Analytics & Monitoring

None. No crash reporting, analytics SDK, or telemetry of any kind for this assignment scope.

## Constraints & Non-Goals

- No user authentication or cloud sync — data is device-local only
- No background timer that continues running when the app is fully closed (system constraint without a background task library)
- No charts or data visualizations in v1 — plain list/summary text only
- No notifications or reminders
- No export or sharing of session data
- Web platform is not a target; styles are optimized for mobile only
- No multi-device support

## Open Questions

- Should the subject picker be a dropdown of recent subjects, a free-text field, or both? (Recommendation: free-text with a "recents" suggestion list below it)
- Should sessions be deletable from the History screen? If so, confirm dialog or just long-press? (Recommendation: long-press with a simple Alert confirm)
- Should a session be discarded if the user stops it under a minimum threshold (e.g., under 10 seconds)? (Recommendation: yes, skip saving sessions under 10s to avoid accidental taps)
