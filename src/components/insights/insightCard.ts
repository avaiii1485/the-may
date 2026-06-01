import type { ReactNode } from 'react';

// One Insights card definition, shared by the platform-specific list renderers.
export interface InsightCard {
  id: string;
  title: string;
  variant?: 'default' | 'highlight';
  leftAdornment?: ReactNode;
  content: ReactNode;
}

export interface InsightsCardListProps {
  items: InsightCard[];
  header: ReactNode;
  footer: ReactNode;
  onReorder: (orderedIds: string[]) => void;
}
