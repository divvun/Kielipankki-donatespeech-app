# Prototype Design: Speech Donation PWA

**Created:** 2026-03-05
**Context:** PWA-based speech donation app for Kielipankki. Users arrive via URL (campaign link or friend's share) — no app store, no install step.

---

## User Cases

### Case 1: First donation after seeing a campaign

**Marja, 34** — Finnish-speaking nurse in Tampere. Sees a social media post from University of Helsinki about donating speech for research. Taps the link during a coffee break. Has 10 minutes, wants to see what it's about, and is willing to contribute — but doesn't know what "donating speech" means in practice, how long it takes, or what happens to her recordings.

**Status data:**

- Thursday 14:20, coffee break at work
- iPhone Safari, Finnish language
- Opens via campaign link — lands directly in the PWA
- Wi-Fi connection
- Has never done anything like this before
- Doesn't know: what topics are available, how long a session takes, whether she can stop midway
- Knows: it's for research, it's voluntary (from the campaign post)
- 10 minutes available
- Browser will prompt for microphone permission when recording starts

**Variations:**

- v1: On mobile data — worries about bandwidth for uploading recordings
- v2: Gets interrupted mid-recording, closes browser tab — what happens?
- v3: Unsure about privacy — wants to understand before committing
- v4: Under 18 — needs parental consent acknowledgment

---

### Case 2: Inari Sami speaker contributing to preserve their language

**Aslak, 62** — Inari Sami speaker in Inari. Shown the app at a community gathering organized by the Sami Parliament. Someone shared the link to his phone. His language has fewer than 500 native speakers and he's motivated to help build speech technology for it. Comfortable speaking Inari Sami but less comfortable with technology — the app opens in Finnish by default and he needs to find the Inari Sami language option.

**Status data:**

- Saturday afternoon, at home after the community event
- Android Chrome, older phone
- Opens link someone messaged him at the event
- Native language: Inari Sami (inarinsaame)
- Interface language preference: Inari Sami if available, otherwise Finnish
- Deeply motivated — willing to spend 30+ minutes
- Less tech-comfortable — needs clear, simple navigation
- Wants to talk about culture and traditions (likely theme match)
- Doesn't know: whether the app supports his language, what topics are available
- May have spotty mobile connection in Inari region

**Variations:**

- v1: App doesn't have content/themes in Inari Sami specifically — how does the user know their recording is still valuable?
- v2: Wants to speak in Inari Sami but the prompt/question is in Finnish
- v3: Wants to record with a specific dialect — is that captured?
- v4: Bilingual (Inari Sami + Finnish) — wants to contribute in both

---

### Case 3: Friend shared a link — quick first impression

**Jenna, 22** — university student. Got a WhatsApp message from a friend: "Lahjoitin puhettani 5 minuuttia. Lahjoita sinäkin!" with a link. Taps it during a lecture break. The app opens instantly in her browser — no install needed. Didn't seek this out and has low commitment — she'll try it if it's fast and interesting, but will bounce if it feels complicated or takes too long to get started.

**Status data:**

- Weekday 12:15, between lectures
- Arrived via shared WhatsApp link — app opens in browser immediately
- iPhone Safari, Finnish language
- No prior knowledge of the campaign or Kielipankki
- 5 minutes before next lecture
- Low initial motivation — curiosity-driven
- Friend donated 5 minutes (shown in share message)
- Zero friction entry — no install, no app store, just a tap

**Variations:**

- v1: Finds it interesting, wants to "save" the app — does the PWA prompt add-to-home-screen?
- v2: Starts but runs out of time — closes tab — can they come back easily?
- v3: Opens the same link weeks later — does their progress persist?

---

### Case 4: Returning to donate more

**Marja** (from Case 1) donated 8 minutes of speech last week and found it surprisingly enjoyable. She told a colleague about it. Now she opens the app again — either from a bookmarked link, browser history, or home screen shortcut. She expects to pick up where she left off — seeing her previous contribution and finding new topics easily.

**Status data:**

- Sunday 20:00, relaxing at home
- Previously completed one schedule ("Daily Life" theme)
- Total donated: 8 minutes
- Opens via browser history / home screen icon / saved bookmark
- Wants to try "Nature & Environment" theme next
- Expects: to see her previous donation count, not repeat onboarding/terms
- Has 20 minutes available
- Knows: how recording works, what to expect
- Browser storage still intact (hasn't cleared data)

**Variations:**

- v1: All themes are completed — what's next?
- v2: New themes added since last visit — how does user discover them?
- v3: Cleared browser data or switched browser — lost all history and client ID
- v4: Opens from a different device — no cross-device sync

---

### Case 5: Wanting to delete recordings

**Aslak** (from Case 2) donated 35 minutes across two sessions. His son mentions that speech data could potentially be used for AI training beyond research. Aslak wants to understand exactly what happens with his recordings and how to delete them if needed. He needs to find his client ID — which is tied to this specific browser on this specific device — and understand the removal process.

**Status data:**

- Two weeks after donating
- Recordings across 2 themes
- Total donated: 35 minutes
- Concerned but not panicked — wants information first
- Needs to find: client ID, removal instructions, privacy policy details
- Client ID is browser-specific — clearing data or switching browser loses it
- Doesn't know: where to find these in the app, what the process looks like
- Language: using app in Finnish

**Variations:**

- v1: Already cleared browser data — lost access to client ID permanently
- v2: Wants to delete only specific recordings, not all
- v3: Wants reassurance but doesn't actually want to delete
- v4: Used multiple browsers/devices — has multiple client IDs without knowing

---

## Prototype Screens

### Screen structure: 5 + 1

| #   | Screen     | First-time | Returning    |
| --- | ---------- | ---------- | ------------ |
| 1   | Welcome    | Yes        | Skip         |
| 2   | Terms      | Yes        | Skip         |
| 3   | Themes     | Yes        | Landing page |
| 4   | Recording  | Yes        | Yes          |
| 5   | Completion | Yes        | Yes          |
| 6   | Details    | Via link   | Via link     |

### Flow

```
FIRST-TIME USER:
  Welcome (purpose + how-it-works + language selector)
    → Terms (scannable, accept at bottom)
      → Themes (cards with duration, donation counter)
        → Recording (prompt → record → continue, loop)
          → Completion (total time, share, donate more)

RETURNING USER:
  Themes (skip welcome/terms, show donation summary card)
    → Recording → Completion

DETAILS ACCESS (from any state):
  Themes → Details (recordings list, privacy info, client ID)
```

---

### Screen 1: Welcome

Purpose: first impression, explain what this is and how it works. Skipped for returning users.

- Short, warm headline — what this is and why it matters (1 sentence)
- Value proposition: "Your voice helps build language technology for everyone"
- Brief how-it-works explanation (merged into this screen — no separate intro screen)
- Three quick bullet points: what it is, how long it takes (~5 min), it's anonymous
- Single prominent CTA: "Aloita"
- **Language selector prominent** — not hidden in a corner. Language names shown in their own script (e.g. "Anaraskiela" not "Inarinsaame")
- No login, no sign-up — zero friction

### Screen 2: Terms

Purpose: trust and legal compliance. Skipped for returning users.

- Scannable sections, not a wall of text — accordion or sectioned layout
- Key sections: What is this? / Who runs it? / Your privacy / Your rights / How to delete
- Accept button visible without scrolling on mobile
- Brief note about under-18 consent
- Should feel trustworthy but not bureaucratic
- Any untranslated content falls back gracefully with a note: "This section is available in Finnish"

### Screen 3: Themes

Purpose: choose what to talk about. Primary landing screen for returning users.

**First-time user:**

- Donation counter at top: "0 min"
- Theme cards: title, brief description, estimated duration, icon/image
- Duration estimate is critical — users need to know if a theme fits their time window

**Returning user:**

- Tappable donation summary card at top: "8 min 23 s — 4 recordings"
- Tapping the summary opens Details (recordings list) — both information and a shortcut
- Theme cards below with completion states — completed themes visually distinct (checkmark, different styling) but still accessible for re-donation
- New/uncompleted themes visually prioritized
- Details/info link visible (not buried)

| User state | What shows at top                                                 |
| ---------- | ----------------------------------------------------------------- |
| First-time | "0 min" — just the counter                                        |
| Returning  | "8 min 23 s — 4 recordings" — tappable summary linking to Details |

### Screen 4: Recording

Purpose: the core donation interaction. Loops through schedule items.

- Prompt/question displayed prominently
- Large, clear record button (centered, unmissable)
- Progress indicator: "1/4"
- Timer shows recording duration while active
- Stop button replaces record when active
- Skip and Retry options (secondary, not competing with main action)
- "Jatka" (Continue) appears after recording stops
- **"Respond in your language" hint** — supports multilingual donors (e.g. Inari Sami speaker reading Finnish prompts)
- Browser microphone permission requested on first recording

**Handles multiple item types within a consistent frame:**

- Open prompts: question + record button
- Media items: show image / play audio/video, then record response
- Choice prompts: show options, user picks one (no recording needed)
- Text input: keyboard input

### Screen 5: Completion

Purpose: reward and re-engagement.

- Celebratory but not over the top: "Hyvin kerrottu, paljon kiitoksia!"
- Total donated time: "Olet lahjoittanut: 5 min 23 s"
- Share button: "Kerro kaverille" — generates share message with donated time
- "Lahjoita lisaa" — back to themes to pick another topic
- The feeling: accomplishment + easy next action

### Screen 6: Details

Purpose: recordings management, privacy info, client ID. Accessed via link from Themes screen.

- **Recordings tab:** list of recordings with dates, durations, delete option per recording
- **Privacy & Info tab:** data handling explanation, client ID displayed prominently with copy button, email address for deletion requests
- Client ID section with warning: "Save this ID — you'll need it to request deletion"

---

## Key Design Decisions

1. **Welcome + how-it-works merged** — one screen instead of two, less friction
2. **No schedule intro screen** — go straight from theme selection to recording
3. **Language selector prominent on welcome** — names shown in their own script
4. **Duration estimates on theme cards** — critical for low-commitment users (Case 3)
5. **"Respond in your language" hint on recording** — supports multilingual donors (Case 2)
6. **Returning users skip to themes** — onboarding completion stored in local storage
7. **Donation summary is tappable** — links to full recordings list, serves as both info and navigation
8. **Details accessible but not prominent** — info link on themes screen, not competing with donation CTA

## Design Patterns Applied

- **Short paths:** Campaign link to first recording in 3 taps (welcome → terms → theme → record)
- **All items visible:** All themes shown at once, no search/filter needed
- **Self-evident data:** Duration shown as "~5 min", no label needed for what it means
- **Immediate effect:** Recording starts/stops instantly, timer updates live
- **Overview beside detail:** Donation counter always visible on themes screen

---

## Parking Lot

Items identified during simulation that need future decisions:

- PWA install prompt / add-to-home-screen — when and how?
- Offline support — what if connection drops mid-recording?
- Upload status visibility — should users see if recordings uploaded?
- Cross-device experience — what happens on desktop vs mobile?
- Accessibility: screen reader support for recording interface
- What happens when all themes are completed?
- Analytics / engagement tracking
