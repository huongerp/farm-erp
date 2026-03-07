import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { PieChart } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import type { PhanKhucThiPhan, TamNhinThiPhanItem } from '../core/types';
import { useUpdateTamNhinThiPhan } from '../hooks/use-su-menh-tam-nhin';

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 16 }, (_, i) => currentYear + i);

/** Form values: nam (optional when adding) + one number per segment id */
type FormValues = Record<string, number> & { nam?: number };

interface Props {
  segments: PhanKhucThiPhan[];
  targets: TamNhinThiPhanItem[];
  /** When null, form is for "add new year" and shows year selector */
  year: number | null;
  onClose: () => void;
}

const TamNhinThiPhanFormDrawer: React.FC<Props> = ({
  segments,
  targets,
  year,
  onClose,
}) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateTamNhinThiPhan();
  const isNewYear = year === null;
  const effectiveYear = year ?? currentYear;

  const defaultValues: FormValues = { nam: currentYear };
  segments.forEach((s) => {
    const item = targets.find((t) => t.nam === effectiveYear && t.id_phan_khuc === s.id);
    defaultValues[s.id] = item?.gia_tri ?? 0;
  });

  const { register, handleSubmit, reset, watch, control } = useForm<FormValues>({
    defaultValues,
  });

  const selectedYear = watch('nam') ?? currentYear;

  useEffect(() => {
    const y = year ?? currentYear;
    const next: FormValues = { nam: y };
    segments.forEach((s) => {
      const item = targets.find((t) => t.nam === y && t.id_phan_khuc === s.id);
      next[s.id] = item?.gia_tri ?? 0;
    });
    reset(next);
  }, [year, segments, targets, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const y = isNewYear ? Number(data.nam) || currentYear : effectiveYear;
    const otherYears = targets.filter((t) => t.nam !== y);
    const forYear: TamNhinThiPhanItem[] = segments.map((s) => ({
      nam: y,
      id_phan_khuc: s.id,
      gia_tri: Number(data[s.id]) || 0,
    }));
    await updateMutation.mutateAsync([...otherYears, ...forYear]);
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;
  const displayYear = isNewYear ? (selectedYear ?? currentYear) : effectiveYear;

  return (
    <GenericDrawer
      title={isNewYear ? t('suMenhTamNhin.addYear') : `${t('suMenhTamNhin.visionMarketShare')} – ${effectiveYear}`}
      icon={<PieChart size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="tam-nhin-thi-phan-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="tam-nhin-thi-phan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {isNewYear && (
          <FormSection title={t('suMenhTamNhin.year')} variant="primary">
            <Controller
              name="nam"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('suMenhTamNhin.selectYear')}
                  options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
                  value={String(field.value ?? currentYear)}
                  onChange={(e) => field.onChange(e.target.value === '' ? currentYear : Number(e.target.value))}
                />
              )}
            />
          </FormSection>
        )}
        <FormSection title={t('suMenhTamNhin.marketSharePercent')} variant="primary">
          {!isNewYear && (
            <p className="text-sm text-muted-foreground mb-3">
              {t('suMenhTamNhin.year')}: {displayYear}
            </p>
          )}
          <div className="space-y-3">
            {segments.map((seg) => (
              <Input
                key={seg.id}
                type="number"
                min={0}
                max={100}
                step={0.1}
                label={seg.ten}
                {...register(seg.id, { valueAsNumber: true })}
              />
            ))}
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TamNhinThiPhanFormDrawer;
