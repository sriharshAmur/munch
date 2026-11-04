import { useMemo } from 'react';
import { z } from 'zod';
import { useSearch } from '@tanstack/react-router';
export const SearchSchema = z.object({
  year: z.coerce.number().int().optional().catch(undefined),
  home: z.coerce.string().optional(),
  restaurant: z.coerce.string().optional(),
  weekday: z.coerce.number().int().min(0).max(6).optional().catch(undefined),
  hour: z.coerce.number().int().min(0).max(23).optional().catch(undefined),
  month: z.coerce.string().optional(),
  date: z.coerce.string().optional(),
  order: z.coerce.string().optional(),
  place: z.coerce.string().optional(),
  q: z.coerce.string().optional(),
  fulfilment: z.enum(['delivery', 'pickup']).optional().catch(undefined),
  company: z.enum(['solo', 'group']).optional().catch(undefined),
  demo: z.coerce.string().optional(),
});
export type Search = z.infer<typeof SearchSchema>;
export function useFilters() {
  const search = useSearch({ strict: false });
  return useMemo(() => SearchSchema.parse(search), [search]);
}
