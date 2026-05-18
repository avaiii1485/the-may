import type { Lang } from '@/stores/languageStore';
import type { Meal } from '@/types/meal';

export interface Experiment {
  text: string;
  reason: string | null;
}

const GENERIC_FA: readonly string[] = [
  'برای وعده‌ی بعدی از یک بشقاب کوچک‌تر استفاده کن.',
  'امروز با دست غیرغالبت غذا بخور.',
  'وعده‌ی بعدی‌ات را با چاپستیک امتحان کن.',
  'یک پُرس سبزیجات بیشتر به وعده‌ی بعدی‌ات اضافه کن.',
  'موقع غذا گوشی‌ات را کنار بگذار.',
  'امروز قبل از هر وعده دو نفس عمیق بکش.',
  'آرام بخور — سعی کن هر لقمه را 20 بار بجوی.',
  'امروز از کاسه غذا بخور.',
  'وسط وعده‌ی بعدی مکث کن و حالِ گرسنگی‌ات را چک کن.',
  'در اولین لقمه، سه طعمی که حس می‌کنی را بشناس.',
  'سر میز غذا بخور — بدون صفحه‌نمایش.',
  'امروز یک وعده‌ی خونگی امتحان کن.',
] as const;

const GENERIC: readonly string[] = [
  'Use a smaller plate for your next meal.',
  'Eat with your non-dominant hand today.',
  'Try chopsticks for your next meal.',
  'Add an extra serving of veggies to your next meal.',
  'Put your phone down while eating.',
  'Take 2 deep breaths before each meal today.',
  'Eat slowly — try to chew each bite 20 times.',
  'Eat from a bowl today.',
  'Pause halfway through your next meal and check in with hunger.',
  'Notice three things you taste in your first bite.',
  'Eat at the table — no screens.',
  'Try a homemade meal today.',
] as const;

interface Check {
  test: (m: Meal) => boolean;
  suggestion: string;
  reason: string;
  suggestionFa: string;
  reasonFa: string;
}

const CHECKS: readonly Check[] = [
  {
    test: (m) => m.whereEat.includes('TV') && !m.onPath,
    suggestion: 'Eat your next meal at the table — away from the TV.',
    reason: "You've been going off-path at the TV",
    suggestionFa: 'وعده‌ی بعدی‌ات را سر میز بخور — دور از تلویزیون.',
    reasonFa: 'جلوی تلویزیون بیشتر از مسیر دور شده‌ای',
  },
  {
    test: (m) => m.whereEat.includes('Couch') && !m.onPath,
    suggestion: 'Move your next meal to the table instead of the couch.',
    reason: 'Couch meals have been off-path',
    suggestionFa: 'وعده‌ی بعدی‌ات را به‌جای کاناپه سر میز ببر.',
    reasonFa: 'وعده‌های روی کاناپه خارج از مسیر بوده‌اند',
  },
  {
    test: (m) => m.whereEat.includes('Work desk') && !m.onPath,
    suggestion: 'Step away from your desk for your next meal.',
    reason: 'Desk meals have been off-path',
    suggestionFa: 'برای وعده‌ی بعدی از میز کارت فاصله بگیر.',
    reasonFa: 'وعده‌های پشت میز کار خارج از مسیر بوده‌اند',
  },
  {
    test: (m) => m.whereEat.includes('Bed') && !m.onPath,
    suggestion: 'Move your next meal somewhere other than bed.',
    reason: 'Bed meals have been off-path',
    suggestionFa: 'وعده‌ی بعدی‌ات را جایی غیر از رختخواب بخور.',
    reasonFa: 'وعده‌های توی رختخواب خارج از مسیر بوده‌اند',
  },
  {
    test: (m) => m.whereEat.includes('Car') && !m.onPath,
    suggestion: 'Pause and eat somewhere you can actually sit down.',
    reason: 'Car meals have been off-path',
    suggestionFa: 'مکث کن و جایی بخور که واقعاً بتوانی بنشینی.',
    reasonFa: 'وعده‌های توی ماشین خارج از مسیر بوده‌اند',
  },
  {
    test: (m) => m.howMade === 'Fast Food' && !m.onPath,
    suggestion: 'Try a homemade meal today.',
    reason: 'Fast food has been mostly off-path',
    suggestionFa: 'امروز یک وعده‌ی خونگی امتحان کن.',
    reasonFa: 'فست‌فود بیشتر خارج از مسیر بوده',
  },
  {
    test: (m) => m.whyEat.includes('Stressed'),
    suggestion: 'Take 2 deep breaths before your next meal.',
    reason: 'Stress has been showing up in your meals',
    suggestionFa: 'قبل از وعده‌ی بعدی دو نفس عمیق بکش.',
    reasonFa: 'استرس در وعده‌هایت دیده می‌شود',
  },
  {
    test: (m) => m.whyEat.includes('Bored'),
    suggestion: 'Pause before your next snack and ask: am I actually hungry?',
    reason: 'Boredom has been driving some meals',
    suggestionFa: 'قبل از خوراکی بعدی مکث کن و بپرس: واقعاً گرسنه‌ام؟',
    reasonFa: 'بی‌حوصلگی محرک بعضی وعده‌ها بوده',
  },
  {
    test: (m) => m.whyEat.includes('Tired'),
    suggestion: 'Drink a glass of water first — see if the urge passes.',
    reason: 'Tiredness has been driving some meals',
    suggestionFa: 'اول یک لیوان آب بخور — ببین میلت می‌گذرد.',
    reasonFa: 'خستگی محرک بعضی وعده‌ها بوده',
  },
  {
    test: (m) => m.ateWith.includes('By myself') && !m.onPath,
    suggestion: 'Try sharing your next meal with someone.',
    reason: 'Solo meals have been off-path lately',
    suggestionFa: 'وعده‌ی بعدی‌ات را با کسی شریک شو.',
    reasonFa: 'وعده‌های تنهایی اخیراً خارج از مسیر بوده‌اند',
  },
] as const;

const LOOKBACK_DAYS = 14;
const MIN_HITS = 3;

export function todaysExperiment(
  meals: Meal[],
  today: Date = new Date(),
  lang: Lang = 'en',
): Experiment {
  const cutoff = today.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const recent = meals.filter((m) => new Date(m.eatenAt).getTime() >= cutoff);

  for (const c of CHECKS) {
    const hits = recent.filter(c.test).length;
    if (hits >= MIN_HITS) {
      return lang === 'fa'
        ? { text: c.suggestionFa, reason: c.reasonFa }
        : { text: c.suggestion, reason: c.reason };
    }
  }

  const startOfYear = new Date(today.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((today.getTime() - startOfYear) / (24 * 60 * 60 * 1000));
  const arr = lang === 'fa' ? GENERIC_FA : GENERIC;
  const idx = ((dayOfYear % arr.length) + arr.length) % arr.length;
  return { text: arr[idx] ?? arr[0]!, reason: null };
}
