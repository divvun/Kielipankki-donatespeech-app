# MAUI Migration Notes

## Audio Recording - FLAC Implementation Status

### ✅ COMPLETED: Android FLAC Implementation Ported

The Xamarin.Android MediaCodec-based FLAC recording implementation has been
**successfully ported** to MAUI's `Platforms/Android/AudioRecorder.cs`.

#### Key Features Ported
1. **FLAC Encoding**: MediaCodec-based FLAC compression ✅
2. **MD5 Checksums**: Live checksum calculation during recording ✅
3. **FLAC Header Finalization**: Sample count and metadata finalization ✅
4. **Low-level Buffer Management**: Direct AudioRecord buffer handling ✅
5. **Endianness Swapping**: For FLAC header compatibility ✅

#### Technical Details
- **Recording API**: Uses `AudioRecord` to capture PCM audio from microphone
- **Encoding**: PCM data fed to `MediaCodec` configured as FLAC encoder
- **Format**: Mono (1 channel), 44.1kHz sample rate, 16-bit depth
- **Output**: Encoded FLAC written directly to file with MD5 checksums
- **Recording Loop**: Two-stage parallel process:
  1. Read microphone input → pass to encoder
  2. Read encoded data → write to disk
- **Post-processing**: Headers patched after recording with accurate sample
  counts

#### Migration Changes
- Namespace: `Recorder.Droid` → `Recorder.Maui.Platforms.Android`
- Dependencies: `Xamarin.Forms` → `Microsoft.Maui.Controls`
- File paths: `Xamarin.Essentials.FileSystem` →
  `Microsoft.Maui.Storage.FileSystem`
- Nullability: Added nullable reference type annotations
- Debugging: Added `Debug.WriteLine` statements for troubleshooting

#### Build Status
- ✅ Android (net10.0-android): Build succeeded
- ✅ iOS (net10.0-ios): Build succeeded (uses separate iOS implementation)
- ✅ Mac Catalyst (net10.0-maccatalyst): Build succeeded

### Original Analysis (Now Obsolete)

<details>
<summary>Click to view original migration planning notes</summary>

### Current Situation (OUTDATED)
- **Xamarin Android**: Uses complex MediaCodec-based FLAC encoding with MD5
  checksums (389 lines)
- **MAUI Android**: Uses basic MediaRecorder without FLAC encoding (144 lines)
- **Resolution**: MediaCodec implementation has been ported

### Xamarin Features Not Yet Ported (NOW PORTED)
All features have been successfully ported to MAUI.

### FLAC Library Options for MAUI (NO LONGER NEEDED)

#### FlacLibSharp
- **Status**: ❌ NOT SUITABLE - Library only handles FLAC metadata (tags), not
  audio encoding/decoding
- **Evaluation**: Package tested and confirmed to be metadata-only

Other options are no longer needed as the original MediaCodec implementation has
been ported.

</details>

## Video Playback - MediaElement Migration

### ✅ COMPLETED: MediaElement Implementation

The custom VideoPlayer component has been **successfully replaced** with CommunityToolkit.Maui.MediaElement.

#### Implementation Details
- **Package**: CommunityToolkit.Maui.MediaElement 5.0.0 ✅
- **Initialization**: Added `.UseMauiCommunityToolkitMediaElement()` in MauiProgram.cs ✅
- **Converter**: Updated ItemToMediaViewConverter.CreateVideo() to use MediaElement ✅
- **Removed**: VideoPlayer.cs (no longer needed) ✅

#### Features Implemented
- **Auto-play**: Configurable based on recording state (`ShouldAutoPlay`)
- **Playback controls**: Native video controls enabled (`ShouldShowPlaybackControls`)
- **Video reset**: Supports seeking to start via `VideoReset` event
- **Recording overlay**: When recording is enabled, overlays video with image
- **Aspect ratio**: AspectFill to match 16:9 display dimensions
- **Error handling**: Graceful fallback to placeholder view on errors

#### MediaElement Properties
```csharp
Source = MediaSource.FromUri(url)
ShouldAutoPlay = !model.IsRecordingEnabled
ShouldShowPlaybackControls = true
ShouldMute = false
HeightRequest = MediaHeight
Aspect = Aspect.AspectFill
```

#### Platform Support
- ✅ Android: Uses Android MediaPlayer/ExoPlayer
- ✅ iOS: Uses AVPlayer
- ✅ Mac Catalyst: Uses AVPlayer

#### Known Limitations
- Package version (5.0.0) targets MAUI 9.x but works on MAUI 10.0.30
- Build warning NU1608 (version constraint) - does not affect functionality



## Firebase Analytics

**Decision**: Keep no-op implementation (analytics not required)

## Custom Renderers

**Decision**: Accept UI differences (not porting custom renderers)

Missing renderers:
- CustomImageRenderer (bottombar image scaling)
- CustomLabelRenderer (Android hyphenation)
- CustomScrollViewRenderer (iOS inset handling)
- RecorderButtonRenderer (button text formatting)
- RoundedCornersEffect (visual styling)
- SafeAreaInsetEffect (iOS safe areas)

These may cause minor visual differences but should not affect core
functionality.
---

## Migration Status Summary

### ✅ Completed Components

| Component | Status | Notes |
|-----------|--------|-------|
| **Android FLAC Recording** | ✅ Complete | MediaCodec implementation ported with MD5 checksums |
| **Video Playback** | ✅ Complete | Replaced VideoPlayer with MediaElement |
| **Resource Migration** | ✅ Complete | Images moved to MAUI structure |
| **Solution Cleanup** | ✅ Complete | Removed all Xamarin projects |
| **Build System** | ✅ Complete | All platforms build successfully |

### ⚠️ Pending Runtime Verification

These features are implemented but need device/emulator testing:

1. **Video Playback Testing**
   - Test MediaElement on Android (MediaPlayer/ExoPlayer)
   - Test MediaElement on iOS (AVPlayer)
   - Test MediaElement on Mac Catalyst (AVPlayer)
   - Verify auto-play behavior
   - Verify playback controls
   - Verify recording overlay functionality

2. **FLAC Audio Recording Testing**
   - Test Android MediaCodec FLAC encoding on real devices
   - Verify MD5 checksum calculation
   - Verify FLAC header patching
   - Test file upload to backend
   - Verify backend accepts FLAC files

3. **Platform-Specific Testing**
   - Android: Test on various API levels
   - iOS: Test on device (not just simulator)
   - Mac Catalyst: Test on macOS

### 🔧 Minor Issues to Address

1. **Build Warnings**
   - NU1608: MediaElement version constraint (non-breaking)
   - CS8602: Nullability warnings in ThemesPageViewModel
   - CS8600: Nullability warning in ScheduleListPage
   - CS0618: iOS AVAudioRecorder.currentTime deprecation
   - CA1422: Android MediaRecorder API level warning

2. **Code Quality**
   - Fix nullability warnings for cleaner builds
   - Update iOS audio recorder to use non-deprecated API
   - Consider updating MediaRecorder for Android 31+