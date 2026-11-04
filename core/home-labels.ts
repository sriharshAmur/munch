import { z } from 'zod';
export const HomeLabelsSchema = z.object({
  version: z.literal(1),
  source: z.string(),
  ordersGeneratedAt: z.iso.datetime({ offset: true }),
  names: z.record(z.string(), z.string().min(1).max(200)),
});
export type HomeLabels = z.infer<typeof HomeLabelsSchema>;
