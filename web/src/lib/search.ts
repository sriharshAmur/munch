import {z} from 'zod';
import {useSearch} from '@tanstack/react-router';
export const SearchSchema=z.object({year:z.coerce.number().int().optional().catch(undefined),home:z.string().optional(),restaurant:z.string().optional(),weekday:z.coerce.number().int().min(0).max(6).optional().catch(undefined),hour:z.coerce.number().int().min(0).max(23).optional().catch(undefined),month:z.string().optional(),date:z.string().optional(),order:z.string().optional(),place:z.string().optional(),q:z.string().optional(),fulfilment:z.enum(['delivery','pickup']).optional().catch(undefined),company:z.enum(['solo','group']).optional().catch(undefined),demo:z.string().optional()});
export type Search=z.infer<typeof SearchSchema>;
export const useFilters=()=>SearchSchema.parse(useSearch({strict:false}));
