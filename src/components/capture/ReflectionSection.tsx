import { Text, View } from 'react-native';
import { BubblePill } from './BubblePill';

interface MultiProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function MultiSelectSection({ label, options, selected, onToggle }: MultiProps): JSX.Element {
  return (
    <View className="bg-bg-card rounded-2xl p-4 mb-3">
      <Text className="text-base font-semibold text-ink mb-3">{label}</Text>
      <View className="flex-row flex-wrap">
        {options.map((opt) => (
          <BubblePill
            key={opt}
            label={opt}
            active={selected.includes(opt)}
            onPress={() => onToggle(opt)}
          />
        ))}
      </View>
    </View>
  );
}

interface SingleProps<T extends string> {
  label: string;
  options: readonly T[];
  selected: T | null;
  onSelect: (value: T) => void;
}

export function SingleSelectSection<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: SingleProps<T>): JSX.Element {
  return (
    <View className="bg-bg-card rounded-2xl p-4 mb-3">
      <Text className="text-base font-semibold text-ink mb-3">{label}</Text>
      <View className="flex-row flex-wrap">
        {options.map((opt) => (
          <BubblePill
            key={opt}
            label={opt}
            active={selected === opt}
            onPress={() => onSelect(opt)}
          />
        ))}
      </View>
    </View>
  );
}
