# The May — mindful eating

Light-weight mindful-eating app inspired by Atemate. Three tabs:

- **Path** — vertical timeline of today's meals. On-path meals sit centered on the orange path; off-path meals shift to the left like a detour.
- **Insights** — 7-day overview, on-path %, donut breakdowns of *why I ate* and *how I felt*.
- **Capture** — photo or text-only meal logging, then a reflection sheet of bubble Q&As, finished by saving as **on-path** or **off-path**.

## Stack

TypeScript (strict), Expo + Expo Router with typed routes, React Native Web, NativeWind (Tailwind), Tamagui, lucide-react-native, Zustand, TanStack Query, React Hook Form + Zod, Supabase (Postgres / Auth / Storage / Realtime), `react-native-svg` for charts.

Architecture: frontend ↔ backend is fully decoupled. Components call typed hooks under `src/hooks` which go through service functions in `src/services`. Service functions are the only place that touches Supabase.

## Run it

```bash
npm install
npm run web
```

Open the URL Expo prints (usually http://localhost:8081).

The app **runs without Supabase**: when no env vars are set, it falls back to a localStorage-backed Zustand store so you can still log meals, take photos via the file picker, and see the timeline + insights end-to-end on the web.

## Wire up Supabase (optional)

1. Create a Supabase project.
2. Copy the project URL and anon key into `.env.local`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
3. Open the Supabase SQL editor and run `supabase.sql` (creates tables, triggers, RLS, storage bucket, and realtime publication).
4. Restart `npm run web`. The app will now persist to Postgres and upload photos to the `meal-photos` bucket using signed URLs.

## Project layout

```
app/                       Expo Router routes
  _layout.tsx              Providers (Tamagui, QueryClient, GestureHandler, SafeArea)
  (tabs)/_layout.tsx       Bottom tab bar — Path | Insights | Capture
  (tabs)/index.tsx         Path tab
  (tabs)/insights.tsx      Insights tab
  (tabs)/capture.tsx       Capture tab (camera UI)
  capture-form.tsx         Reflection form (modal)
  settings.tsx             Goal editor (modal)

src/
  components/              Reusable UI
    icons/                 PathSquiggle, On/Off-path arrows
    path/                  PathHeader, MealNode, PathConnector, DayRecap
    capture/               BubblePill, FeelingRow, ReflectionSection, SaveAsBar
    insights/              DonutChart, BarChart, ProgressBar
  features/                (placeholder for future feature-specific logic)
  services/                Typed API layer (meals, profile, storage)
  hooks/                   useMeals, useProfile, useInsights — TanStack Query
  stores/                  Zustand: capture draft, local meals fallback, auth
  schemas/                 Zod schemas (meal draft, profile)
  lib/                     supabase client, queryClient, time helpers
  types/                   database.types.ts, meal.ts
```

## Notes on web vs. native

- On web, the Capture tab's "shutter" button opens the file/photo picker (browsers do not expose a system camera UI inside an SPA). The same screen would show a live camera preview on iOS/Android.
- All photo handling uses `expo-image-picker`, which works on both platforms.

## Scripts

- `npm run web` — start the Expo dev server with web bundling
- `npm start` — Expo dev server, choose target
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run format` — Prettier
