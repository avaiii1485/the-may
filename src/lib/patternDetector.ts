import { toFaDigits, tvStatic } from '@/i18n';
import type { Lang } from '@/stores/languageStore';
import type { Meal } from '@/types/meal';

const DOW_FA = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'] as const;
const TOD_FA: Record<string, string> = {
  'in the morning': 'صبح‌ها',
  'in the afternoon': 'بعدازظهرها',
  'in the evening': 'عصرها',
  'late at night': 'آخر شب',
};
const CAT_FA: Record<string, string> = {
  'Where you eat': 'کجا غذا می‌خوری',
  'Who you eat with': 'با کی غذا می‌خوری',
  'How meals are made': 'روش تهیه',
  'Why you eat': 'چرا غذا می‌خوری',
  'Day of the week': 'روز هفته',
  'Time of day': 'ساعتِ روز',
  'How meals made you feel': 'حسِ بعد از غذا',
};
function faCategory(en: string): string {
  return CAT_FA[en] ?? en;
}

export interface Insight {
  /** A complete, user-facing sentence */
  text: string;
  /** Short subtitle / category label */
  category: string;
  /** Direction relative to user's average */
  direction: 'on' | 'off';
  /** Percentage value for the highlighted segment */
  pct: number;
  /** Number of meals supporting this insight */
  count: number;
  /** Sort key — combines deviation magnitude with sample size */
  impact: number;
}

const MIN_TOTAL_MEALS = 5;
const MIN_BUCKET_COUNT = 3;
const MIN_DEVIATION = 0.12; // 12 percentage points away from overall mean

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

interface Bucket {
  count: number;
  onPath: number;
}

function aggregateBy<T>(
  meals: Meal[],
  keyFn: (m: Meal) => T | T[] | null,
): Map<T, Bucket> {
  const map = new Map<T, Bucket>();
  for (const m of meals) {
    const k = keyFn(m);
    const keys: T[] = k === null ? [] : Array.isArray(k) ? k : [k];
    for (const key of keys) {
      const cur = map.get(key) ?? { count: 0, onPath: 0 };
      cur.count += 1;
      if (m.onPath) cur.onPath += 1;
      map.set(key, cur);
    }
  }
  return map;
}

function pluralize(word: string): string {
  if (/[sxz]$/.test(word) || /(ch|sh)$/.test(word)) return word + 'es';
  return word + 's';
}

function lowercaseFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function timeBucket(hour: number): { key: string; label: string } {
  if (hour >= 5 && hour < 12) return { key: 'morning', label: 'in the morning' };
  if (hour >= 12 && hour < 17) return { key: 'afternoon', label: 'in the afternoon' };
  if (hour >= 17 && hour < 22) return { key: 'evening', label: 'in the evening' };
  return { key: 'late-night', label: 'late at night' };
}

type Dim = 'where' | 'with' | 'made' | 'why' | 'dow' | 'tod' | 'feel' | 'after';

function buildSentence(
  pct: number,
  overall: number,
  count: number,
  dimension: Dim,
  value: string,
  lang: Lang,
): { text: string; direction: 'on' | 'off' } {
  const percent = Math.round(pct * 100);
  const direction: 'on' | 'off' = pct >= overall ? 'on' : 'off';

  if (lang === 'fa') {
    const shownFa = toFaDigits(direction === 'on' ? percent : 100 - percent);
    const wordFa = direction === 'on' ? 'روی مسیر' : 'خارج از مسیر';
    const cFa = `(${toFaDigits(count)} وعده)`;
    const optFa = (): string => tvStatic('fa', 'opt', value);
    let body: string;
    switch (dimension) {
      case 'where':
        body = `${shownFa}٪ از وعده‌هایی که ${optFa()} خوردی ${wordFa} بود`;
        break;
      case 'with':
        body =
          value === 'By myself'
            ? `${shownFa}٪ از وعده‌هایی که تنها خوردی ${wordFa} بود`
            : `${shownFa}٪ از وعده‌هایت با ${optFa()} ${wordFa} بود`;
        break;
      case 'made':
        body = `${shownFa}٪ از وعده‌های ${optFa()} ${wordFa} بود`;
        break;
      case 'why':
        body = `وقتی دلیل غذا خوردنت رو «${optFa()}» انتخاب کردی، ${shownFa}٪ مواقع ${wordFa} بودی`;
        break;
      case 'dow': {
        const idx = DAY_NAMES.indexOf(value as (typeof DAY_NAMES)[number]);
        const wd = idx >= 0 ? DOW_FA[idx] : value;
        body =
          direction === 'on'
            ? `${wd}‌ها بهترین روزِ توست — ${shownFa}٪ ${wordFa}`
            : `${wd}‌ها روزهای سخت‌تری‌اند — ${shownFa}٪ ${wordFa}`;
        break;
      }
      case 'tod':
        body = `${shownFa}٪ از وعده‌های ${TOD_FA[value] ?? value} ${wordFa} بود`;
        break;
      case 'after':
        body = `${shownFa}٪ از وعده‌هایی که حسِ «${optFa()}» داد ${wordFa} بود`;
        break;
      case 'feel':
        body = `${shownFa}٪ از وعده‌هایی که حس ${value} داشتی ${wordFa} بود`;
        break;
    }
    return { text: `${body}. ${cFa}`, direction };
  }

  const word = direction === 'on' ? 'on-path' : 'off-path';
  const shown = direction === 'on' ? percent : 100 - percent;
  const verb = direction === 'on' ? "you're" : 'you go';
  const cMeals = `${count} ${count === 1 ? 'meal' : 'meals'}`;
  switch (dimension) {
    case 'where':
      return {
        text: `${shown}% of meals you ate at ${lowercaseFirst(value)} were ${word}. (${cMeals})`,
        direction,
      };
    case 'with':
      return {
        text:
          value === 'By myself'
            ? `${shown}% of meals eaten by yourself were ${word}. (${cMeals})`
            : `${shown}% of meals with ${lowercaseFirst(value)} were ${word}. (${cMeals})`,
        direction,
      };
    case 'made':
      return {
        text: `${shown}% of ${lowercaseFirst(value)} meals were ${word}. (${cMeals})`,
        direction,
      };
    case 'why':
      return {
        text: `When you ate because of "${lowercaseFirst(value)}", ${verb} ${word} ${shown}% of the time. (${cMeals})`,
        direction,
      };
    case 'dow':
      return {
        text: `${pluralize(value)} are your ${direction === 'on' ? 'best' : 'toughest'} day — ${shown}% ${word}. (${cMeals})`,
        direction,
      };
    case 'tod':
      return {
        text: `${shown}% of meals ${value} were ${word}. (${cMeals})`,
        direction,
      };
    case 'after':
      return {
        text: `${shown}% of meals that left you feeling "${lowercaseFirst(value)}" were ${word}. (${cMeals})`,
        direction,
      };
    case 'feel':
      return {
        text: `${shown}% of meals when you felt ${value} were ${word}. (${cMeals})`,
        direction,
      };
  }
}

export function detectInsights(meals: Meal[], lang: Lang = 'en'): Insight[] {
  if (meals.length < MIN_TOTAL_MEALS) return [];
  const overall = meals.filter((m) => m.onPath).length / meals.length;
  const out: Insight[] = [];

  const consider = (
    bucket: Bucket,
    dimension: Dim,
    value: string,
    categoryLabel: string,
  ) => {
    if (bucket.count < MIN_BUCKET_COUNT) return;
    const pct = bucket.onPath / bucket.count;
    const deviation = Math.abs(pct - overall);
    if (deviation < MIN_DEVIATION) return;
    const { text, direction } = buildSentence(pct, overall, bucket.count, dimension, value, lang);
    const impact = deviation * Math.sqrt(bucket.count);
    out.push({
      text,
      category: lang === 'fa' ? faCategory(categoryLabel) : categoryLabel,
      direction,
      pct,
      count: bucket.count,
      impact,
    });
  };

  // Where you ate
  for (const [k, v] of aggregateBy(meals, (m) => m.whereEat)) {
    consider(v, 'where', k, 'Where you eat');
  }
  // Who you ate with
  for (const [k, v] of aggregateBy(meals, (m) => m.ateWith)) {
    consider(v, 'with', k, 'Who you eat with');
  }
  // How it was made
  for (const [k, v] of aggregateBy(meals, (m) => (m.howMade ? m.howMade : null))) {
    consider(v, 'made', k, 'How meals are made');
  }
  // Why you ate
  for (const [k, v] of aggregateBy(meals, (m) => m.whyEat)) {
    consider(v, 'why', k, 'Why you eat');
  }
  // Day of week
  for (const [k, v] of aggregateBy(meals, (m) => new Date(m.eatenAt).getDay())) {
    consider(v, 'dow', DAY_NAMES[k] ?? '', 'Day of the week');
  }
  // Time of day
  for (const [k, v] of aggregateBy(meals, (m) => timeBucket(new Date(m.eatenAt).getHours()).label)) {
    consider(v, 'tod', k, 'Time of day');
  }
  // How meals made you feel after
  for (const [k, v] of aggregateBy(meals, (m) => m.madeMeFeel)) {
    consider(v, 'after', k, 'How meals made you feel');
  }

  out.sort((a, b) => b.impact - a.impact);
  return out;
}
