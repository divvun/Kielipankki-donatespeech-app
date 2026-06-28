# App Store Submission Prep — Summary of Recent Changes

## Android layout fixes

Fixed a status bar overlap bug on Android API 35/36, which enforces edge-to-edge rendering. Content was rendering behind the status bar; this required patching `MainActivity.kt` to apply window insets correctly. Also corrected the app icon appearing zoomed in on Android due to an icon scaling issue.

## iOS/cross-platform safe area fixes

Nav bar content was rendering behind the status bar/Dynamic Island because safe area insets were applied to `<body>` rather than the actual scroll containers. Fixed by applying `env(safe-area-inset-*)` utilities directly to nav bars and page wrappers, and constraining page height to the viewport so inner content scrolls independently of the nav bar.

## Terms & content (app store reviewers read this)

Several sections of the Terms page had empty or placeholder content. Filled in body text for all active locales (Northern Sami, South Sami, Lule Sami), fixed broken locale key references, and replaced hardcoded `example.com` URLs with real ones. Both stores flag apps with blank legal screens or placeholder links.

## Placeholder contact email

The contact email in the Terms was `hankkeen-nimi@kielipankki.fi` — Finnish for "project name", i.e. an unfilled template slot. Replaced with `feedback@divvun.no` across all locales.

## Developer test page

A `/test` route exposing database internals and test-recording controls was wired into the router unconditionally. Guarded it behind `import.meta.env.DEV` so it is compiled out of production builds entirely. Both stores reject apps that ship with visible dev tooling.

## Privacy policy

The in-app privacy policy claimed users could delete their data directly within the app, but the UI only offered a "Copy Client ID" button with instructions to email for deletion. Fixed the policy to accurately describe the email-based deletion flow, moved the canonical policy to `jietnašiella.org/privacy/` (the URL submitted to the stores), and removed the duplicate copy from the repo.
