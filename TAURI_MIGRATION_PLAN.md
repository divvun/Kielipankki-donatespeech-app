# Plan: Replace .NET MAUI Implementation with Tauri

**Status:** Planning Phase  
**Created:** 2026-02-25  
**Last Updated:** 2026-02-25  
**Deployment:** New app with different name/organization (no user migration
needed)



## Development Notes

**Package Manager:** Use `pnpm` for all npm operations in the `tauri-app/`
directory.

```bash
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

- [ ] Create `ScheduleStartPage.tsx` - intro screen before schedule begins
- [ ] Create `ScheduleFinishPage.tsx` - completion summary and stats
- [ ] Update `App.tsx` routes to include new pages
- [ ] Update `SchedulePage.tsx` navigation to route through start/finish pages

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

- [ ] Implement keep-screen-on during recording using `@tauri-apps/plugin-app`
  or custom plugin
- [ ] Add max recording time enforcement to
  `tauri-app/src/hooks/useRecording.ts`
- [ ] Add warning/alert when approaching max duration
- [ ] Test on both Android and iOS with screen timeout settings

**Files to modify:**

- `tauri-app/src/hooks/useRecording.ts`
- `tauri-app/src/pages/SchedulePage.tsx`

#### 1.5 Localization Alignment

**Decision needed:** Language coverage strategy

- [ ] Keep Tauri languages (Finnish + more Sámi variants)

**Tasks:**

- [ ] Review language coverage comparison
- [ ] Verify all UI strings are translated in `tauri-app/src/locales/`
- [ ] Test language switching on all platforms

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

- [ ] **Keep Tauri languages** (Finnish + more Sámi variants) - recommended

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

1. Multi-choice user entry view
2. Suggest user entry view
3. Separate schedule start page
4. Separate schedule finish page
5. Firebase Analytics integration
6. Keep screen on during recording
7. Max recording time enforcement

### Features in Tauri Not in .NET MAUI

1. Debug/Test page (database inspection)
2. Modern web stack (TailwindCSS, React Router)

### Architectural Differences

- **.NET MAUI:** Records directly to FLAC on all platforms
- **Tauri:** Records in platform-native format (WAV/M4A), converts WAV→FLAC,
  saves M4A as-is

## Progress Tracking

**Phase 1 Progress:** 1/5 sections complete (1.1 ✓)  
**Phase 2 Progress:** 1/4 sections complete (M4A upload verified)  
**Phase 3 Progress:** 0/4 sections complete  

**Overall Progress:** 14% (2/14 major sections)

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
- Branch: `feature/tauri-migration`

### Future Updates

(Add notes here as work progresses)

## Resources

- .NET MAUI Implementation: `Recorder.Maui/` and `Recorder.Core/`
- Tauri Implementation: `tauri-app/`
- Migration Notes: `Recorder.Maui/MIGRATION_NOTES.md` (Xamarin → .NET MAUI)
- Repository: CSCfi/Kielipankki-donatespeech-app
- Branch: feature/tauri-migration
