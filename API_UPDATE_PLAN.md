# API Update Plan

## Overview

Update the Kielipankki-donatespeech-app to match the updated API specification (openapi.json). The API now uses localized content fields, state-based rendering (default/start/recording/finish), and discriminator patterns with `kind` field.

## Current State

- **Types**: TypeScript and Rust types have simple structure with `description` string and `options: string[]`
- **Localization**: Only UI strings localized, not API content. Fallback is Finnish ("fi")  
- **Rendering**: Single description field displayed, no state-based content
- **Recording**: `isRecording` boolean already working correctly ✅

## Gaps

1. **Type mismatches** (Critical): Missing `kind`, state objects, localized options, metaTitle
2. **No API content localization** (Critical): No utility to extract localized strings
3. **Wrong fallback language** (High): Currently "fi", should be "nb"
4. **No state rendering** (High): Not using default/start/recording/finish states
5. **Component updates** (Medium): Options, themes, schedules need localization
6. **Missing types** (Low): TextMediaItem, fake-yle variants not supported

## Implementation Steps

### 1. Create Feature Branch ✅
```bash
git checkout -b feature/api-spec-update
```
**Status**: Complete
**Commit**: Initial branch creation

---

### 2. Add Localization Utility
**File**: `src/utils/localization.ts` (new)

**Implementation**:
```typescript
export function getLocalizedText(
  record: Record<string, string> | null | undefined,
  currentLanguage: string,
  fallbackLanguage = "nb"
): string {
  if (!record) return "";
  return record[currentLanguage] 
    || record[fallbackLanguage] 
    || Object.values(record)[0] 
    || "";
}
```

**Status**: 🔲 Not started
**Commit**: 

---

### 3. Update Fallback Language
**File**: `src/contexts/LocalizationContext.tsx`

**Changes**: Change fallback from `"fi"` to `"nb"` in language chain logic

**Status**: 🔲 Not started
**Commit**: 

---

### 4. Update TypeScript Types
**File**: `src/types/Schedule.ts`

**Key changes**:
- Add `kind: "media" | "prompt"` discriminator
- Replace `ScheduleItemState` with `MediaState`: `{title, body1, body2, imageUrl?}`
- Add `default`, `start?`, `recording?`, `finish?` state fields to media items
- Add `metaTitle?: Record<string, string>` to media items
- Change `options: string[]` → `options: Array<Record<string, string>>`
- Add `otherAnswer?`, `otherEntryLabel?` as localized objects
- Add `url` to prompt items
- Create `TextMediaItem`, `FakeYleAudioMediaItem`, `FakeYleVideoMediaItem`
- Add `ScheduleState` for schedule start/finish

**Status**: 🔲 Not started
**Commit**: 

---

### 5. Update Rust Types
**File**: `src-tauri/src/models/schedule.rs`

**Mirror TypeScript changes**:
- Add `kind` field
- Create `MediaState` struct with `HashMap<String, String>` fields
- Add state fields to media variants
- Update `options` to `Vec<HashMap<String, String>>`
- Add new enum variants for text/fake-yle items
- Update serde attributes for discriminators

**Status**: 🔲 Not started
**Commit**: 

---

### 6. Create State Management Hook
**File**: `src/hooks/useItemState.ts` (new)

**Purpose**: Track current state (default/start/recording/finish) and return appropriate MediaState content

**Status**: 🔲 Not started
**Commit**: 

---

### 7. Update SchedulePage.tsx
**File**: `src/pages/SchedulePage.tsx`

**Changes**:
- Import `getLocalizedText` and `useItemState`
- Get current state content from hook
- Display localized `title`, `body1`, `body2` from current state
- Show `imageUrl` if present
- Trigger state transitions when recording starts/finishes
- For prompts, show image from `item.url`

**Status**: 🔲 Not started
**Commit**: 

---

### 8. Update MultiChoiceView.tsx
**File**: `src/components/MultiChoiceView.tsx`

**Changes**:
- Map `item.options` through `getLocalizedText()`
- Handle `otherAnswer`, `otherEntryLabel` as localized objects

**Status**: 🔲 Not started
**Commit**: 

---

### 9. Update SuggestInputView.tsx
**File**: `src/components/SuggestInputView.tsx`

**Changes**:
- Map `item.options` through `getLocalizedText()`
- Handle localized labels

**Status**: 🔲 Not started
**Commit**: 

---

### 10. Add TextContentView Component
**File**: `src/components/TextContentView.tsx` (new)

**Purpose**:
- Fetch content from `item.url`
- Handle text/plain and text/html via `typeId`
- Display state-based localized title/body

**Status**: 🔲 Not started
**Commit**: 

---

### 11. Handle Fake-YLE Items
**Files**: `src/pages/SchedulePage.tsx`, `src/components/`

**Changes**:
- Detect `fake-yle-audio`, `fake-yle-video` types
- Show placeholder/message for unavailable YLE content

**Status**: 🔲 Not started
**Commit**: 

---

### 12. Update ThemesPage.tsx
**File**: `src/pages/ThemesPage.tsx`

**Changes**:
- Use `getLocalizedText()` for theme titles
- Display localized schedule start/finish states

**Status**: 🔲 Not started
**Commit**: 

---

### 13. Update Schedule Start/Finish Pages
**Files**: `src/pages/ScheduleStartPage.tsx`, `src/pages/ScheduleFinishPage.tsx`

**Changes**:
- Use `schedule.start` and `schedule.finish` state objects
- Display localized `title`, `body1`, `body2`, `imageUrl` using `getLocalizedText`

**Status**: 🔲 Not started
**Commit**: 

---

## Verification

### Build Checks
- [ ] TypeScript compilation: `pnpm build`
- [ ] Rust compilation: `cd src-tauri && cargo build`

### Manual Testing
- [ ] Switch app language → verify API content updates
- [ ] Test nb fallback when content missing
- [ ] Test recording flow → verify state transitions
- [ ] Test all item types (audio, video, image, YLE, fake-yle, text, all prompts)
- [ ] Verify localized options in multi-choice
- [ ] Check metaTitle display

### Automated Tests
- [ ] Run existing tests: `pnpm test`

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State support | Full (default/start/recording/finish) | Complete API feature support |
| Item types | All including text/fake-yle | Future-proof implementation |
| Localization | Single `getLocalizedText()` utility | DRY principle, consistent behavior |
| Fallback chain | currentLang → nb → first → empty | User requirement: nb fallback |

---

## Progress Tracking

**Overall Progress**: 1/14 steps complete (7%)

**Branch**: `feature/api-spec-update`

**Last Updated**: 2026-03-04

---

## Notes

- Commit often after each logical change
- Test TypeScript changes before moving to Rust
- Verify deserialization works with test API responses
- Keep types in sync between TypeScript and Rust
