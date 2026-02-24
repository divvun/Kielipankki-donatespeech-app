# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and
Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) +
  [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  +
  [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Development

### Native development

Run `pnpm tauri dev`

#### Testing Onboarding Flow

The app shows onboarding pages (welcome and terms) to first-time users. After
completing onboarding, a flag is stored in localStorage to prevent showing it
again.

To reset and re-test the onboarding flow during development:

- Open the browser's Developer Tools (F12 or Cmd+Option+I on macOS)
- Go to the Console tab
- Run the following command:

```javascript
localStorage.removeItem("onboardingCompleted")
```

- Refresh the app (F5 or Cmd+R on macOS)

The app will now show the onboarding pages again as if it's the first launch.

### Mobile

Run `pnpm tauri [android|ios] dev`

#### Android Localhost Development

The app automatically handles localhost connections for Android:

- **Android Emulator**: The app automatically remaps `localhost` and `127.0.0.1`
  to `10.0.2.2` (the special address Android emulators use to reach the host
  machine)
- **Physical Android Devices**: You'll need to use your computer's LAN IP
  address instead of localhost

To develop with a physical Android device:

1. Find your computer's IP address on your local network:
   - macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Linux: `ip addr show | grep "inet " | grep -v 127.0.0.1`
2. Start the backend to listen on all interfaces:
   `python -m uvicorn main:app --host 0.0.0.0 --port 8000`
3. Update the API base URL in the app code from `http://localhost:8000` to
   `http://YOUR_IP:8000`

**Note**: Make sure your firewall allows incoming connections on port 8000.
