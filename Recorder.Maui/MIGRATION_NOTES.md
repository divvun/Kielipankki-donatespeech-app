# MAUI Migration Notes

## Audio Recording - FLAC Implementation Status

### Current Situation
- **Xamarin Android**: Uses complex MediaCodec-based FLAC encoding with MD5
  checksums (389 lines)
- **MAUI Android**: Uses basic MediaRecorder without FLAC encoding (144 lines)

### Xamarin Features Not Yet Ported
1. **FLAC Encoding**: MediaCodec-based FLAC compression
2. **MD5 Checksums**: Live checksum calculation during recording
3. **FLAC Header Finalization**: Sample count and metadata finalization
4. **Low-level Buffer Management**: Direct AudioRecord buffer handling
5. **Endianness Swapping**: For FLAC header compatibility

### FLAC Library Options for MAUI

#### 1. FlacLibSharp (Recommended for Evaluation)
- **Repository**: https://github.com/AaronLenoir/flaclibsharp
- **Type**: Pure C# FLAC encoder/decoder
- **Pros**: Cross-platform, no native dependencies, actively maintained
- **Cons**: Need to test Android performance, integration with AudioRecord
-  **Status**: NOT YET TESTED

#### 2. Port Xamarin MediaCodec Implementation
- **Pros**: Proven to work on Android, same quality/features
- **Cons**: Complex code (389 lines), platform-specific, requires extensive
  testing
- **Status**: NOT STARTED

#### 3. NAudio with FLAC Support
- **Repository**: https://github.com/naudio/NAudio
- **Type**: .NET audio library
- **Pros**: Well-known, comprehensive
- **Cons**: Primarily Windows-focused, unclear Android support
- **Status**: NOT EVALUATED

#### 4. Native libFLAC via P/Invoke
- **Pros**: Native performance, proven library
- **Cons**: Requires native library bundling, platform-specific P/Invoke
- **Status**: NOT EVALUATED

### Impact
Current MAUI implementation produces audio recordings but:
- **Different format**: May not be FLAC
- **No checksums**: Cannot verify recording integrity
- **Different quality**: Compression settings may differ

### Next Steps
1. Decide if FLAC is required or if current format is acceptable
2. If FLAC required: Evaluate FlacLibSharp compatibility with Android
3. Implement chosen solution with comprehensive testing
4. Verify output compatibility with backend expectations

## Video Playback - MediaElement Migration

### Plan
Replace custom VideoPlayer with CommunityToolkit.Maui.MediaElement:
- Already included: CommunityToolkit.Maui 14.0.0
- Need to add: MediaElement initialization in MauiProgram.cs
- Update: ItemToMediaViewConverter to use MediaElement instead of placeholder
- Remove: VideoPlayer.cs (no longer needed)

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
