import { z } from 'zod';

export const feelingSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const draftMealSchema = z.object({
  photoUri: z.string().nullable(),
  note: z.string().max(2000),
  whyEat: z.array(z.string()),
  feeling: feelingSchema.nullable(),
  ateWith: z.array(z.string()),
  howWasIt: z.enum(['Forgettable', 'Good', 'Bad']).nullable(),
  whereEat: z.array(z.string()),
  howMade: z.enum(['Homemade', 'Restaurant', 'Fast Food', 'Bakery', 'Prepack', 'Raw']).nullable(),
  madeMeFeel: z.array(z.string()),
});

export const profileSchema = z.object({
  goal: z.string().min(1).max(120),
});

export type DraftMealInput = z.infer<typeof draftMealSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
