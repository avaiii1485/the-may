import { useI18n } from '@/i18n';
import { coreField, type CatalogQuestion } from '@/lib/questionFields';
import type { DraftMeal, FeelingLevel } from '@/types/meal';
import { FeelingRow } from './FeelingRow';
import { MultiSelectSection, SingleSelectSection } from './ReflectionSection';

export type MultiField = 'whyEat' | 'ateWith' | 'whereEat' | 'madeMeFeel';
export type SingleField = 'howWasIt' | 'howMade';

interface Props {
  questions: CatalogQuestion[];
  multiValues: Record<MultiField, string[]>;
  onToggleMulti: (field: MultiField, value: string) => void;
  howWasIt: DraftMeal['howWasIt'];
  howMade: DraftMeal['howMade'];
  onSetSingle: (field: SingleField, value: string) => void;
  feeling: FeelingLevel | null;
  onSetFeeling: (value: FeelingLevel) => void;
}

// Renders the reflection sections from the question catalog: order, type, and
// option set come from the data; binding maps each core question to its typed
// field. Non-core (future/dynamic) questions are skipped here — that's Layer 2.
export function CatalogReflection({
  questions,
  multiValues,
  onToggleMulti,
  howWasIt,
  howMade,
  onSetSingle,
  feeling,
  onSetFeeling,
}: Props): JSX.Element {
  const { t } = useI18n();
  const ordered = [...questions]
    .filter((q) => q.active && coreField(q.key))
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {ordered.map((q) => {
        const cf = coreField(q.key);
        if (!cf) return null;

        if (cf.type === 'scale') {
          return <FeelingRow key={q.key} selected={feeling} onSelect={onSetFeeling} />;
        }
        if (cf.type === 'single') {
          const field = cf.field as SingleField;
          return (
            <SingleSelectSection<string>
              key={q.key}
              label={t(cf.promptKey)}
              options={q.options}
              selected={field === 'howWasIt' ? howWasIt : howMade}
              onSelect={(v) => onSetSingle(field, v)}
            />
          );
        }
        const field = cf.field as MultiField;
        return (
          <MultiSelectSection
            key={q.key}
            label={t(cf.promptKey)}
            options={q.options}
            selected={multiValues[field]}
            onToggle={(v) => onToggleMulti(field, v)}
          />
        );
      })}
    </>
  );
}
