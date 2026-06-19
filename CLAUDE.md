# CLAUDE.md

## Communication

- Start every response to the user with their name (Ava), e.g. "Ava, …".

## Project Overview

**The May** — a mindful-eating app. Users log meals (photo or text-only) with short reflection Q&As, mark each as on-path or off-path against a chosen "focus", and see their patterns surfaced as insights. Three tabs: **Path** (orange timeline), **Capture** (logging), **Insights** (analytics). Bilingual English / فارسی with full RTL.

## Tech Stack

- **Language**: TypeScript (strict mode; `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`). No JavaScript files.
- **Framework**: Expo (SDK 51) + Expo Router (file-based routing, typed routes). Targets web (React Native Web) + iOS + Android from one codebase.
- **Styling**: NativeWind v4 (Tailwind CSS via className). Tamagui is wired but used minimally.
- **State**:
  - Server state / cache: **TanStack Query**.
  - Client state: **Zustand** stores under `src/stores/` (persisted via AsyncStorage on native, `localStorage` on web).
- **Forms / validation**: React Hook Form + Zod.
- **Backend (optional)**: **Supabase** — Postgres + Auth + Storage + Realtime. Schema + RLS in `supabase.sql`. App works fully without it via a localStorage fallback.
- **Charts / icons**: `react-native-svg` for custom charts; `lucide-react-native` for icons.
- **Images**: `expo-image` renders meal photos (memory+disk cache, downsampling); `expo-image-manipulator` downscales + re-encodes uploads to JPEG. Both are native modules (need a build, not OTA).
- **i18n**: in-house, under `src/i18n/`.
- **Tooling**: ESLint, Prettier, `tsc --noEmit` for typecheck.

## Project Structure

```
app/                      Expo Router routes (file-based)
  _layout.tsx             Root providers + Stack registry + RTL/font wiring
  (tabs)/                 Bottom-tab routes: index (Path), insights, capture
  capture-form.tsx        Reflection form modal
  text-meal.tsx           Text-only meal entry modal
  meal/[id].tsx           Read-only meal summary
  meal/edit/[id].tsx      Editable reflection form
  day-recap/[date].tsx    Day recap modal
  week-recap.tsx          Week recap modal
  badges.tsx              Badges list (accepts ?focus= deep link)
  profile.tsx             Profile + language switch
  settings.tsx            Focus / goal picker

src/
  components/             Reusable UI, grouped by feature
    common/               CollapsibleCard, Avatar, LoadingOverlay
    capture/              BubblePill, ReflectionSection, DateTimeRow (+ .web.tsx)
    path/                 PathHeader, MealRow, ConnectorRow, DayEndArrow, DaySection,
                          DayRecap, DayHeader, EmptyDayPlaceholder, BadgeCelebration
    insights/             CalendarHeatmap, PatternCard, WeekDelta, SplitBarCard,
                          MoodBySourceCard, FastingCounter, TodaysExperiment, DonutChart,
                          BarChart, ProgressBar
    recap/                CollageTile, DayCollage
    profile/              BadgeIcon, BadgeStrip
    icons/                PathSquiggle, OnPathArrow, OffPathArrow
  services/               Typed Supabase service functions (meals, profile, storage).
                          **Only place that imports the supabase client.**
  hooks/                  TanStack Query wrappers around services (useMeals, useProfile,
                          useInsights, etc.). Components call these — never services
                          directly.
  stores/                 Zustand stores: captureDraftStore, localMealsStore,
                          profileStore, languageStore, pinnedInsightsStore,
                          seenBadgesStore, authStore, pathScrollStore
  schemas/                Zod schemas
  lib/                    supabase client, queryClient, time helpers, dayGroup,
                          patternDetector, todaysExperiment, weekCompare, jalali,
                          badges, exportData
  i18n/                   strings.ts (en/fa dictionary), index.ts (useI18n hook)
  types/                  Shared TS types (Meal, FeelingLevel, QUESTIONS, database.types)

global.css                Tailwind directives + base resets
tailwind.config.js        Design tokens (path / ink / bubble / accent colors)
supabase.sql              Schema + RLS + storage bucket + realtime
vercel.json               Static web build config (`expo export --platform web` -> dist/)
```

## Coding Conventions

- **TypeScript strict**: no `any`, no `@ts-ignore`. Both are ESLint errors.
- **React Native primitives only** in shared components: `View`, `Text`, `Pressable`, `ScrollView`, `Image`, `TextInput`. Don't use HTML elements directly (the `.web.tsx` platform-extension pattern is the exception when web-only behavior is needed).
- **Styling**:
  - Prefer Tailwind via `className` for layout/visual.
  - Use logical-direction spacing (`marginEnd`, `paddingStart`, `ms-*`/`me-*`) where layouts must mirror in RTL. Avoid `marginLeft`/`marginRight` in user-direction-sensitive places.
  - Path/timeline rows are intentionally LTR-locked (see Gotchas).
- **Components**: functional, named exports. File names match the exported symbol (`PascalCase.tsx`). One component per file unless they're tightly coupled.
- **Data access layering** (strict):
  - Components → `useXxx` hook (TanStack Query) → service function → Supabase client.
  - Never call `supabase` directly outside `src/services/`.
  - Never call services directly from a component — always through a hook.
- **Persisted Zustand stores** live in `src/stores/`. Use `createJSONStorage` + the existing `webStorage`/`AsyncStorage` pattern. Bump the `name:` (e.g. `-v2`) if you change the schema in a breaking way.
- **i18n is mandatory** for user-visible strings:
  - Add the English + Persian entry to `src/i18n/strings.ts`.
  - Render with `const { t } = useI18n(); t('key')`. For dynamic option values use `tv('opt', value)`.
  - For dynamic sentences in `lib/` (pattern detector, today's experiment, week compare), use `tStatic` / `tvStatic` and branch on `lang`.
  - Storage keys (e.g. meal field values like `'Hungry'`, `'TV'`) stay English. Only the **displayed** label is translated via `tv('opt', value)`.
- **No comments unless the why is non-obvious.** Don't restate what the code does. Don't reference past tasks or PRs in comments.
- **No new docs files** unless explicitly asked. README and this file are the only docs that live in the repo.

## Important Commands

```bash
npm install                # one-time setup
npm run web                # Expo dev server with web target (default port 8081)
npm start                  # Expo dev server, choose target interactively
npm run typecheck          # tsc --noEmit
npm run lint               # ESLint
npm run format             # Prettier
```

Build for production (used by Vercel via `vercel.json`):

```bash
npx expo export --platform web   # outputs to dist/
```

## Architecture Decisions

- **Frontend and backend are fully decoupled.** Supabase (or any backend) is reachable only through the typed service functions in `src/services/`. The app must keep working end-to-end without Supabase configured — `localMealsStore` is the fallback, transparently switched on when `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are absent.
- **Optimistic updates everywhere** that mutate user-visible lists (e.g. `useCreateMeal` writes the meal into the TanStack Query cache in `onMutate`, then reconciles with the server result in `onSuccess`). This is what makes the Path tab feel instant.
- **Internationalization is a first-class concern.** Every screen reads strings through `useI18n`. The root layout sets `document.lang` / `document.dir` and injects the Persian font + a forced `font-family … !important` rule on `lang='fa'` (see Gotchas).
- **Solar Hijri (Jalali) calendar** is used for all displayed dates on the Persian side via `src/lib/jalali.ts`. Date/time **pickers** (native HTML `<input type="date">`) remain Gregorian.
- **Numerals stay Western (0–9)** on both sides — `toFaDigits` / `localizeDigits` in `src/i18n/index.ts` are intentional no-ops.
- **Pattern detector is statistical, not ML.** The "Your top insight" card is `src/lib/patternDetector.ts` — it cross-tabs on-path rate against seven dimensions (where, with, how-made, why, day-of-week, time-of-day, after-feel) and ranks by `deviation × √n`. There is no AI/ML in the codebase.
- **NativeWind v4 dark mode is class-based**, not media-based (`darkMode: 'class'` in `tailwind.config.js`). The app is light-mode only; this setting exists to avoid a runtime throw from `react-native-css-interop` (see Gotchas).
- **Supabase Storage** for photos is the production path. The local fallback keeps the picked `data:` URI in the meals store, which works for demos but hits `localStorage` quota quickly — production deploys must wire Supabase.
- **Meal photos are optimized on the way in and on render.** Uploads are downscaled to ~1000px / JPEG q0.7 in `services/storage.ts` (`shrink()`), and the Path timeline renders them via `expo-image` with `cachePolicy="memory-disk"`. Stored signed URLs are long-lived (1-yr TTL) so the cache stays valid. Existing pre-optimization photos stay full-res on the server (free-tier Supabase has no image transform); they're only slow on first view, then cached.

## Gotchas / Things to Watch Out For

- **NativeWind/Tailwind strips remote `@import url(...)`** from `global.css`. To load a webfont, declare `@font-face` rules **directly** in CSS or, more reliably, inject them into `<head>` at runtime (this is how the Persian Samim font is loaded — see `app/_layout.tsx`).
- **`react-native-web` sets `font-family` on every `<Text>` element**, which beats inherited body-level font rules. To force a custom font, use a `!important` rule with a universal selector (e.g. `html[lang='fa'] * { font-family:'Samim' … !important }`). Done in `_layout.tsx` for Persian.
- **`react-native-css-interop` throws "Cannot manually set color scheme"** if `darkMode` is not `class`. The Tailwind config sets `darkMode: 'class'` and `global.css` sets `--css-interop-darkMode: class dark` to lock this in. Don't change it.
- **The Path-tab timeline rows are wrapped in `direction: 'ltr'`** (in `MealRow`, `ConnectorRow`, `DayEndArrow`). This is intentional — the user wants the meal time on the right and the on/off-path detour pointing left, on both languages. Don't remove this.
- **`localStorage` quota (~5 MB)** is easy to hit when photos are stored as `data:` URIs in the local fallback (the picker on web returns base64 data URIs with `allowsEditing`). Production must use Supabase Storage. Be careful adding more photo-heavy fields to the persisted Zustand store.
- **Three pre-existing TypeScript errors** are known and out of scope:
  - `src/components/insights/MoodBySourceCard.tsx:49` — `reduce` callback type
  - `src/services/profile.ts:14` and `:24` — Supabase null-typed-client issues
  These do not block runtime or the Vercel build (Metro/`expo export` doesn't run `tsc`). Don't introduce new ones; don't bother fixing these unless asked.
- **Dev-server port collisions on Windows** are common (orphaned `node` processes hold the port after Expo crashes). If the server can't bind, kill the listener on that port before retrying.
- **Photo URIs from `expo-image-picker` on web are `data:` URIs (base64)**, not `blob:` URLs, because `allowsEditing: true` triggers the cropper which outputs base64. Plan storage and quota accordingly.
- **English option values are the canonical keys.** Stored fields like `meal.whereEat = ['Table']` always hold the English string. The display layer translates via `tv('opt', value)`. Never persist translated values.
