# PROGRESS.md

## Last Updated
2026-05-24

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

## In Progress — RESUME HERE next session (2026-05-25)
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
