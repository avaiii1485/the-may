import { create } from 'zustand';
import type { DraftMeal, FeelingLevel } from '@/types/meal';

const empty: DraftMeal = {
  photoUri: null,
  textContent: '',
  eatenAt: null,
  note: '',
  whyEat: [],
  feeling: null,
  ateWith: [],
  howWasIt: null,
  whereEat: [],
  howMade: null,
  madeMeFeel: [],
};

interface CaptureDraftState {
  draft: DraftMeal;
  setPhotoUri: (uri: string | null) => void;
  setTextContent: (text: string) => void;
  setEatenAt: (iso: string | null) => void;
  setNote: (note: string) => void;
  toggleMulti: (field: keyof DraftMeal, value: string) => void;
  setSingle: <K extends 'howWasIt' | 'howMade'>(field: K, value: DraftMeal[K]) => void;
  setFeeling: (f: FeelingLevel | null) => void;
  reset: () => void;
}

const MULTI_FIELDS: ReadonlyArray<keyof DraftMeal> = [
  'whyEat',
  'ateWith',
  'whereEat',
  'madeMeFeel',
];

export const useCaptureDraftStore = create<CaptureDraftState>((set) => ({
  draft: empty,
  setPhotoUri: (uri) => set((s) => ({ draft: { ...s.draft, photoUri: uri } })),
  setTextContent: (text) => set((s) => ({ draft: { ...s.draft, textContent: text } })),
  setEatenAt: (iso) => set((s) => ({ draft: { ...s.draft, eatenAt: iso } })),
  setNote: (note) => set((s) => ({ draft: { ...s.draft, note } })),
  toggleMulti: (field, value) =>
    set((s) => {
      if (!MULTI_FIELDS.includes(field)) return s;
      const current = s.draft[field] as string[];
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      return { draft: { ...s.draft, [field]: next } };
    }),
  setSingle: (field, value) =>
    set((s) => ({ draft: { ...s.draft, [field]: value } })),
  setFeeling: (feeling) => set((s) => ({ draft: { ...s.draft, feeling } })),
  reset: () => set({ draft: empty }),
}));
