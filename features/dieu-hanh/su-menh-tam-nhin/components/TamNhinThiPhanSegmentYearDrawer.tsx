import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PieChart } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import type { PhanKhucThiPhan, TamNhinThiPhanItem } from '../core/types';
import { useUpdateTamNhinThiPhan } from '../hooks/use-su-menh-tam-nhin';

const currentYear = new Date().getFullYear();
const schema = z.object({
  nam: z.number().min(2000),
  gia_tri: z.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  segment: PhanKhucThiPhan;
  targets: TamNhinThiPhanItem[];
  /** null = thêm năm mới */
  editingYear: number | null;
  onClose: () => void;
}

const TamNhinThiPhanSegmentYearDrawer: React.FC<Props> = ({
  segment,
  targets,
  editingYear,
  onClose,
}) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateTamNhinThiPhan();
  const existing = editingYear != null
    ? targets.find((x) => x.nam === editingYear && x.id_phan_khuc === segment.id)
    : undefined;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nam: existing?.nam ?? currentYear,
      gia_tri: existing?.gia_tri ?? 0,
    },
  });

  useEffect(() => {
    reset({
      nam: existing?.nam ?? currentYear,
      gia_tri: existing?.gia_tri ?? 0,
    });
  }, [editingYear, existing, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const others = targets.filter(
      (x) => !(x.id_phan_khuc === segment.id && x.nam === (editingYear ?? data.nam))
    );
    const next = [...others, { id_phan_khuc: segment.id, nam: data.nam, gia_tri: data.gia_tri }];
    await updateMutation.mutateAsync(next);
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;
  const isNew = editingYear === null;

  return (
    <GenericDrawer
      title={isNew ? t('suMenhTamNhin.addYear') : `${segment.ten} – ${editingYear}`}
      icon={<PieChart size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="tam-nhin-thi-phan-segment-year-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="tam-nhin-thi-phan-segment-year-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.year')} variant="primary">
          <Input
            type="number"
            min={currentYear}
            max={currentYear + 30}
            label={t('suMenhTamNhin.year')}
            {...register('nam', { valueAsNumber: true })}
            error={errors.nam?.message ? t(errors.nam.message as string) : undefined}
            disabled={!isNew}
          />
        </FormSection>
        <FormSection title={t('suMenhTamNhin.marketSharePercent')} variant="primary">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            label={`${segment.ten} (%)`}
            {...register('gia_tri', { valueAsNumber: true })}
            error={errors.gia_tri?.message ? t(errors.gia_tri.message as string) : undefined}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TamNhinThiPhanSegmentYearDrawer;
