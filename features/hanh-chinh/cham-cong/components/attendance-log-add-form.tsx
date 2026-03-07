import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import { attendanceLogFormSchema } from '../core/schema';

const pad = (n: number) => String(n).padStart(2, '0');

const addFormSchema = attendanceLogFormSchema.extend({
  date: z.string().min(1),
});

type AddFormValues = z.infer<typeof addFormSchema>;

interface Props {
  userId: string;
  user_name: string;
  monthKey: string;
  onClose: () => void;
  onSuccess: () => void;
  addMutation: {
    mutate: (v: {
      userId: string;
      dateStr: string;
      check_in?: string | null;
      check_out?: string | null;
    }) => void;
    isPending: boolean;
  };
}

const AttendanceLogAddForm: React.FC<Props> = ({
  userId,
  user_name,
  monthKey,
  onClose,
  onSuccess,
  addMutation,
}) => {
  const { t } = useTranslation();
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const defaultDate =
    monthKey + '-' + pad(Math.min(new Date().getDate(), daysInMonth));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      date: defaultDate,
      check_in: '08:00',
      check_out: '17:30',
    },
  });

  const onSubmit = (values: AddFormValues) => {
    addMutation.mutate(
      {
        userId,
        dateStr: values.date,
        check_in: values.check_in?.trim() || null,
        check_out: values.check_out?.trim() || null,
      },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  };

  const minDate = `${monthKey}-01`;
  const maxDate = `${monthKey}-${pad(daysInMonth)}`;

  return (
    <GenericDrawer
      title={t('attendance.form.addTitle')}
      subtitle={`${user_name} · ${monthKey}`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={addMutation.isPending}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormSection title={t('attendance.detail.timeSection')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('attendance.history.dateCol')}
              type="date"
              min={minDate}
              max={maxDate}
              {...register('date', { required: true })}
              error={errors.date?.message}
            />
            <div className="sm:col-span-2" />
            <Input
              label={t('attendance.history.checkInCol')}
              placeholder="08:00"
              {...register('check_in')}
              error={errors.check_in?.message}
            />
            <Input
              label={t('attendance.history.checkOutCol')}
              placeholder="17:30"
              {...register('check_out')}
              error={errors.check_out?.message}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default AttendanceLogAddForm;
