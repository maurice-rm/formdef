import { z } from 'zod'

const topic = z.object({
  name: z.string().min(1),
  note: z.string(),
  count: z.number().optional(),
  area: z.number().optional(),
  choice: z.enum(['yes', 'no']).optional(),
  answer: z.enum(['yes', 'no']).optional(),
  isActive: z.boolean(),
  kind: z.string(),
  tags: z.array(z.string()),
  remarks: z.string(),
})

export const checklistSchema = z.object({
  contact: topic,
  building: topic,
  envelope: topic,
  heating: topic,
  solar: topic,
  power: topic,
  distribution: topic,
  hotWater: topic,
  wishes: topic,
  site: topic,
})
