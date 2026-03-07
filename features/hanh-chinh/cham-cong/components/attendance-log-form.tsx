import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import { attendanceLogFormSchema, AttendanceLogFormValues } from '../core/schema';
import { AttendanceLog } from '../core/types';

interface Props {
  data: AttendanceLog;
  onClose: () => void;
  onSuccess: () => void;
  updateMutation: { mutate: (v: { logId: string; check_in?: string | null; check_out?: string | null }) => void; isPending: boolean };
}

const AttendanceLogForm: React.FC<Props> = ({ data, onClose, onSuccess, updateMutation }) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceLogFormValues>({
    resolver: zodResolver(attendanceLogFormSchema),
    defaultValues: {
      check_in: data.check_in ?? '',
      check_out: data.check_out ?? '',
    },
  });

  const onSubmit = (values: AttendanceLogFormValues) => {
    updateMutation.mutate(
      {
        logId: data.id,
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

  return (
    <GenericDrawer
      title={t('attendance.form.editTitle')}
      subtitle={`${data.user_name} · ${data.date}`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
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

export default AttendanceLogForm;
