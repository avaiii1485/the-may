import type { Meal } from '@/types/meal';

export interface Experiment {
  text: string;
  reason: string | null;
}

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
}

const CHECKS: readonly Check[] = [
  {
    test: (m) => m.whereEat.includes('TV') && !m.onPath,
    suggestion: 'Eat your next meal at the table — away from the TV.',
    reason: "You've been going off-path at the TV",
  },
  {
    test: (m) => m.whereEat.includes('Couch') && !m.onPath,
    suggestion: 'Move your next meal to the table instead of the couch.',
    reason: 'Couch meals have been off-path',
  },
  {
    test: (m) => m.whereEat.includes('Work desk') && !m.onPath,
    suggestion: 'Step away from your desk for your next meal.',
    reason: 'Desk meals have been off-path',
  },
  {
    test: (m) => m.whereEat.includes('Bed') && !m.onPath,
    suggestion: 'Move your next meal somewhere other than bed.',
    reason: 'Bed meals have been off-path',
  },
  {
    test: (m) => m.whereEat.includes('Car') && !m.onPath,
    suggestion: 'Pause and eat somewhere you can actually sit down.',
    reason: 'Car meals have been off-path',
  },
  {
    test: (m) => m.howMade === 'Fast Food' && !m.onPath,
    suggestion: 'Try a homemade meal today.',
    reason: 'Fast food has been mostly off-path',
  },
  {
    test: (m) => m.whyEat.includes('Stressed'),
    suggestion: 'Take 2 deep breaths before your next meal.',
    reason: 'Stress has been showing up in your meals',
  },
  {
    test: (m) => m.whyEat.includes('Bored'),
    suggestion: "Pause before your next snack and ask: am I actually hungry?",
    reason: 'Boredom has been driving some meals',
  },
  {
    test: (m) => m.whyEat.includes('Tired'),
    suggestion: 'Drink a glass of water first — see if the urge passes.',
    reason: 'Tiredness has been driving some meals',
  },
  {
    test: (m) => m.ateWith.includes('By myself') && !m.onPath,
    suggestion: 'Try sharing your next meal with someone.',
    reason: "Solo meals have been off-path lately",
  },
] as const;

const LOOKBACK_DAYS = 14;
const MIN_HITS = 3;

export function todaysExperiment(meals: Meal[], today: Date = new Date()): Experiment {
  const cutoff = today.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const recent = meals.filter((m) => new Date(m.eatenAt).getTime() >= cutoff);

  for (const c of CHECKS) {
    const hits = recent.filter(c.test).length;
    if (hits >= MIN_HITS) {
      return { text: c.suggestion, reason: c.reason };
    }
  }

  const startOfYear = new Date(today.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((today.getTime() - startOfYear) / (24 * 60 * 60 * 1000));
  const idx = ((dayOfYear % GENERIC.length) + GENERIC.length) % GENERIC.length;
  return { text: GENERIC[idx] ?? GENERIC[0]!, reason: null };
}
