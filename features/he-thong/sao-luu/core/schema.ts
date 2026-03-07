
import { z } from "zod";

export const exportSchema = z.object({
  collections: z.array(z.string()).min(1, 'Chọn ít nhất 1 bộ dữ liệu'),
  format: z.enum(['csv', 'xlsx', 'json']),
  ghi_chu: z.string().max(200).optional().nullable(),
});

export type ExportFormValues = z.infer<typeof exportSchema>;
