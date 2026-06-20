# PROGRESS.md

## Last Updated
2026-06-19

---
# ⭐ HANDOFF / CURRENT STATE (2026-06-19) — read this first
Everything below the divider is detailed history; this block is the live state.

## 🩹 Fixed 2026-06-19 — OTA updates never reached the phone (channel ↔ branch unlinked)
- **Symptom:** web fully current, but `eas update --branch preview` changes never appeared on the installed app.
- **Root cause:** updates were published to the **branch** `preview`, but the **channel** `preview` (what the APK subscribes to, per `eas.json`) had an **empty branch mapping** (`branchMapping.data: []`). The app asked the channel, which resolved to no branch → no update served. (Config was otherwise correct: `app.json` `updates.url` + `runtimeVersion.policy: sdkVersion`; published updates are runtime `exposdk:51.0.0`, matching the installed APK.)
- **Fix (one-time, no rebuild/republish):** `eas channel:edit preview --branch preview`. Verified: channel now maps to branch `preview` with the latest update active (commit `28b28a6`, incl. the edge-swipe remount fix). Future `eas update --branch preview` will now reach devices automatically.
- **Device behavior to expect:** `fallbackToCacheTimeout` is the default `0`, so the app runs the current bundle and downloads the new one in the background → it applies on a **later cold start** (typically **two full closes/reopens**). The phone must reach `u.expo.dev` to fetch — keep **VPN on** for the update-download launch given the Iran network context.
- Diagnostics: `eas channel:view preview` (mapping) + `eas update:list --branch preview` (published updates).

## ✅ Shipped 2026-06-18 — Path-tab scroll UX (JS-only, OTA-able)
All driven by a runtime-only `src/stores/pathScrollStore.ts`. On focus the Path tab decides, in priority order: new meal saved → bottom; meal time edited → that meal; true first launch → bottom; otherwise → restore saved offset. (`app/(tabs)/index.tsx`)
- **Scroll position restored on route change.** Previously forced `scrollToEnd` on every focus, so returning from an edit / tab switch jumped to the bottom. Now restores the exact prior offset.
- **Floating "scroll to latest" button.** Circular orange (`#F39C3D`) chevron-down pinned bottom-right; appears only when scrolled up away from the bottom (via `onScroll`, 80px tolerance, only when scrollable), hides at the bottom, smooth-scrolls down on tap.
- **New-meal autoscroll.** `capture-form`'s `goToPath()` sets a one-shot `jumpToBottom` flag on save (the single new-meal path — text meals route through here too) → Path smooth-scrolls to bottom to reveal the new meal.
- **Edited-time autoscroll (`235386c`).** `meal/edit` sets `focusMealId` when `eatenAt` changed; `MealRow` forwards its row View (`innerRef` → `DaySection.registerRow` → a Map on the Path screen), and `scrollToMeal` uses `measureLayout` against the ScrollView inner node to smooth-scroll to the meal's new timeline spot.
- **🩹 Edge-swipe-back remount fix (`e6bbca7`).** Android's predictive/edge-swipe back gesture **recreates the Path screen**, which reset an in-component `didInitialScroll` ref → re-ran first-mount `scrollToEnd` → snapped to bottom (in-app back button did a plain pop, so it worked). Fix: moved `savedOffset` + `initialized` into `pathScrollStore` (survives remount) and restore the offset explicitly; the bottom-snap is now gated by `initialized`, which a remount can't reset. `onContentSizeChange` re-applies the pending restore within a 600ms window to cover layout-after-focus on remount. **Diagnosis ~85% (bottom-jump = our scrollToEnd ran = remount); needs an on-device edge-swipe test to confirm.**
- **Status:** committed + pushed (HEAD `e6bbca7`), web auto-deployed. **Pure JS → ship to the phone with `eas update --branch preview`** (no rebuild). Gesture behavior NOT yet verified on device.

## ✅ Shipped + REBUILT 2026-06-08..18 — meal photo performance (native; now installed)
- Users reported slow photo loads + laggy Path scrolling. Photos are remote PNG **signed URLs** (stable, 1-yr TTL), uploaded full-resolution with no caching on render. Two fixes (`5d10072`):
  - **A — downscale + JPEG on upload** (`src/services/storage.ts` `shrink()` via `expo-image-manipulator`): resize to ~1000px / quality 0.7 (avatars 512px), safe fallback to original on failure. New uploads go from multi-MB PNG → a few hundred KB.
  - **B — `expo-image` on the Path tab** (`MealRow.tsx`): `cachePolicy="memory-disk"` + downsampling; stable signed URLs make the cache effective.
- **Both are native modules → required a rebuild. That rebuild is DONE, installed, and user-confirmed ("all is good").** So the installed APK now bakes in `expo-image` + `expo-image-manipulator`.
- **Decision: existing photos use "Option 1"** — no server-side resize (user is on Supabase **free**, image-transform add-on is Pro-only) and no re-process migration; rely on B's caching/downsampling. Old PNGs are slow only on first view, then cached. (Re-process via a one-time `sharp` script remains the clean future option if needed.)

## ✅ RESOLVED 2026-06-08 — date/time picker works on device + OTA is finally live
- **Picker decision: kept the custom PanResponder drum** (no native picker, no library). The repeated Android failures were two real bugs, now fixed:
  1. **Page scrolled away while dragging the wheel** — fixed without a nested ScrollView: each picker screen (`capture-form`, `text-meal`, `meal/edit/[id]`) now has a `pageScrollEnabled` state; the card wrapping `DateTimeRow` sets `onTouchStart`→disable / `onTouchEnd`+`onTouchCancel`→enable on the parent `ScrollView`. The wheel is a `PanResponder` (not a ScrollView), so it stays draggable while the page is locked.
  2. **Setting one wheel reset the others to the current time** — root cause was a stale closure: `Wheel.tsx`'s `PanResponder`/`commit` are built once at mount and captured the mount-time `onIndexChange`, which closed over `DateTimeRow`'s mount-time `d`. Routed `commit` through an `onIndexChangeRef` that always points at the latest handler. Hour/minute/date now persist independently until save/close. Verified via an ad-hoc Node composition test (10/10) + on web + **on device ("the picker was great")**.
  - **Jalali FA months** wired into the date wheel: Persian shows Solar-Hijri months in day-then-month order (e.g. `پنجشنبه 16 اردیبهشت`); date column widens to 150px on FA. English unchanged.
- **🟢 OTA is now ENABLED on the phone.** A fresh `eas build -p android --profile preview` was completed and installed (from ~`6c5d209`). Because this build's `app.json` has `expo.updates.url`, the device will now fetch OTA updates. **Going forward: JS-only changes ship via `eas update --branch preview` (~2 min, no rebuild); native changes still need `eas build`.**
  - Build-upload gotcha discovered: `eas build` upload to EAS storage returned **403 Forbidden** from a blocked VPN exit / region (not a CLI-version issue — confirmed identical on 20.1.0). Fix was switching the VPN exit node to an unrestricted region. `eas` and `npx eas-cli` are the same tool.
- **Still worth an on-device sanity pass** (newly activated native changes from this rebuild): Insights drag-reorder (Reanimated/DraggableFlatList, no crash), native photo-meal upload → web sync, Jalali wheel in FA, sync pill only flashing "Saving…".

## Repo / deploy
- Git HEAD = **`b9e9f0d`** ("Docs: start every response with the user's name (Ava)") + this PROGRESS log commit, `main` is in sync with `origin/main`.
- **OTA channel↔branch link fixed 2026-06-19** (EAS-side, no code change) — `eas update --branch preview` now reaches installed devices. The latest published update (commit `28b28a6`) carries all Path scroll work incl. the edge-swipe remount fix; gesture behavior still to be confirmed on device once the update lands.
- **Installed APK** was rebuilt from ~`5d10072` (meal-photo optimization) — it bakes in `expo-image` + `expo-image-manipulator` and has OTA enabled. JS-only commits since (Path scroll UX through `e6bbca7`) reach it via `eas update --branch preview` — **not yet pushed OTA / verified on device.**
- **Vercel web app is LIVE and fully current** (auto-deploys from `main`): https://the-may-seven.vercel.app
- GitHub: https://github.com/avaiii1485/the-may  · Supabase project ref `lobvpaqhgephjyeiupng` · Expo account `ava8y`, EAS projectId `8110698b-35bf-4179-b4e7-de5b4decf364`.
- `.env.local` (gitignored) holds the Supabase URL + anon key. Same keys are set as EAS env vars (all 3 envs) and in Vercel.

## 🟢 RESOLVED 2026-06-08: OTA now reaches the phone (history below)
> The rebuild described in this section was completed and installed on 2026-06-08, so the phone now has OTA enabled. The original diagnosis is kept below for context.

## 🔴 (historical) CRITICAL discovery: OTA updates were NOT reaching the phone
- Symptom: user kept seeing OLD date/time picker behavior (tap-to-type, "00" reset) that was removed two wheel-versions ago. → The installed APK has **never received any `eas update`**.
- **Root cause:** `app.json` was missing `expo.updates.url`, so the last APK build did **not** have OTA enabled — the phone only ever runs the JS **baked into the APK at build time**. Every `eas update` I published went to the web/Expo server but the app never fetched it.
- **FIXED in config:** `app.json` now has `"updates": { "url": "https://u.expo.dev/8110698b-35bf-4179-b4e7-de5b4decf364" }` (committed). **BUT this only takes effect after the NEXT `eas build`.** Until a fresh build is installed, OTA does nothing for this device.
- **Consequence / mental model going forward:** the **currently installed APK was built from commit `3dc5923`** ("Restore native drag-to-reorder"), so the phone is running: Reanimated enabled, native DraggableFlatList on Insights, and **wheel v1 (ScrollView + tap-to-edit, the buggy one)**. All wheel fixes since (`090726e`, `75a9375`) are on web + git but NOT on the phone.
- **THE NEXT REQUIRED ACTION IS A REBUILD** (`eas build -p android --profile preview`). That rebuild (a) ships all the JS fixes, and (b) finally enables OTA so future JS-only changes reach the phone via `eas update --branch preview`.

## ✅ RESOLVED 2026-06-08 — date/time picker (see the handoff block at top)
> Outcome: kept the custom PanResponder drum; fixed the page-scroll conflict (per-screen `pageScrollEnabled` + touch handlers) and the stale-closure value reset (`onIndexChangeRef`), and added Jalali FA months. Verified on web and on device. The A-vs-B (native picker / library drum) decision below was NOT taken — the custom drum was made to work instead. Original notes kept for context.

## (historical) ⏳ UNRESOLVED — date/time picker (user wanted to change it AGAIN)
The custom wheel had failed repeatedly on Android. Code at `75a9375` was a PanResponder drum (`src/components/capture/Wheel.tsx` + `src/components/capture/DateTimeRow.tsx`) — untested on device. User's reported bugs (on the OLD baked v1, but the approach is the concern):
1. Dragging the wheel scrolls the **page** away (nested-scroll / gesture conflict).
2. Tap-to-type isn't digit-limited (need max 2 digits, hour 00–23, minute 00–59) — **NOTE: v3/PanResponder already removed tap-to-type entirely.**
3. Typing then "Done" sets value to "00" even if unchanged.
4. A random time gets logged and can't be fixed.
5. **Farsi date months are NOT Solar-Hijri (Jalali)** — must show Jalali months on the FA side (we have `src/lib/jalali.ts`).
- **I asked the user to choose (AskUserQuestion) — they interrupted/rejected and have NOT chosen yet.** The two options on the table:
  - **A) Native OS picker** (`@react-native-community/datetimepicker`, already installed) — rock-solid on Android (it's the OS picker), correct validation/timezone, no scroll conflicts; but Android shows a clock/calendar (not a drum) and can't pick in Jalali (would show the chosen date as a Jalali *label* only).
  - **B) Drum via a maintained library** (e.g. `@quidone/react-native-wheel-picker`, Reanimated is now enabled) + my wrapper for hour/minute/date with Jalali on FA — gives the iOS drum look but riskier (can't device-test).
- **Why web works but Android fails:** the custom wheel is a scroll-area inside the form's scroll-area; browsers nest scrollers fine, Android makes them fight and the page wins. PLUS the OTA issue above meant fixes never reached the phone.
- **Next session: get the user's A-vs-B choice, implement it, REBUILD.** My recommendation leaned A (reliability) but user wants the drum look — confirm.

## Timezone requirement (from user)
- Times must sync to the **device system clock**; default/ fallback **GMT+3:30** (Iran). Current code stores a UTC instant (`toISOString`) and displays device-local — correct IF the device tz is right. If the phone still shows a wrong time after rebuild, force +3:30 explicitly (not yet done).

## Activation checklist (Supabase dashboard — status)
- ✅ Migrations run in Supabase: `0001`, `0002`, `0003_login_events.sql`, `0004_add_question_options.sql` (all confirmed run by user).
- ✅ Anonymous sign-ins enabled. ✅ Google provider configured (Google Cloud OAuth client + Supabase Google enabled + Redirect URLs: vercel origin, http://localhost:8081, `themay://auth-callback`; Site URL set to the vercel app). Google login **works**.
- ⚠️ Google app is in **testing** mode → only added **test users** can sign in (user added themselves). "Publish" later for public.
- ⚠️ Email confirmation is OFF (fine for now; turn ON + custom SMTP for production).
- 🔒 The leaked Google **Client Secret** appeared in a screenshot — recommend rotating it (Google Cloud → Clients → reset secret → repaste in Supabase). Not blocking.

## Pending native deps that need the rebuild to activate on phone
All in `package.json` already; baked in only on next build: `@react-native-community/datetimepicker`, `expo-device`, `expo-file-system`, `base64-arraybuffer`, `expo-web-browser`, `react-native-view-shot`, `expo-sharing`, plus the **Reanimated babel plugin** (already in the installed `3dc5923` build) and `react-native-draggable-flatlist`. (`expo-haptics` was removed.)

## Health
- `npm run typecheck`: clean except the 1 known pre-existing error (`MoodBySourceCard.tsx:49`). `npm run lint`: clean.
- Quick OTA reminder: after a build that has `updates.url`, ship JS-only changes with `eas update --branch preview`; native changes (new modules, icon, permissions, babel) need `eas build`.

---

## Completed in Recent Sessions
- Full English / Persian bilingual: `src/i18n/{strings,index}.ts`, `useI18n` hook, every screen routed through `t` / `tv`, RTL via `document.dir` + per-paragraph rules, Profile language toggle, Persian font Samim loaded via runtime-injected `@font-face` + `html[lang='fa'] *` `!important` rule (`app/_layout.tsx`).
- Solar Hijri calendar on the Persian side (`src/lib/jalali.ts`); used in `dayGroup` headers, meal "when" line, profile join date, week-recap range, day-recap header. Gregorian preserved for English.
- All numerals stay Latin 0–9 on both sides (`toFaDigits` / `localizeDigits` are no-ops).
- Insights donuts ("why did I eat", "how am I feeling") and on-path % now summarize **all-time** data, not the current week (`src/hooks/useInsights.ts`). Week-vs-week and 12-week heatmap remain time-windowed by design.
- Badge celebration: banner on Path tab when a new badge is earned, animates in with `Animated`, taps deep-link to `/badges?focus=<id>` and the badge is hoisted to the top + ring-highlighted. First mount silently primes `seenBadgesStore`.
- "Are you sure?" custom-overlay confirmation before deleting a meal (works on both web and native; native `Alert` not used).
- Heart removed from the "the taste" answer (display only — storage key unchanged).
- Meal summary view (`app/meal/[id].tsx`) redesigned with signature orange accent: peach hero card, orange/peach chips, signature-orange EDIT button, rounded-3xl shadows.
- Path-timeline rows (`MealRow`, `ConnectorRow`, `DayEndArrow`) are `direction: 'ltr'`-locked so the time stays on the right in both languages.
- Pitch deck (`C:\Users\RK\Desktop\The_May_Pitch_Deck_FA polished.pptx`) has Vazirmatn applied, RTL set on Persian paragraphs, and AI-related claims rewritten to match what the code actually does (statistical 7-dimension pattern detector; cross-platform Expo, not native; Supabase exists but no calorie DB; Solar Hijri + bilingual highlighted).
- Repo pushed to `main` at https://github.com/avaiii1485/the-may (latest commit `780c59a`). Vercel config in `vercel.json`.
- `CLAUDE.md` added in root (loaded every session).

## Backend / Option A (built 2026-05-24, local — NOT yet pushed or activated)
Decided the data design ("Option A"): Postgres via Supabase; core six questions
stay typed columns on `meals`; a `questions`/`question_options` catalog + `meals.answers`
jsonb cover future/dynamic questions; insights stay live-computed (no aggregates table).
Refactored the app to **local-first with an offline outbox**:
- `supabase/migrations/0001_init.sql` (profiles fleshed out, meals + answers/metadata/
  updated_at/deleted_at, no product CHECKs, FK meals→profiles for portability, RLS,
  meal-photos + avatars buckets, updated_at + handle_new_user triggers) and
  `0002_questions_catalog.sql` (catalog + bilingual seed of the current 6 questions).
  NOTE: legacy root `supabase.sql` is superseded by these migrations.
- `src/lib/uuid.ts` — client-side uuid v4 so local + server ids match.
- `src/stores/outboxStore.ts` — persisted op queue (create/update/delete) with coalescing.
- `src/lib/sync.ts` — drains outbox → Supabase, pushes profile (push-only), pulls + merges
  meals (pending local ops shadow server). `src/hooks/useSyncEngine.ts` triggers it on
  outbox/profile change, online/focus (web), AppState foreground (native), 20s retry.
- `src/hooks/useAuthSession.ts` — anonymous sign-in + onAuthStateChange → authStore.
- Meals + goal are now local-first (`useMeals`/`useProfile` read the local store; writes
  go local + enqueue). `services/meals.ts` is now a remote-only layer; `services/profile.ts`
  gained getProfile/upsertProfile.
- typecheck: only the 1 known pre-existing error (MoodBySourceCard:49) remains; the two
  profile.ts ones are gone. Changed files lint-clean.

## Wheel fixes: scroll, glitch, timezone, size (2026-06-04) — OTA
- **Couldn't scroll (Android):** wheel ScrollView was nested in the form ScrollView with no `nestedScrollEnabled` → outer ate the drag. Added `nestedScrollEnabled`.
- **Glitch / wrong time:** removed per-item tap-to-edit (`onPress` on items) — blocked-scroll drags were registering as taps and opening the edit input. Value now commits only when scrolling fully stops (never mid-drag / never while a finger is down).
- **Timezone:** `DateTimeRow` now stores a UTC instant (`toISOString`, was a mixed local-no-Z string) and displays in device-local time → matches the device clock; cloud round-trip safe. Default/fallback = device now.
- **Smaller:** ITEM_H 40→30, fonts 24/20→17/14, narrower columns.
- Verified wheel wrap-around math + date index + time round-trip via a Node test (26/26). Pure JS → ships via `eas update` (no rebuild).

## Restore native drag-to-reorder via Reanimated (2026-06-03) — ⚠️ REBUILD ONLY
- Re-enabled Reanimated: `babel.config.js` adds `react-native-reanimated/plugin` as the LAST plugin (preset stays `reanimated:false` to control ordering vs css-interop). Restored `DraggableFlatList` in native `InsightsCardList.tsx`.
- **⚠️ MUST ship via `eas build` (rebuild), NOT `eas update`.** OTA-ing this to the pre-Reanimated build re-introduces the Insights crash. After the rebuild installs, future OTAs are safe (Reanimated baked in).
- After rebuild, verify: Insights opens (no crash), long-press a card to drag-reorder, and NativeWind styling still renders correctly (the one compat risk).

## Wheel date/time picker (2026-06-03)
- Replaced the slider DateTimeRow with iOS-style **wheel pickers**: `src/components/capture/Wheel.tsx` (pure-JS ScrollView drum — momentum + manual snap, infinite wrap-around loop via repeated copies + recenter, center highlight band, tap-to-edit numeric, haptic on each value change). `DateTimeRow` = Date wheel (recent days) + Hour (00–23 loop) + Minute (00–59 loop), default device now, keeps seconds.
- **Haptics:** web `navigator.vibrate`; native `expo-haptics` lazily required + guarded → OTA-safe (native haptics activate after the NEXT rebuild; everything else ships via `eas update`).

## Native crash + ordering + date sliders (2026-06-03) — OTA via `eas update`
- **FIXED Insights crash (app exits on native):** root cause = `babel.config.js` has `reanimated: false`, so `react-native-draggable-flatlist` (Reanimated worklets) crashed the native app on the Insights tab. Native `InsightsCardList.tsx` rewritten to a plain ScrollView list (no Reanimated). Web keeps HTML5 drag. (Restoring native drag would need enabling Reanimated + a rebuild.)
- **Same-minute ordering:** `groupMealsByDay` within-day sort now tiebreaks on `createdAt` (full ms) when `eatenAt` ties.
- **Date/time sliders:** `DateTimeRow` rewritten as one universal (web+native) pure-JS component — a date slider + 24h time slider (default device now) with ◀▶ steppers; deleted `DateTimeRow.web.tsx`. Applies to capture-form, text-meal, meal edit. Keeps seconds.
- All pure-JS → deliverable to the installed phone build via `eas update --branch preview` (the build's channel is "preview"), NO rebuild needed. `@react-native-community/datetimepicker` now unused.

## Account data integrity + sync-status (2026-06-02)
- **Claim local/anon meals on sign-in:** `src/lib/mealClaim.ts` `claimLocalMeals(from,to)` re-assigns meals owned by `local-user` or an anonymous uid to the account being signed into (fresh ids, enqueue creates, trigger sync). Called from `auth.tsx` `applyUser()` on signIn/signUp/Google when the previous uid was local-user or anonymous. Covers both the anon→existing-account merge and the local-user→real-account migration. (Meals owned by a different real account are left alone.)
- **Sync-status pill:** `syncStatusStore` (syncing flag set by `syncNow`) + `SyncStatus` component on the Path tab — shows Saving… / Offline / Syncing soon / Synced when signed into a cloud account. i18n en/fa.
- Both OTA-able JS (no new native deps).

## Recap share options: text vs picture-collage + tagline (2026-06-02)
- Tapping "Share your day/week" now opens a `ShareChoice` overlay: **Text only** (existing message) or **With pictures** (captures the recap card — collage + stats + tagline — as a PNG and shares the image). Both append an app tagline (`share.tagline`).
- `src/lib/shareRecap.ts`: `shareText` (web navigator.share/clipboard, native Share) and `shareCardImage` (react-native-view-shot `captureRef` → web navigator.share-with-file/download, native expo-sharing). Image share falls back to text on failure.
- Recap cards wrapped with a ref + `collapsable={false}`; tagline rendered in-card so it's in the captured image. New native deps `react-native-view-shot`, `expo-sharing` → APK rebuild. Also removed the recap `useCallback`s (fixed the two long-standing lint warnings).

## Seconds timestamps + camera flip + RTL recap overflow (2026-06-02)
- **Seconds in timestamps:** `nowIso()` (capture-form, text-meal) no longer zeroes seconds; DateTimeRow (web + native) preserves seconds when editing HH:MM. So same-minute entries order correctly (stored locally + in `eaten_at`). UI still shows HH:MM only.
- **Camera flip:** Capture tab `CameraView` uses a `facing` state with a SwitchCamera button (top-right of the frame) to toggle back/front.
- **RTL recap overflow:** day-recap + week-recap stat rows (and profile stats) now use `flex-1` columns + centered, `adjustsFontSizeToFit`/`numberOfLines={2}` text so long Persian fasting/frequency strings wrap inside the card instead of overflowing.

## Auth: Google + forgot-password + tailored errors (2026-06-02)
- **Tailored errors:** `authErrorKey()` maps Supabase auth errors to specific i18n strings (wrong creds, email taken, not confirmed, invalid email, weak password, rate limit, network, provider-not-enabled, cancelled) + client-side email-format check. Works now, no setup.
- **Forgot password:** `resetPassword()` sends a reset email; PASSWORD_RECOVERY event → `authStore.recovery` → Path opens /auth which shows a "set new password" screen (`updatePassword`). Web-complete; native email-link deep-link is a follow-up. Uses Supabase built-in email (configure SMTP for production).
- **Google sign-in:** `signInWithGoogle()` — web uses `signInWithOAuth` redirect; native uses `expo-web-browser` + PKCE `exchangeCodeForSession`. Client `flowType: 'pkce'`. New native dep `expo-web-browser` → APK rebuild.
  - **REQUIRES dashboard setup (user):** Supabase → Auth → Providers → enable **Google** with a Google Cloud OAuth Client ID/Secret; and Auth → URL Configuration → add Redirect URLs (Vercel origin, http://localhost:8081, and the native `themay://` callback). Until then the Google button shows "not enabled yet".

## Multi-device profile sync + native photo-upload fix (2026-06-02)
- **Full two-way profile sync:** server is source of truth; a device adopts the account profile on pull unless it has unsaved edits (`profileStore.dirty`); editing pushes + clears dirty. Avatar now uploads to the `avatars` bucket (`uploadAvatar`) and syncs as a URL; join date = account `created_at`; name/handle/bio/phone sync. Periodic `syncNow` (~20s) + focus/foreground so open devices catch up. profile.tsx form guards against background-sync clobbering in-progress edits. `profileStore` bumped to `-v2` (added dirty; partialize excludes dirty). `services/profile.ts` upsertProfile now takes a partial patch (settings-only vs full) and getProfile returns avatarUrl + createdAt. Settings push de-duped via `lastPushedSettings`.
- **🐞 Mobile→web sync bug FIXED (root cause):** `uploadMealPhoto`/`uploadAvatar` used `fetch(uri).blob()`, which fails on React Native for `file://` camera URIs (empty/failed blob) → the photo upload threw → the meal row (photo AND its Q&A) never inserted → web never saw mobile photo meals (web→mobile worked since web URIs are data:/blob:). Fix: platform-aware `readUpload` — web uses fetch/blob; native reads base64 via `expo-file-system` and uploads an ArrayBuffer (`base64-arraybuffer`). New native dep `expo-file-system` → needs an APK rebuild.

## UI/UX batch (2026-06-01)
- **Sage green** (`#7FA37B`) replaces the brand blue (`#1FB6E5`) app-wide (bubble.active, accent.blue, donut/badge palettes, chevrons).
- **Creamy theme:** soft cream app bg (`cream` token `#FCF6EE`) on all main screens; warm off-white cards (`bg.card` `#FFFCF7`); tab bar warm surface + orange active tint.
- **Interactive donuts:** tapping a legend item or slice updates the center %/label/color (`DonutInsightCard`).
- **In-app live camera:** Capture tab shows a live `expo-camera` `CameraView` inside the square frame; round button is the shutter; camera pauses when tab unfocused. (expo-camera was already a native dep.)
- **New answer options:** how_was_it +"Bad", where_eat +"Outside" (types, QUESTIONS/fallback, Zod, i18n en/fa, and DB catalog via `0004_add_question_options.sql` — RUN THIS in Supabase).
- **Persian fixes:** `ins.myGoal` → «تمرکز فعلی»; card adornment icons + PatternCard accent bar use direction-aware physical margins (logical `marginEnd` wasn't flipping under react-native-web); pink accent bar → orange (`#F39C3D`); meatball dropdown anchors to the correct side in RTL (left).
- All OTA-able JS; ride the next APK build.

## APK / mobile release — Phase 1 ready (2026-05-26, awaiting icon)
- EAS CLI v20 installed; Expo account `ava8y` linked; project id `8110698b-35bf-4179-b4e7-de5b4decf364` (https://expo.dev/accounts/ava8y/projects/the-may).
- `expo-updates ~0.25.28` added so the first APK can receive OTA updates (critical: must be in the first build).
- `eas.json` with `development` / `preview` (APK) / `production` (AAB) profiles.
- `app.json`: `runtimeVersion.policy = "sdkVersion"`, `extra.eas.projectId`, Android permissions auto-added (camera + record_audio).
- EAS env vars set sensitive on all 3 environments: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **⏳ Blocker before first build:** 1024×1024 app icon + Android adaptive icon (foreground + bg color) + splash image. User to provide artwork.
- **Then:** `eas build -p android --profile preview` → ~10–15 min cloud build → APK install link.
- **Ongoing:** code/UI changes ship via `eas update` (OTA, ~2 min); native changes require a new build.

## Iran reachability (planned UX improvement)
Supabase (`*.supabase.co` on AWS) is blocked in Iran without a VPN. The offline-first part of the app works fully without internet; only cloud features (auth/sync/photo upload) fail without VPN. **Planned:** detect Supabase unreachable and silently keep the user in offline/anonymous mode — don't show the "Create account" gate that just errors. A "Sign in / Create account" button in Profile still lets them try on VPN. Longer term options: self-host Supabase on a VPS reachable from Iran, or proxy via a custom domain.

## In progress — native bug-fix + telemetry batch (awaiting one APK rebuild)
Two native-module changes batched into the next `eas build`:
- **Date/time picker fix:** native `DateTimeRow.tsx` rewritten to use `@react-native-community/datetimepicker` (tap Date/Time → native dialog). The old free-text TextInputs reformatted on every keystroke (parsed ISO → NaN), so manual date/time entry was impossible on Android. Web variant unchanged.
- **Login telemetry:** migration `0003_login_events.sql` adds `profiles.email` (mirror) + a `login_events` table (one row per sign_in/sign_up with platform, os_version, device_name, model_name, app_version, user_agent; RLS own-rows). `services/loginEvents.ts` gathers device info (expo-device + expo-constants + web UA) and inserts on signIn/signUp; also mirrors email to profiles. **Passwords are NOT stored** (declined — Supabase already hashes them; plaintext is a security risk with no use).
- New native deps: `@react-native-community/datetimepicker@8.0.1`, `expo-device@~6.0.2` → require an APK rebuild to take effect on phones.

**To activate:** (1) run `0003_login_events.sql` in Supabase SQL editor; (2) `eas build -p android --profile preview` + reinstall.

### Insights-tab changes (2026-05-26, OTA-able JS — ride the next APK build)
- **Meatball menu:** CollapsibleCard dots are now horizontal (`MoreHorizontal`); Pin/Unpin is a compact floating dropdown (top-right, tap-outside to dismiss) instead of the inline panel.
- **Drag-and-drop sorting:** insights cards render via `react-native-draggable-flatlist` (JS-only, on reanimated+gesture-handler). Long-press a card title to drag; tap still expands. Order persists in `pinnedInsightsStore` (bumped to `-v2`, added `order: string[]` + `setOrder`; pin hoists to front) and syncs to the account via `prefs.insightOrder` (pushProfile pushes it; pullProfile adopts cloud order when local order is empty). ⚠️ Web drag is best-effort via draggable-flatlist — verify the Insights tab still renders on web before pushing live.
- **Recaps are dialogs:** day-recap + week-recap use `presentation: 'transparentModal'` + centered card on a dimmed tap-to-dismiss backdrop (maxHeight 88%, internal scroll) instead of full-screen.
- **Farsi "why" insight wording:** patternDetector `why` template → «وقتی دلیل غذا خوردنت رو X انتخاب کردی...».

### Bug fixes (2026-05-26, OTA-able JS — also ride the next APK build)
- **Farsi "why I ate" donut legend** now translates option labels via `tv('opt', …)` (was showing raw English). Other insight cards already translated.
- **Blank-meals-on-new-device root cause:** `syncNow` ran push→pull in one try block, so a failing `pushProfile` skipped `pullMeals` → fresh-device login showed nothing. Rewrote: each phase isolated (`runPhase`), and **pull before push**. Added `pullProfile` (adopt cloud values where local is empty/default) so a new device picks up name/goal instead of overwriting cloud with blanks. NOTE: this fixes the case where meals ARE in the cloud under the account id. The separate "log into a *different existing* account from anonymous → orphaned meals" gap (merge-on-signup) is still unbuilt.

## Live now (2026-05-26)
- **Pushed & deployed:** Supabase backend + local-first sync + offline outbox + question catalog are live on Vercel (env vars set, redeployed, verified end-to-end on the live site).
- **Email+password auth shipped:** real accounts on top of the anonymous base. `/auth` is a real navigation screen (app/auth.tsx) — sign up (converts the current anonymous user in place, keeping meals), log in, log out (local-scope, with confirm). Anonymous-first: the screen invites sign-in on launch with "Skip for now"; anonymous accounts are created ONLY on explicit skip (no junk-account-on-reload). `useAuthSession` no longer auto-creates anon users; `authStore.initialized` prevents a gate flash. Profile has an Account section. Verified: create-while-anon keeps data, cross-device login pulls data, logout/login reuses same account, offline→online sync intact.

### Known auth limitations (not bugs)
- Logging into a *different existing* account from an anonymous session does NOT merge the anonymous meals (merge is planned — item #2 of the offline+accounts track).
- Email confirmation is OFF (turn ON for production; would add a "check your inbox" step).
- `authStore.isAnonymous` is currently set-but-unused (kept for the planned multi-device work).

## Resume / next session
1. **Backend polish:** avatar→Storage upload, multi-device profile pull/merge, one-time `local-user`→real-uid meal migration.
2. **Offline+accounts track:** merge-anonymous-data-on-signup, IndexedDB/SQLite for photos, conflict handling, sync-status UI, other login methods (Google/magic-link).
3. **Layer 2 dynamic questions:** new questions stored in `meals.answers` jsonb + DB-driven label renaming.

## (Earlier) In Progress — RESUME HERE next session (2026-05-25)
Backend is **live and fully tested locally** against a real Supabase project
(ref `lobvpaqhgephjyeiupng`): migrations run, Anonymous sign-ins enabled,
`.env.local` set (gitignored). Verified end-to-end: anon sign-in, meal create/
edit/delete sync, photo upload to Storage, offline→online outbox drain, and the
catalog-driven forms (Test A/B/C all passed). Catalog Layer 1 done.

**NOT pushed.** This work is committed **locally only** — GitHub `main` and the
Vercel live site are still on the old (pre-backend) code and have no DB.

Next session, in order:
1. **Decide `supabase.sql`** — recommend deleting it (superseded by `supabase/migrations/0001+0002`); left in place pending the user's call.
2. **Push & go live:** push to GitHub `main`, add `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` in Vercel env vars, redeploy. (Only on the user's explicit go-ahead.)
3. **Backend polish:** avatar→Storage upload, multi-device profile pull/merge, one-time `local-user`→real-uid meal migration, and Layer 2 (dynamic questions in `meals.answers`).

⚠️ Security reminder: the `sb_secret_…` key was pasted into chat during setup — confirm it was rotated in Supabase (Settings → API Keys). It's NOT used by the app and NOT in the repo.

## Next Steps
1. **Photo storage robustness** (user deferred): web build keeps `data:` URI photos in the persisted Zustand store → `localStorage` quota (~5 MB) caps users at ~5 photo meals. Pick one:
   - Cheap mitigation: downscale + re-encode on the picker output (~600px / JPEG 0.6) and wrap `webStorage.setItem` in `try/catch` to surface `QuotaExceededError` instead of silently losing writes.
   - Proper fix: wire Supabase Storage (already built — set `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, run `supabase.sql` once, photos go to the `meal-photos` bucket).
2. Optional: a true Jalali date/time picker on the Persian side (today the picker stays Gregorian — only displayed dates are Jalali).
3. Optional: address the remaining known TS error (`MoodBySourceCard.tsx:49`) — the two `services/profile.ts` ones are now resolved. Doesn't block runtime/Vercel.

### Planned track: full offline-first + cross-device accounts (discuss details when we start)
The app is already offline-first (local store + outbox + opportunistic sync). To
complete the "use offline, log in anywhere, data follows your account" vision:
1. **Real login** (email magic-link recommended) on top of the anonymous base — unlocks cross-device.
2. **Claim anonymous data on signup** so early anonymous users keep their meals.
3. **Profile two-way sync** (currently push-only) so settings follow the account.
4. **Local storage capacity:** web photos → IndexedDB (localStorage ~5 MB cap); native → SQLite if histories get large.
5. **Conflict handling:** last-write-wins via `updated_at` for same-meal edits on two devices.
6. **Sync-status UI:** "Synced / Saving… / Offline" indicator for user trust.
Note: DB schema needs **no changes** — Option A (user_id everywhere, soft delete, updated_at, RLS) already fits. Open question: allow anonymous start + optional later signup, or require login up front?

### Backend follow-ups (after activation)
- ✅ DONE (2026-05-25) — Catalog wired into capture + edit forms (Layer 1): `useQuestions` (`src/hooks/useQuestions.ts`) loads the catalog via `src/services/questions.ts`, falls back to `FALLBACK_QUESTIONS` offline; `src/components/capture/CatalogReflection.tsx` renders sections from it; `src/lib/questionFields.ts` maps core keys→fields. Catalog drives structure (set/order/type/options/active); labels still via i18n `tv()`. **Layer 2 (not done):** brand-new dynamic questions stored in `meals.answers` jsonb + DB-driven label renaming.
- Avatar → `avatars` Storage upload (profile sync skips avatar today to avoid base64 bloat in the row).
- Multi-device profile **pull/merge** (profile sync is push-only today).
- One-time migration of existing `local-user` meals to the real uid on first sign-in.
- Optional: realtime subscription on `meals` (publication already declared).
4. Optional: fill in the pitch deck's placeholders — team names, contact info, requested funding amount, financial-projection numbers.

## Open Questions / Blockers
- Should `DateTimeRow` become a Jalali picker on the Persian side, or is Gregorian-only acceptable for input?
- Does the user want to wire up a real Supabase project now, or keep running on the local fallback?
- Pitch deck font: deck currently uses Vazirmatn; app uses Samim. Keep them different, or switch deck to Samim for brand consistency?
- Premium / B2B revenue paths shown in the deck (Slide 9) are aspirational only — no payment SDK is integrated. Confirm whether to leave them as roadmap or remove until built.

## Recent Decisions
- **Numerals Western on both sides.** Persian digits inside the dictionary and dynamic generators were replaced; `toFaDigits` is now a no-op. (User: "change the numbers on all pages back to english numbers".)
- **Persian date order = day then month** ("22 اردیبهشت"). My earlier swap to month-first was wrong and was reverted.
- **Path timeline locked LTR even in Persian** so the meal-time column stays on the right, mirroring the English layout. (User-requested.)
- **Pattern detector is statistical, not ML.** This is stated explicitly in `CLAUDE.md` and reflected in the polished pitch deck — earlier "هوش مصنوعی" claims were replaced with "موتورِ الگویاب".
- **Insights data scope**: per-week made several cards feel empty for new users, so the donuts and on-path % moved to all-time. Week-vs-week and the 12-week heatmap are *intentionally* time-windowed because that is their whole point.
- **Badge celebration UX**: existing earned badges on first run are silently primed into `seenBadgesStore` to avoid a flood of banners; only genuinely new unlocks celebrate.
- **Delete confirmation uses a custom overlay**, not `Alert.alert`, because the latter is unreliable across RN-Web and native and would break i18n.
- **Persian font loads via runtime `<style>` injection in `<head>`** rather than CSS `@import` (build pipeline strips remote `@import`) and uses a universal `!important` rule (otherwise react-native-web's per-`<Text>` `font-family` wins the cascade and the font file is never requested).
