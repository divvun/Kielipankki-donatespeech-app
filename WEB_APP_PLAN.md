# Web App Migration Plan (Tauri -> Browser)

Date: 2026-03-05
Branch: `feature/api-spec-update`

## Goal
Migrate the current Tauri application into a browser-first web application while preserving core user flows:
- Browse themes and schedules
- Play media prompts
- Record audio responses
- Store pending recordings locally
- Upload recordings reliably

## Feasibility Verdict
This migration is feasible.

A direct "compile current Rust/Tauri layer to WASM" approach is not a drop-in path because the current backend layer depends on:
- Tauri command runtime (`#[tauri::command]`, `AppHandle`, `State`)
- Native filesystem paths (`app_data_dir`)
- Native SQLite (`rusqlite`)
- Native plugin-based recording integration

## Current Frontend Command Surface
The frontend currently calls these Tauri commands:
- `delete_file`
- `delete_recording`
- `download_media`
- `fetch_schedule`
- `fetch_schedules`
- `fetch_themes`
- `fix_client_ids`
- `get_api_base_url`
- `get_recordings`
- `insert_test_recording`
- `read_file_as_base64`
- `save_recording`
- `upload_pending_recordings`

## Recommended Target Architecture
Use a platform adapter layer in TypeScript so app pages/hooks do not call `invoke(...)` directly.

### Core idea
Define one interface (for example `PlatformApi`) and provide two implementations:
- `TauriPlatformApi` for existing app behavior
- `WebPlatformApi` for browser behavior

### Web implementation strategy
- API calls: use `fetch` against existing backend endpoints in `openapi.json`
- Local storage for recordings and metadata: IndexedDB
- Audio recording: browser `MediaRecorder`
- Media playback: direct `/v1/media/{filename}` URL or `fetch` + blob URL when needed
- Background uploads: periodic timer plus online-state retry

## Command-to-Web Mapping
- `fetch_themes`, `fetch_schedules`, `fetch_schedule`:
  - Replace with direct HTTP `GET` calls to `/v1/theme`, `/v1/schedule`, `/v1/schedule/{schedule_id}`.
- `get_api_base_url`:
  - Replace with env config (`VITE_API_BASE_URL`).
- `download_media`:
  - Replace with direct media URL loading and optional browser cache handling.
- `read_file_as_base64`, `delete_file`:
  - Remove native file dependency; use in-memory `Blob` from `MediaRecorder` and convert as needed.
- `save_recording`:
  - Replace with web save flow:
    - Keep recording blob + metadata in IndexedDB as pending item.
- `get_recordings`, `delete_recording`, `insert_test_recording`:
  - Replace with IndexedDB operations.
- `upload_pending_recordings`:
  - Replace with web upload queue worker that posts to `/v1/upload`, then uploads to returned presigned URL.
- `fix_client_ids`:
  - Replace with one-time IndexedDB migration script for old local entries.

## Phased Implementation Plan
1. Phase 1: Introduce platform abstraction
- Add `src/platform/PlatformApi.ts` interface.
- Add `src/platform/tauriPlatformApi.ts` wrapper over existing `invoke` calls.
- Update pages/hooks to depend on the interface instead of direct `invoke`.
- Keep behavior unchanged.

2. Phase 2: Web read-only flows
- Add `src/platform/webPlatformApi.ts` with HTTP implementations for themes/schedules/media.
- Add runtime platform selection.
- Verify routes `/themes`, `/schedule/:id/start`, `/schedule/:id` work in browser mode.

3. Phase 3: Web recording pipeline
- Implement `MediaRecorder`-based capture in web adapter.
- Store recording blobs + metadata in IndexedDB.
- Preserve duration tracking and client ID behavior.

4. Phase 4: Upload queue and resiliency
- Implement periodic pending upload in web mode.
- Retry on reconnect and transient failures.
- Add cleanup and deletion logic for successfully uploaded items.

5. Phase 5: Tests and hardening
- Add unit tests for platform adapters.
- Add integration tests for recording lifecycle and upload queue behavior.
- Verify parity with Tauri flows (including fake YLE media behavior).

6. Phase 6: Optional Rust/WASM extraction
- Identify pure Rust logic worth sharing (for example audio processing utilities).
- Move pure logic to a separate crate without Tauri dependencies.
- Compile that crate to WASM only if performance or reuse justifies complexity.

## Acceptance Criteria
- Browser build runs without Tauri runtime.
- No direct `@tauri-apps/api/*` imports remain in page-level components/hooks used by web runtime.
- User can complete full flow in browser:
  - open theme
  - open schedule
  - record audio
  - see local pending recordings
  - upload pending recordings
- Existing Tauri mode still works.

## Risks and Mitigations
- Risk: Browser recording MIME/container differences across platforms.
- Mitigation: Normalize supported MIME types and validate server expectations.

- Risk: Offline queue inconsistency.
- Mitigation: Use deterministic IndexedDB schema and idempotent upload state transitions.

- Risk: CORS or auth policy mismatch for browser requests.
- Mitigation: Add explicit backend CORS policy for deployed web origin(s).

## Suggested Execution Order for This Repo
1. Build the `PlatformApi` interface and Tauri adapter first.
2. Replace direct `invoke(...)` usage in:
- `src/App.tsx`
- `src/pages/ThemesPage.tsx`
- `src/pages/ScheduleStartPage.tsx`
- `src/pages/SchedulePage.tsx`
- `src/pages/DetailsPage.tsx`
- `src/pages/TestPage.tsx`
- `src/hooks/useAutoUpload.ts`
- `src/hooks/useRecording.ts`
- `src/utils/mediaUrl.ts`
3. Add the web adapter and switch based on runtime.
4. Implement IndexedDB storage and upload queue.
5. Add tests and run parity verification.

## Out of Scope (Initial Migration)
- Replacing backend API design
- Full offline-first PWA feature set
- Immediate Rust-to-WASM conversion of Tauri command layer
