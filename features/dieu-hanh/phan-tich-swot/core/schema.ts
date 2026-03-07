import { z } from 'zod';

const swotItemSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
});

export const swotFormSchema = z.object({
  nam: z.number().min(2000).max(2100),
  strengths: z.array(swotItemSchema),
  weaknesses: z.array(swotItemSchema),
  opportunities: z.array(swotItemSchema),
  threats: z.array(swotItemSchema),
  industrySuccessFactors: z.array(swotItemSchema),
});

export type SwotFormValues = z.infer<typeof swotFormSchema>;
export type SwotItemForm = z.infer<typeof swotItemSchema>;
