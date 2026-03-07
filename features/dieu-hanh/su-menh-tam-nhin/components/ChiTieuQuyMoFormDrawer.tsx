import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrendingUp } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { chiTieuQuyMoSchema, type ChiTieuQuyMoFormValues } from '../core/schema';
import type { ChiTieuQuyMo } from '../core/types';
import { useUpdateChiTieuQuyMo } from '../hooks/use-su-menh-tam-nhin';

interface Props {
  metrics: ChiTieuQuyMo[];
  editingId: string | null;
  onClose: () => void;
}

const ChiTieuQuyMoFormDrawer: React.FC<Props> = ({ metrics, editingId, onClose }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateChiTieuQuyMo();
  const existing = editingId != null ? metrics.find((x) => x.id === editingId) : undefined;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChiTieuQuyMoFormValues>({
    resolver: zodResolver(chiTieuQuyMoSchema),
    defaultValues: {
      ten: existing?.ten ?? '',
      don_vi: existing?.don_vi ?? '',
      thu_tu: existing?.thu_tu ?? metrics.length,
    },
  });

  useEffect(() => {
    reset({
      ten: existing?.ten ?? '',
      don_vi: existing?.don_vi ?? '',
      thu_tu: existing?.thu_tu ?? metrics.length,
    });
  }, [editingId, existing, metrics.length, reset]);

  const onSubmit: SubmitHandler<ChiTieuQuyMoFormValues> = async (data) => {
    if (existing) {
      const next = metrics.map((m) =>
        m.id === existing.id ? { ...m, ten: data.ten, don_vi: data.don_vi, thu_tu: data.thu_tu } : m
      );
      await updateMutation.mutateAsync(next);
    } else {
      const newItem: ChiTieuQuyMo = {
        id: `ct-${Date.now()}`,
        ten: data.ten,
        don_vi: data.don_vi,
        thu_tu: data.thu_tu,
      };
      await updateMutation.mutateAsync([...metrics, newItem].sort((a, b) => a.thu_tu - b.thu_tu));
    }
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <GenericDrawer
      title={t('suMenhTamNhin.editScaleMetric')}
      icon={<TrendingUp size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="chi-tieu-quy-mo-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="chi-tieu-quy-mo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.metricName')} variant="primary">
          <Input
            label={t('suMenhTamNhin.metricName')}
            placeholder={t('suMenhTamNhin.metricNamePlaceholder')}
            {...register('ten')}
            error={errors.ten?.message ? t(errors.ten.message as string) : undefined}
          />
        </FormSection>
        <FormSection title={t('suMenhTamNhin.unit')} variant="primary">
          <Input
            label={t('suMenhTamNhin.unit')}
            placeholder={t('suMenhTamNhin.unitPlaceholder')}
            {...register('don_vi')}
            error={errors.don_vi?.message ? t(errors.don_vi.message as string) : undefined}
          />
        </FormSection>
        <FormSection title={t('suMenhTamNhin.order')} variant="primary">
          <Input
            type="number"
            min={0}
            label={t('suMenhTamNhin.order')}
            {...register('thu_tu', { valueAsNumber: true })}
            error={errors.thu_tu?.message ? t(errors.thu_tu.message as string) : undefined}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ChiTieuQuyMoFormDrawer;
