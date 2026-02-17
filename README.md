# Recorder app for iOS, Android, and macOS

This .NET MAUI application supports iOS, Android, and Mac Catalyst. The project
has been migrated from Xamarin.Forms to .NET MAUI.

## Quick Start

### Prerequisites
- .NET 10 SDK
- Xcode (for iOS/macOS builds)
- Android SDK (for Android builds)
- MAUI workload: `dotnet workload install maui`

### Build and Run

```bash
# Restore dependencies
dotnet restore Recorder.Maui/Recorder.Maui.csproj

# Build for specific platform
dotnet build Recorder.Maui/Recorder.Maui.csproj -f net10.0-maccatalyst  # macOS
dotnet build Recorder.Maui/Recorder.Maui.csproj -f net10.0-android      # Android
dotnet build Recorder.Maui/Recorder.Maui.csproj -f net10.0-ios          # iOS

# Run on Mac Catalyst
dotnet run --project Recorder.Maui/Recorder.Maui.csproj -f net10.0-maccatalyst
```

## Run backend locally

The app expects the recorder backend to be running for schedules/themes/uploads.
From the backend repo:

```bash
cd ../Kielipankki-donatespeech-backend/recorder-backend
./setup-local.sh
```

Base URL defaults to `http://localhost:8000` in the app config. For Android
emulator it is remapped to `http://10.0.2.2:8000` automatically. For physical
devices, set `RecorderApiUrl` in the relevant
`Recorder.Maui/BuildConfig/<Config>/appconfiguration.json` to your Mac LAN IP.

Troubleshooting:

- Verify backend is reachable:

```bash
curl http://localhost:8000/v1/schedule
curl http://localhost:8000/v1/theme
```

- If you see connection errors on devices, ensure the backend allows HTTP and
  your device can reach the host (same network, firewall allows port 8000).

## Development Model

Trunk-based development: the latest development version is in the default
branch, and releases are tagged. App version is configured in
`Recorder.Maui.csproj`.

## Deployment

### Google Play (Android)

Build the app in Release configuration:
```bash
dotnet build Recorder.Maui/Recorder.Maui.csproj -c Release -f net10.0-android
```

The AAB file will be in `Recorder.Maui/bin/Release/net10.0-android/`. Upload to
Google Play Console and publish to your desired track (internal, alpha, beta, or
production).

### App Store (iOS/macOS)

Build for iOS:
```bash
dotnet build Recorder.Maui/Recorder.Maui.csproj -c Release -f net10.0-ios
```

Submit the build using
[Apple Transporter](https://apps.apple.com/us/app/transporter/id1450874784?mt=12).
Once processed by App Store Connect, publish to TestFlight or production.

## Migration Notes

This project has been migrated from Xamarin.Forms to .NET MAUI. See
`Recorder.Maui/MIGRATION_NOTES.md` for details on:
- FLAC audio recording status
- Video playback implementation
- Resource migration
- Breaking changes and known differences
