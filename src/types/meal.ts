export type FeelingLevel = 0 | 1 | 2 | 3 | 4;

export const FEELING_EMOJI: readonly string[] = ['☹️', '😕', '🙂', '😀', '🥳'] as const;

export interface Meal {
  id: string;
  userId: string;
  photoUrl: string | null;
  textContent: string | null;
  eatenAt: string;
  onPath: boolean;
  note: string | null;
  whyEat: string[];
  feeling: FeelingLevel | null;
  ateWith: string[];
  howWasIt: 'Forgettable' | 'Good' | 'Bad' | null;
  whereEat: string[];
  howMade: 'Homemade' | 'Restaurant' | 'Fast Food' | 'Bakery' | 'Prepack' | 'Raw' | null;
  madeMeFeel: string[];
  createdAt: string;
}

export interface DraftMeal {
  photoUri: string | null;
  textContent: string;
  eatenAt: string | null;
  note: string;
  whyEat: string[];
  feeling: FeelingLevel | null;
  ateWith: string[];
  howWasIt: Meal['howWasIt'];
  whereEat: string[];
  howMade: Meal['howMade'];
  madeMeFeel: string[];
}

export const QUESTIONS = {
  whyEat: {
    label: 'Why did I eat?',
    options: [
      'Hungry',
      'Social',
      'It was time',
      'Bored',
      'Stressed',
      'Cravings',
      'Tired',
      '❤️ the taste',
      'Why not?',
      'Other',
    ],
  },
  ateWith: {
    label: 'Who did you eat with?',
    options: ['Friends', 'Family', 'Partner', 'Colleagues', 'By myself'],
  },
  howWasIt: {
    label: 'How was it?',
    options: ['Forgettable', 'Good', 'Bad'],
  },
  whereEat: {
    label: 'Where did you eat?',
    options: ['Table', 'TV', 'Car', 'Bed', 'Work desk', 'Standing', 'Couch', 'Outside'],
  },
  howMade: {
    label: 'How was it made?',
    options: ['Homemade', 'Restaurant', 'Fast Food', 'Bakery', 'Prepack', 'Raw'],
  },
  madeMeFeel: {
    label: 'How did it make you feel?',
    options: ['Satisfied', 'Still hungry', 'Stuffed', 'Happy', 'Guilty', 'Unsatisfied', 'Sick'],
  },
} as const;
