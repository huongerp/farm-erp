import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { giaTriQuyMoTheoNamSchema, type GiaTriQuyMoTheoNamFormValues } from '../core/schema';
import type { ChiTieuQuyMo, GiaTriQuyMoTheoNam } from '../core/types';
import { useUpdateGiaTriQuyMoTheoNam } from '../hooks/use-su-menh-tam-nhin';

const currentYear = new Date().getFullYear();

interface Props {
  metric: ChiTieuQuyMo;
  values: GiaTriQuyMoTheoNam[];
  editingYear: number | null;
  onClose: () => void;
}

const GiaTriQuyMoFormDrawer: React.FC<Props> = ({ metric, values, editingYear, onClose }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateGiaTriQuyMoTheoNam();
  const existing = editingYear != null ? values.find((v) => v.nam === editingYear) : undefined;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GiaTriQuyMoTheoNamFormValues>({
    resolver: zodResolver(giaTriQuyMoTheoNamSchema),
    defaultValues: {
      id_chi_tieu: metric.id,
      nam: existing?.nam ?? currentYear,
      gia_tri: existing?.gia_tri ?? 0,
    },
  });

  useEffect(() => {
    reset({
      id_chi_tieu: metric.id,
      nam: existing?.nam ?? currentYear,
      gia_tri: existing?.gia_tri ?? 0,
    });
  }, [metric.id, editingYear, existing, reset]);

  const onSubmit: SubmitHandler<GiaTriQuyMoTheoNamFormValues> = async (data) => {
    const forMetric = values.filter((v) => v.id_chi_tieu === metric.id);
    const withoutEdited = editingYear != null ? forMetric.filter((v) => v.nam !== editingYear) : forMetric;
    const otherMetrics = values.filter((v) => v.id_chi_tieu !== metric.id);
    const next = [...otherMetrics, ...withoutEdited, { id_chi_tieu: metric.id, nam: data.nam, gia_tri: data.gia_tri }];
    await updateMutation.mutateAsync(next);
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <GenericDrawer
      title={`${metric.ten} – ${t('suMenhTamNhin.addYear')}`}
      icon={<Calendar size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="gia-tri-quy-mo-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="gia-tri-quy-mo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.year')} variant="primary">
          <Input
            type="number"
            min={currentYear}
            max={currentYear + 30}
            label={t('suMenhTamNhin.year')}
            {...register('nam', { valueAsNumber: true })}
            error={errors.nam?.message ? t(errors.nam.message as string) : undefined}
          />
        </FormSection>
        <FormSection title={t('suMenhTamNhin.valueLabel')} variant="primary">
          <Input
            type="number"
            step="any"
            label={`${metric.ten} (${metric.don_vi})`}
            {...register('gia_tri', { valueAsNumber: true })}
            error={errors.gia_tri?.message ? t(errors.gia_tri.message as string) : undefined}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default GiaTriQuyMoFormDrawer;
