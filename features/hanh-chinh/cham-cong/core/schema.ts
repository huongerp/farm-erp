import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const attendanceLogFormSchema = z.object({
  check_in: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || timeRegex.test(v), { message: i18n.t('attendance.form.invalidTime') }),
  check_out: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || timeRegex.test(v), { message: i18n.t('attendance.form.invalidTime') }),
});

export type AttendanceLogFormValues = z.infer<typeof attendanceLogFormSchema>;
