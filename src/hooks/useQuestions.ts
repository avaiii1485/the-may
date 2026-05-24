import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured } from '@/lib/supabase';
import { FALLBACK_QUESTIONS, type CatalogQuestion } from '@/lib/questionFields';
import { fetchCatalog } from '@/services/questions';

// Returns the question catalog, always usable: the live catalog when Supabase is
// configured and reachable, otherwise the hardcoded fallback (offline, empty, or
// while loading). Reference data — cached aggressively.
export function useQuestions(): CatalogQuestion[] {
  const q = useQuery({
    queryKey: ['questions'],
    queryFn: fetchCatalog,
    enabled: isSupabaseConfigured,
    staleTime: 60 * 60 * 1000,
  });

  if (!isSupabaseConfigured) return FALLBACK_QUESTIONS;
  return q.data && q.data.length > 0 ? q.data : FALLBACK_QUESTIONS;
}
