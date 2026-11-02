# Project memory

## Product intent & audience

- Calendar-based announcement/notice application built with Next.js
- Mobile-first experience; users browse announcements by selecting dates on a calendar
- Supports per-date notice lists with favorites/bookmarking and close actions

## Brand personality & voice

- Korean-language UI and user-facing copy
- Tone is direct and task-oriented; concise explanations over verbose descriptions
- User delegates visual/UX decisions to the assistant within requested constraints

## Visual design & UX direction

- **Mobile calendar UX**: selected date's notices appear inline directly below the calendar card — not as a bottom-up modal/drawer
- Inline detail panel preserves existing features: notice list, close button, favorites/bookmark
- Single-page flow on mobile: calendar → selected date notices expand below in natural document order with smooth transitions
- Avoid bottom-sheet / slide-up drawer patterns on mobile calendar detail views

## Decisions, constraints & rationale

- **Drawer removal**: removed the previous mobile bottom Drawer component for date detail; replaced with inline expansion to reduce friction and avoid modal interruption
- **Rationale**: inline flow is more natural for mobile; keeps context visible (calendar remains alongside notices)
- Build pipeline includes type-checking as a gate — unused/legacy JSX (e.g. removed Drawer references) must be fully cleaned up or build stops at type-check stage
- User grants freedom for design refinements within the scope of explicit requests

## Open questions & assumptions

- Desktop/tablet layout for calendar detail not yet discussed — assumed separate pattern or responsive adaptation, details TBD
- Transition animation specifics (duration, easing) for inline expansion not specified
- No `.bolt/prompt` exists yet — all current context is inferred from this interaction; revisit when explicit prompt instructions are added