import type { Meal } from '@/types/meal';

export interface BadgeProgress {
  earned: boolean;
  ratio: number; // 0..1
  statusText: string;
}

export type BadgeCategory =
  | 'logging'
  | 'streak'
  | 'path'
  | 'reflection'
  | 'features'
  | 'time'
  | 'variety';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  category: BadgeCategory;
}

export interface BadgeContext {
  meals: Meal[];
  goal: string;
  preferredName: string;
  handle: string;
}

function uniqueDays(meals: Meal[]): number {
  const days = new Set<string>();
  for (const m of meals) {
    const d = new Date(m.eatenAt);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return days.size;
}

function uniqueArrayValues(meals: Meal[], get: (m: Meal) => string[]): number {
  const set = new Set<string>();
  for (const m of meals) {
    for (const v of get(m)) set.add(v);
  }
  return set.size;
}

const DEFAULT_GOAL = 'Feeling happy and healthy';

export const BADGES: readonly BadgeDef[] = [
  // Logging count
  {
    id: 'first-bite',
    name: 'First Bite',
    description: 'Log your very first meal.',
    emoji: '🌱',
    color: '#34C9A2',
    category: 'logging',
  },
  {
    id: 'consistent',
    name: 'Consistent',
    description: 'Log 10 meals total.',
    emoji: '📝',
    color: '#1FB6E5',
    category: 'logging',
  },
  {
    id: 'plate-master',
    name: 'Plate Master',
    description: 'Log 50 meals.',
    emoji: '🍽️',
    color: '#F39C3D',
    category: 'logging',
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Log 100 meals.',
    emoji: '🏆',
    color: '#F4C04C',
    category: 'logging',
  },
  // Days
  {
    id: 'day-one',
    name: 'Day One',
    description: 'Show up for one day.',
    emoji: '📅',
    color: '#34C9A2',
    category: 'streak',
  },
  {
    id: 'week-one',
    name: 'Week One',
    description: 'Log on 7 different days.',
    emoji: '🗓️',
    color: '#1FB6E5',
    category: 'streak',
  },
  {
    id: 'monthlong',
    name: 'Monthlong',
    description: 'Log on 30 different days.',
    emoji: '📆',
    color: '#8C6CF1',
    category: 'streak',
  },
  // On-path
  {
    id: 'on-path-5',
    name: 'On Path',
    description: 'Have 5 on-path meals.',
    emoji: '✨',
    color: '#F39C3D',
    category: 'path',
  },
  {
    id: 'bullseye',
    name: 'Bullseye',
    description: 'Reach 20 on-path meals.',
    emoji: '🎯',
    color: '#F25C8B',
    category: 'path',
  },
  {
    id: 'mindful',
    name: 'Mindful',
    description: 'Hit 80% on-path with 20+ meals.',
    emoji: '🧘',
    color: '#8C6CF1',
    category: 'path',
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Hit 90% on-path with 50+ meals.',
    emoji: '🌟',
    color: '#F4C04C',
    category: 'path',
  },
  // Reflection
  {
    id: 'self-reflective',
    name: 'Self-Reflective',
    description: 'Add a note to 5 meals.',
    emoji: '✍️',
    color: '#34C9A2',
    category: 'reflection',
  },
  {
    id: 'mood-tracker',
    name: 'Mood Tracker',
    description: 'Pick a feeling on 15 meals.',
    emoji: '😀',
    color: '#F25C8B',
    category: 'reflection',
  },
  // Features
  {
    id: 'first-snap',
    name: 'First Snap',
    description: 'Log a meal with a photo.',
    emoji: '📸',
    color: '#1FB6E5',
    category: 'features',
  },
  {
    id: 'wordsmith',
    name: 'Wordsmith',
    description: 'Log a text-only meal.',
    emoji: '📖',
    color: '#8C6CF1',
    category: 'features',
  },
  {
    id: 'focused',
    name: 'Focused',
    description: 'Set your own lifestyle focus.',
    emoji: '🎯',
    color: '#F39C3D',
    category: 'features',
  },
  {
    id: 'identity',
    name: 'Identity',
    description: 'Set your name and handle in Profile.',
    emoji: '🪪',
    color: '#34C9A2',
    category: 'features',
  },
  // Time of day
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Log a meal before 8 AM.',
    emoji: '🌅',
    color: '#F4C04C',
    category: 'time',
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Log a meal after 10 PM.',
    emoji: '🌙',
    color: '#8C6CF1',
    category: 'time',
  },
  // Variety
  {
    id: 'home-cook',
    name: 'Home Cook',
    description: 'Log 10 homemade meals.',
    emoji: '🍳',
    color: '#F39C3D',
    category: 'variety',
  },
  {
    id: 'around-town',
    name: 'Around Town',
    description: 'Eat at 5 different places.',
    emoji: '🌍',
    color: '#1FB6E5',
    category: 'variety',
  },
  {
    id: 'people-person',
    name: 'People Person',
    description: 'Eat with all 5 company types.',
    emoji: '👥',
    color: '#F25C8B',
    category: 'variety',
  },
];

export function computeBadgeProgress(id: string, ctx: BadgeContext): BadgeProgress {
  const total = ctx.meals.length;
  const onPath = ctx.meals.filter((m) => m.onPath).length;

  switch (id) {
    case 'first-bite':
      return { earned: total >= 1, ratio: Math.min(total / 1, 1), statusText: `${total}/1 meals` };
    case 'consistent':
      return { earned: total >= 10, ratio: Math.min(total / 10, 1), statusText: `${total}/10 meals` };
    case 'plate-master':
      return { earned: total >= 50, ratio: Math.min(total / 50, 1), statusText: `${total}/50 meals` };
    case 'centurion':
      return {
        earned: total >= 100,
        ratio: Math.min(total / 100, 1),
        statusText: `${total}/100 meals`,
      };
    case 'day-one': {
      const d = uniqueDays(ctx.meals);
      return { earned: d >= 1, ratio: Math.min(d / 1, 1), statusText: `${d}/1 days` };
    }
    case 'week-one': {
      const d = uniqueDays(ctx.meals);
      return { earned: d >= 7, ratio: Math.min(d / 7, 1), statusText: `${d}/7 days` };
    }
    case 'monthlong': {
      const d = uniqueDays(ctx.meals);
      return { earned: d >= 30, ratio: Math.min(d / 30, 1), statusText: `${d}/30 days` };
    }
    case 'on-path-5':
      return {
        earned: onPath >= 5,
        ratio: Math.min(onPath / 5, 1),
        statusText: `${onPath}/5 on-path meals`,
      };
    case 'bullseye':
      return {
        earned: onPath >= 20,
        ratio: Math.min(onPath / 20, 1),
        statusText: `${onPath}/20 on-path meals`,
      };
    case 'mindful': {
      const rate = total > 0 ? onPath / total : 0;
      if (total < 20) {
        return {
          earned: false,
          ratio: (total / 20) * 0.5,
          statusText: `${total}/20 meals to qualify`,
        };
      }
      return {
        earned: rate >= 0.8,
        ratio: Math.min(0.5 + (rate / 0.8) * 0.5, 1),
        statusText: `${Math.round(rate * 100)}% on-path · need 80%`,
      };
    }
    case 'pathfinder': {
      const rate = total > 0 ? onPath / total : 0;
      if (total < 50) {
        return {
          earned: false,
          ratio: (total / 50) * 0.5,
          statusText: `${total}/50 meals to qualify`,
        };
      }
      return {
        earned: rate >= 0.9,
        ratio: Math.min(0.5 + (rate / 0.9) * 0.5, 1),
        statusText: `${Math.round(rate * 100)}% on-path · need 90%`,
      };
    }
    case 'self-reflective': {
      const c = ctx.meals.filter((m) => m.note && m.note.trim().length > 0).length;
      return { earned: c >= 5, ratio: Math.min(c / 5, 1), statusText: `${c}/5 notes added` };
    }
    case 'mood-tracker': {
      const c = ctx.meals.filter((m) => m.feeling !== null).length;
      return { earned: c >= 15, ratio: Math.min(c / 15, 1), statusText: `${c}/15 moods tagged` };
    }
    case 'first-snap': {
      const c = ctx.meals.filter((m) => !!m.photoUrl).length;
      return {
        earned: c >= 1,
        ratio: Math.min(c, 1),
        statusText: c > 0 ? 'Photo logged' : 'No photo logged yet',
      };
    }
    case 'wordsmith': {
      const c = ctx.meals.filter((m) => !!m.textContent && !m.photoUrl).length;
      return {
        earned: c >= 1,
        ratio: Math.min(c, 1),
        statusText: c > 0 ? 'Text meal logged' : 'No text meal yet',
      };
    }
    case 'focused': {
      const custom = !!ctx.goal && ctx.goal.trim() !== '' && ctx.goal !== DEFAULT_GOAL;
      return {
        earned: custom,
        ratio: custom ? 1 : 0,
        statusText: custom ? 'Custom focus set' : 'Pick a focus from the gear icon',
      };
    }
    case 'identity': {
      const hasName = ctx.preferredName.trim().length > 0;
      const hasHandle = ctx.handle.trim().length > 0;
      const filled = (hasName ? 1 : 0) + (hasHandle ? 1 : 0);
      return {
        earned: filled === 2,
        ratio: filled / 2,
        statusText: `${filled}/2 fields filled`,
      };
    }
    case 'early-bird': {
      const found = ctx.meals.some((m) => new Date(m.eatenAt).getHours() < 8);
      return {
        earned: found,
        ratio: found ? 1 : 0,
        statusText: found ? 'Logged before 8 AM' : 'Log a meal before 8 AM',
      };
    }
    case 'night-owl': {
      const found = ctx.meals.some((m) => new Date(m.eatenAt).getHours() >= 22);
      return {
        earned: found,
        ratio: found ? 1 : 0,
        statusText: found ? 'Logged after 10 PM' : 'Log a meal after 10 PM',
      };
    }
    case 'home-cook': {
      const c = ctx.meals.filter((m) => m.howMade === 'Homemade').length;
      return { earned: c >= 10, ratio: Math.min(c / 10, 1), statusText: `${c}/10 homemade meals` };
    }
    case 'around-town': {
      const c = uniqueArrayValues(ctx.meals, (m) => m.whereEat);
      return { earned: c >= 5, ratio: Math.min(c / 5, 1), statusText: `${c}/5 places` };
    }
    case 'people-person': {
      const c = uniqueArrayValues(ctx.meals, (m) => m.ateWith);
      return { earned: c >= 5, ratio: Math.min(c / 5, 1), statusText: `${c}/5 company types` };
    }
    default:
      return { earned: false, ratio: 0, statusText: '' };
  }
}

export interface ResolvedBadge {
  def: BadgeDef;
  progress: BadgeProgress;
}

export function getAllBadges(ctx: BadgeContext): ResolvedBadge[] {
  return BADGES.map((def) => ({ def, progress: computeBadgeProgress(def.id, ctx) }));
}
