# Recorder App - Tauri Implementation

Cross-platform speech donation application built with Tauri v2, React, and
TypeScript. Supports iOS, Android, macOS, Windows, and Linux.

This is the Tauri implementation that replaces the .NET MAUI version. See
[TAURI_MIGRATION_PLAN.md](../TAURI_MIGRATION_PLAN.md) for migration details.

## Quick Start

### Prerequisites

- **Node.js 18+** and **pnpm** (package manager)
- **Rust** (latest stable)
- **Tauri CLI**: `cargo install tauri-cli`

**Platform-specific:**
- iOS/macOS: Xcode 15+
- Android: Android Studio, Android SDK 21+
- Windows: Visual Studio Build Tools
- Linux: Development packages (see
  [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

### Build and Run

```bash
# Install dependencies
pnpm install

# Desktop development (hot reload)
pnpm tauri dev

# Build for desktop
pnpm tauri build

# Mobile development
pnpm tauri ios dev      # iOS
pnpm tauri android dev  # Android

# Mobile build
pnpm tauri ios build
pnpm tauri android build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) +
  [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  +
  [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Backend Setup

The app requires the recorder backend to be running for schedules, themes, and
uploads.

### Running Backend Locally

From the backend repository:

```bash
cd ../Kielipankki-donatespeech-backend/recorder-backend
./setup-local.sh
```

The backend runs on `http://localhost:8000` by default.

**Verify backend is reachable:**

```bash
curl http://localhost:8000/v1/schedule
curl http://localhost:8000/v1/theme
```

### Backend Configuration

The app uses Tauri build profiles to configure the API endpoint:

- **Development** (`tauri.conf.json`): Uses `http://localhost:8000`
- **Release** (`tauri.conf.release.json`): Uses Azure dev endpoint

**Build with different profiles:**

```bash
# Development build (localhost:8000)
pnpm tauri:dev                    # Desktop
pnpm tauri:android:dev            # Android

# Production build (Azure endpoint)
pnpm tauri:build                  # Desktop
pnpm tauri:android:build          # Android
```

**Change API endpoint:** Edit the `plugins.recorder.apiBaseUrl` in:
- `src-tauri/tauri.conf.json` (development)
- `src-tauri/tauri.conf.release.json` (production)

**Verify configuration:** The console will log the API URL on startup:
```
Initializing API client with base URL: http://localhost:8000
```

## Development

### Desktop Development

Run `pnpm tauri dev` for hot-reload development mode.

### Mobile Development

#### Android

**Android Emulator:**
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd <emulator_name>

# Run app
pnpm tauri android dev
```

**Android Localhost:** The app automatically remaps `localhost` and `127.0.0.1`
to `10.0.2.2` (Android emulator's host address).

**Physical Android Device:**
1. Find your computer's LAN IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   (macOS/Linux)
2. Start backend on all interfaces:
   `python -m uvicorn main:app --host 0.0.0.0 --port 8000`
3. Update API URL in `src-tauri/src/lib.rs` to `http://YOUR_IP:8000`
4. Ensure firewall allows port 8000

#### iOS

```bash
pnpm tauri ios dev
```

iOS automatically handles localhost properly on simulators. For physical
devices, use the same LAN IP approach as Android.

### Testing Onboarding Flow

The app shows onboarding pages (welcome and terms) to first-time users. To reset
during development:

```javascript
// In browser DevTools console (F12 or Cmd+Option+I):
localStorage.removeItem("onboardingCompleted")
```

Then refresh the app (F5 or Cmd+R).

### Testing Language Switching

The app supports 9 languages. Language preference is stored in localStorage and
persists across sessions. See
[LOCALIZATION_COVERAGE.md](LOCALIZATION_COVERAGE.md) for details.

## Deployment

### Google Play (Android)

1. Build release APK/AAB:
   ```bash
   pnpm tauri android build --release
   ```

2. Signed build artifacts will be in `src-tauri/gen/android/app/build/outputs/`

3. Upload to Google Play Console and publish to your desired track (internal,
   alpha, beta, or production)

**Note:** Ensure you have proper signing keys configured in Android Studio or
via Tauri configuration.

### App Store (iOS)

1. Build release IPA:
   ```bash
   pnpm tauri ios build --release
   ```

2. Submit using
   [Apple Transporter](https://apps.apple.com/us/app/transporter/id1450874784?mt=12)
   or Xcode

3. Once processed by App Store Connect, publish to TestFlight or production

**Note:** Requires valid Apple Developer account and proper provisioning
profiles.

### Desktop Builds

**macOS:**
```bash
pnpm tauri build --target universal-apple-darwin
```
Produces `.dmg` and `.app` in `src-tauri/target/release/bundle/`

**Windows:**
```bash
pnpm tauri build
```
Produces `.msi` installer in `src-tauri/target/release/bundle/`

**Linux:**
```bash
pnpm tauri build
```
Produces `.deb`, `.AppImage`, or other formats depending on configuration.

## Development Model

Trunk-based development: the latest development version is in the
`feature/tauri-migration` branch during migration, then will move to the default
`main` branch. Releases are tagged with semantic versioning.

App version is configured in:
- `package.json` → Frontend version
- `src-tauri/Cargo.toml` → Rust/Tauri version
- `src-tauri/tauri.conf.json` → App bundle version

## Troubleshooting

### Backend Connection Issues

**Problem:** App can't fetch themes/schedules

**Solutions:**
1. Verify backend is running: `curl http://localhost:8000/v1/theme`
2. Check if backend allows HTTP connections
3. For physical devices, verify:
   - Device is on same network as development machine
   - Firewall allows port 8000
   - API URL points to your LAN IP, not localhost

### Android Build Issues

**Problem:** Build fails with SDK errors

**Solutions:**
1. Ensure Android SDK 21+ is installed
2. Set `ANDROID_HOME` and `NDK_HOME` environment variables
3. Accept all Android SDK licenses: `sdkmanager --licenses`

### iOS Build Issues  

**Problem:** Build fails with Xcode errors

**Solutions:**
1. Ensure Xcode 15+ is installed
2. Install Xcode Command Line Tools: `xcode-select --install`
3. Open project in Xcode and resolve signing issues

### Audio Recording Issues

**Problem:** Recording fails or produces no audio

**Solutions:**
1. Check microphone permissions are granted
2. Verify no other app is using the microphone
3. On mobile, ensure app has proper audio session configuration
4. Check console logs for detailed error messages

## Architecture

- **Frontend:** React 19 + TypeScript + TailwindCSS
- **Backend:** Tauri v2 (Rust)
- **Database:** SQLite (via rusqlite)
- **Audio:** tauri-plugin-audio-recorder (WAV on desktop, M4A on mobile)
- **Localization:** Fluent (9 languages: Finnish, 2 Norwegian, Swedish, 5 Sámi
  variants)
- **Navigation:** React Router v7

**Recording Format:**
- **Desktop (macOS/Windows/Linux):** WAV (PCM) → Converted to FLAC for upload
- **Mobile (iOS/Android):** M4A (AAC) → Uploaded as-is

## Documentation

- **Migration Plan:** [TAURI_MIGRATION_PLAN.md](../TAURI_MIGRATION_PLAN.md) -
  Feature parity tracking
- **Localization:** [LOCALIZATION_COVERAGE.md](LOCALIZATION_COVERAGE.md) -
  Language support details
- **MAUI Migration:**
  [Recorder.Maui/MIGRATION_NOTES.md](../Recorder.Maui/MIGRATION_NOTES.md) -
  Xamarin to .NET MAUI migration

## Contributing

When adding features:
1. Follow the migration plan priorities
2. Commit per feature/bullet point (conventional commits format)
3. Ensure all 9 language files are updated with new strings
4. Test on at least 2 platforms (desktop + mobile)
5. Update documentation as needed

## License

See [LICENSE](../LICENSE) file in repository root.
