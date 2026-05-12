import { Text, View } from 'react-native';
import { todaysExperiment } from '@/lib/todaysExperiment';
import type { Meal } from '@/types/meal';

interface Props {
  meals: Meal[];
}

export function TodaysExperiment({ meals }: Props): JSX.Element {
  const exp = todaysExperiment(meals);
  return (
    <View>
      <Text className="text-ink text-base font-semibold">{exp.text}</Text>
      {exp.reason ? (
        <Text className="text-ink-soft text-xs mt-1 italic">{exp.reason}</Text>
      ) : null}
    </View>
  );
}
