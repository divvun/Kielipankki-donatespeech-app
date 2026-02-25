# Plan: Replace .NET MAUI Implementation with Tauri

**Status:** Planning Phase  
**Created:** 2026-02-25  
**Last Updated:** 2026-02-25  
**Deployment:** New app with different name/organization (no user migration
needed)

## Development Notes

**Working Directories:**

- **Git operations** (add, commit, status): Always run from repo root
  `/Users/bga001/repos/divvun/Kielipankki-donatespeech-app`
- **pnpm operations** (build, dev, install): Run from `tauri-app/` subdirectory

**Package Manager:** Use `pnpm` for all npm operations in the `tauri-app/`
directory.

**Git Commit Policy:** Commit after completing each bullet point in the
migration plan. Use descriptive commit messages following conventional commits
format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation updates
- `refactor:` for code refactoring
- `test:` for adding tests

```bash
# pnpm operations - run from tauri-app/ directory:
cd tauri-app

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Run Tauri in development mode
pnpm tauri dev

# Build Tauri app
pnpm tauri build

# Git operations - ALWAYS run from repo root:
cd /Users/bga001/repos/divvun/Kielipankki-donatespeech-app

# Check status
git status

# Add and commit changes
git add <files>
git commit -m "message"
```

## Executive Summary

**TL;DR:** Development requires 3 phases: (1) Feature parity - implement 4
missing UI components and analytics, (2) Quality assurance - extensive platform
testing and optimization, (3) Deployment as new app

## Migration Phases

### Phase 1: Feature Parity

#### 1.1 Implement Missing User Input Components

- [x] Create `MultiChoiceView.tsx` matching
  `Recorder.Maui/Views/MultiChoiceUserEntryView.xaml` functionality
- [x] Create `SuggestInputView.tsx` matching
  `Recorder.Maui/Views/SuggestUserEntryView.xaml`
- [x] Integrate both components into `tauri-app/src/pages/SchedulePage.tsx`
  schedule item rendering
- [x] Test with all schedule item types from backend API

**Files to modify:**

- `tauri-app/src/components/MultiChoiceView.tsx` (new)
- `tauri-app/src/components/SuggestInputView.tsx` (new)
- `tauri-app/src/pages/SchedulePage.tsx`

#### 1.2 Add Separate Flow Pages

- [x] Create `ScheduleStartPage.tsx` - intro screen before schedule begins
- [x] Create `ScheduleFinishPage.tsx` - completion summary and stats
- [x] Update `App.tsx` routes to include new pages
- [x] Update `SchedulePage.tsx` navigation to route through start/finish pages

**Files to modify:**

- `tauri-app/src/pages/ScheduleStartPage.tsx` (new)
- `tauri-app/src/pages/ScheduleFinishPage.tsx` (new)
- `tauri-app/src/App.tsx`
- `tauri-app/src/pages/SchedulePage.tsx`

#### 1.3 Implement Analytics

**Decision needed:** Choose analytics provider

- [ ] Option A: Firebase Analytics (matches .NET MAUI) - recommended for
  continuity
- [ ] Option B: Alternative analytics (PostHog, Plausible, etc.)

**Tasks:**

- [ ] Add analytics library/plugin
- [ ] Mirror event tracking from
  `Recorder.Maui/IFirebaseAnalyticsEventTracker.cs`
- [ ] Track: screen views, recording starts/stops, upload success/failures,
  errors

**Files to create/modify:**

- `tauri-app/src/utils/analytics.ts` (new)
- Update all page components with tracking

#### 1.4 Add Recording Features

- [x] Implement keep-screen-on during recording using Wake Lock API
- [x] Add max recording time enforcement (10 minutes) to
  `tauri-app/src/hooks/useRecording.ts`
- [x] Add warning/alert when approaching max duration (at 9 minutes)
- [ ] Test on both Android and iOS with screen timeout settings

**Files modified:**

- `tauri-app/src/hooks/useRecording.ts`
- `tauri-app/src/pages/SchedulePage.tsx`
- `tauri-app/src/locales/*.ftl` (added RecordingApproachingLimitMessage)

#### 1.5 Localization Alignment

**Decision:** Keep Tauri languages - all 9 languages match .NET MAUI coverage ✓

**Supported Languages:**

- Finnish (fi), Swedish (sv)
- Norwegian Bokmål (nb), Norwegian Nynorsk (nn)
- Northern Sámi (se), Southern Sámi (sma), Lule Sámi (smj), Inari Sámi (smn),
  Skolt Sámi (sms)

**Tasks:**

- [x] Review language coverage comparison
- [x] Verify all UI strings are translated in `tauri-app/src/locales/`
- [x] Use localized language names in language selector
- [ ] Test language switching on all platforms (deferred to Phase 2)

**Files modified:**

- `tauri-app/src/components/LanguageSelector.tsx` - Now uses localized language
  names
- `tauri-app/src/contexts/LocalizationContext.tsx` - Removed hardcoded English
  names
- `tauri-app/LOCALIZATION_COVERAGE.md` (new) - Comprehensive coverage report

**Key Findings:**

- All 100 .NET MAUI translation keys present in Tauri ✓
- Tauri has 2 additional keys (RecordingApproachingLimitMessage,
  ThemesPageBody2Text)
- All 9 language files synchronized with 102 keys each ✓

### Phase 2: Quality Assurance

#### 2.1 Audio Quality Validation

- [ ] Record test samples on all platforms (Android, iOS, macOS, Windows)
- [ ] Verify duration accuracy matches recording time
- [ ] Test with different audio levels (quiet, normal, loud)
- [ ] Validate upload size and compression ratios
- [ x ] **Critical:** Ensure M4A→upload pipeline works with backend API

#### 2.2 Platform-Specific Testing

**Android Testing:**

- [ ] Test on physical devices (min API 21, various manufacturers)
- [ ] Verify microphone permissions flow
- [ ] Test background app behavior during recording
- [ ] Test upload resume after network changes
- [ ] Verify battery optimization settings don't break functionality

**iOS Testing:**

- [ ] Test on physical devices (iOS 15+)
- [ ] Verify microphone permissions
- [ ] Test background app limitations
- [ ] Test upload behavior when app suspended

**Desktop Testing:**

- [ ] Test macOS, Windows, Linux
- [ ] Verify audio device selection
- [ ] Test multi-monitor scenarios
- [ ] Test system sleep during recording

#### 2.3 Performance Optimization

- [ ] Profile app startup time
- [ ] Optimize bundle size (`tauri.conf.json` tree-shaking)
- [ ] Test upload reliability with poor network conditions
- [ ] Verify auto-upload (`useAutoUpload.ts`) doesn't drain battery
- [ ] Benchmark memory usage during long recording sessions

#### 2.4 Error Handling Enhancement

- [ ] Add comprehensive error boundaries to React app
- [ ] Improve error messages in `tauri-app/src-tauri/src/recording/mod.rs`
- [ ] Add Sentry or error reporting service
- [ ] Test error scenarios: disk full, network failures, invalid audio,
  corrupted database

### Phase 3: Deployment

#### 3.1 Build System Setup

- [x] **Implement build configuration system** - Replace hardcoded API URL with
  environment-based configuration
  - ✓ Uses Tauri build profiles: `tauri.conf.json` (dev) and
    `tauri.conf.release.json` (production)
  - ✓ Development: `http://localhost:8000`
  - ✓ Production: Azure dev endpoint
  - ✓ Configured in `plugins.recorder.apiBaseUrl`
  - ✓ Android localhost remapping preserved in API client
  - ✓ Build scripts added to package.json: `tauri:dev`, `tauri:build`,
    `tauri:android:dev`, `tauri:android:build`
- [ ] Configure Android build in `tauri-app/src-tauri/android/build.gradle`
- [ ] Set up iOS build in Xcode project
- [ ] Configure signing certificates for iOS and Android
- [ ] Test release builds on all platforms
- [ ] Document build process in repository

#### 3.2 CI/CD Pipeline

- [ ] Create GitHub Actions workflow for automated builds
- [ ] Set up platform-specific build jobs (Android, iOS, macOS, Windows)
- [ ] Configure artifact storage and versioning
- [ ] Add automated testing step before builds

#### 3.3 App Store Preparation

- [ ] Update app metadata, screenshots, descriptions
- [ ] Prepare privacy policy (reflect M4A storage vs FLAC)
- [ ] Review permissions in `AndroidManifest.xml` and `Info.plist`
- [ ] Submit for review (can take 1-2 weeks for approval)

#### 3.4 Launch Strategy

**Approach:** New app deployment ✓ (different name/organization, no user
migration needed)

**Launch Schedule:**

- [ ] Week 1: Internal testing with team
- [ ] Week 2: Closed beta with 10-20 volunteers
- [ ] Week 3-4: Open beta testing period
- [ ] Week 5: Production launch
- [ ] Monitor crash reports and user feedback during beta period

**Note:** No data migration or rollback plan needed - this is a fresh deployment
for a new project.

## Verification Checklist

Before production launch, verify:

- [ ] All required features from .NET MAUI implemented in Tauri
- [ ] App store approval received for Android and iOS
- [ ] Beta testing completed with positive feedback
- [ ] Documentation updated for build and deployment
- [ ] Monitoring and analytics in place
- [ ] Privacy policy and app store metadata finalized

## Key Decisions to Make

### 1. Analytics Provider

- [ ] **Firebase Analytics** (matches .NET MAUI) - recommended for continuity
- [ ] Alternative: PostHog/Plausible - simpler, privacy-focused

### 2. Language Coverage Strategy  

- [x] **Keep Tauri languages** (Finnish + more Sámi variants) - recommended

### 3. Deployment Approach

- [x] New app deployment - no migration needed ✓

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
| ------ | -------- | ------------- | ------------ |
| App store rejection | High | Low | Review guidelines early, prepare privacy docs Phase 3.3 |
| Performance issues | Medium | Medium | Profile in Phase 2.3, optimize before launch |
| Audio quality issues | High | Low | Extensive testing in Phase 2.1 across all platforms |
| Beta feedback delays | Low | Medium | Allow 2-4 weeks for beta period with buffer time |

## Feature Comparison Reference

### Features in .NET MAUI Missing in Tauri (Phase 1)

1. ~~Multi-choice user entry view~~ ✓ (Section 1.1)
2. ~~Suggest user entry view~~ ✓ (Section 1.1)
3. ~~Separate schedule start page~~ ✓ (Section 1.2)
4. ~~Separate schedule finish page~~ ✓ (Section 1.2)
5. Firebase Analytics integration (Section 1.3 - pending decision)
6. ~~Keep screen on during recording~~ ✓ (Section 1.4)
7. ~~Max recording time enforcement~~ ✓ (Section 1.4)

### Features in Tauri Not in .NET MAUI

1. Debug/Test page (database inspection)
2. Modern web stack (TailwindCSS, React Router)
3. Localized language names in language selector

### Architectural Differences

- **.NET MAUI:** Records directly to FLAC on all platforms
- **Tauri:** Records in platform-native format (WAV/M4A), converts WAV→FLAC,
  saves M4A as-is

## Progress Tracking

**Phase 1 Progress:** 4/5 sections complete (1.1 ✓, 1.2 ✓, 1.4 mostly ✓, 1.5 ✓)  
**Phase 2 Progress:** 1/4 sections complete (M4A upload verified)  
**Phase 3 Progress:** 0/4 sections complete  

**Overall Progress:** 36% (5/14 major sections)

**Remaining in Phase 1:**

- Section 1.3: Analytics implementation (decision needed on provider)
- Section 1.4: Mobile device testing (quality assurance task)
- Section 1.5: Language switching testing on all platforms (quality assurance
  task)

## Notes & Updates

### 2026-02-25

- Initial plan created based on codebase research
- Recent fix: iOS recording now saves M4A natively instead of attempting FLAC
  conversion
- **Completed 1.1:** Created MultiChoiceView and SuggestInputView components,
  integrated into SchedulePage
  - Commits: 4b9964a, 7e54044, 7eb13da, 6d3cfa4
  - Components handle choice/multi-choice/super-choice prompt types
  - Fixed TypeScript type error with FluentVariable
- **Completed 1.2:** Added ScheduleStartPage and ScheduleFinishPage
  - Commits: b11245b, 637265a, efd7aec, af414c2, f18a7f1
  - Start page shows schedule preview before beginning
  - Finish page displays completion stats with share functionality
  - Updated routing: themes → start → schedule → finish
- **Completed 1.4 (partial):** Recording time limits and warnings
  - Commit: 0010eee
  - Implemented Wake Lock API for keep-screen-on during recording
  - Auto-stops recording at 10-minute max time limit
  - Shows warning alert at 9 minutes (1 minute before limit)
  - Added RecordingApproachingLimitMessage localization to all languages
  - Remaining: Mobile testing (Android/iOS) with screen timeout settings
- **Completed 1.5:** Localization alignment
  - Commits: 9e8c0c6, 81dff15
  - Verified all 9 languages have complete translations (102 keys each)
  - All 100 .NET MAUI translation keys present in Tauri
  - Implemented localized language names in language selector
  - Created comprehensive coverage report: `tauri-app/LOCALIZATION_COVERAGE.md`
  - Remaining: Manual testing of language switching on mobile platforms
- **Documentation Transfer:** Comprehensive README update
  - Commit: 2af0c6c
  - Transferred all essential MAUI documentation to `tauri-app/README.md`
  - Added backend setup, deployment procedures, troubleshooting
  - Documented architecture and contributing guidelines
- **Build Configuration System:** Implemented Tauri build profiles (Phase 3.1)
  - Uses `tauri.conf.json` (dev→localhost:8000) and `tauri.conf.release.json`
    (prod→Azure)
  - Matches .NET MAUI Debug/Release behavior
  - Android localhost remapping preserved
  - Build scripts: `tauri:dev`, `tauri:build`, `tauri:android:dev`,
    `tauri:android:build`
- Branch: `feature/tauri-migration`

### Future Updates

(Add notes here as work progresses)

## Resources

- .NET MAUI Implementation: `Recorder.Maui/` and `Recorder.Core/`
- Tauri Implementation: `tauri-app/`
- Migration Notes: `Recorder.Maui/MIGRATION_NOTES.md` (Xamarin → .NET MAUI)
- Repository: CSCfi/Kielipankki-donatespeech-app
- Branch: feature/tauri-migration
