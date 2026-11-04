import { useMemo } from 'react';
import { useData } from '@/data/provider';

/**
 * "Now" for the analysis: the demo is frozen at the moment it was made, so its
 * "3 weeks ago" never drifts; your own file uses today.
 */
export function useNow() {
  const { state } = useData();
  return useMemo(
    () => (state.kind === 'ready' && state.demo ? state.file.generatedAt : new Date().toISOString()),
    [state],
  );
}
