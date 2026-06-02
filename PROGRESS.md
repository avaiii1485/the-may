# PROGRESS.md

## Last Updated
2026-05-26

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
