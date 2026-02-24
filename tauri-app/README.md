# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and
Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) +
  [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  +
  [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Development

### Testing Onboarding Flow

The app shows onboarding pages (welcome and terms) to first-time users. After
completing onboarding, a flag is stored in localStorage to prevent showing it
again.

To reset and re-test the onboarding flow during development:

1. Open the browser's Developer Tools (F12 or Cmd+Option+I on macOS)
2. Go to the Console tab
3. Run the following command:
   ```javascript
   localStorage.removeItem("onboardingCompleted")
   ```
4. Refresh the app (Cmd+R or F5)

The app will now show the onboarding pages again as if it's the first launch.
