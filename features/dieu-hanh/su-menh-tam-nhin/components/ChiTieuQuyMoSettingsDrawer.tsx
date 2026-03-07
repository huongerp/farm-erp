import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { chiTieuQuyMoSchema, type ChiTieuQuyMoFormValues } from '../core/schema';
import type { ChiTieuQuyMo, GiaTriQuyMoTheoNam } from '../core/types';
import { useUpdateChiTieuQuyMo, useUpdateGiaTriQuyMoTheoNam } from '../hooks/use-su-menh-tam-nhin';

const currentYear = new Date().getFullYear();

interface YearItem {
  nam: number;
  gia_tri: number;
}

interface Props {
  metrics: ChiTieuQuyMo[];
  valuesByYear: GiaTriQuyMoTheoNam[];
  metric: ChiTieuQuyMo | null;
  onClose: () => void;
}

const ChiTieuQuyMoSettingsDrawer: React.FC<Props> = ({
  metrics,
  valuesByYear,
  metric,
  onClose,
}) => {
  const { t } = useTranslation();
  const updateMetric = useUpdateChiTieuQuyMo();
  const updateValues = useUpdateGiaTriQuyMoTheoNam();
  const isNew = metric === null;
  const existing = metric ?? undefined;

  const [yearItems, setYearItems] = useState<YearItem[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ChiTieuQuyMoFormValues>({
    resolver: zodResolver(chiTieuQuyMoSchema),
    defaultValues: {
      ten: existing?.ten ?? '',
      don_vi: existing?.don_vi ?? '',
      thu_tu: existing?.thu_tu ?? metrics.length,
      loai_bieu_do: existing?.loai_bieu_do ?? 'bar_vertical',
    },
  });

  useEffect(() => {
    if (metric) {
      const items = valuesByYear
        .filter((v) => v.id_chi_tieu === metric.id)
        .sort((a, b) => a.nam - b.nam)
        .map((v) => ({ nam: v.nam, gia_tri: v.gia_tri }));
      setYearItems(items);
    } else {
      setYearItems([]);
    }
  }, [metric, valuesByYear]);

  useEffect(() => {
    reset({
      ten: existing?.ten ?? '',
      don_vi: existing?.don_vi ?? '',
      thu_tu: existing?.thu_tu ?? metrics.length,
      loai_bieu_do: existing?.loai_bieu_do ?? 'bar_vertical',
    });
  }, [metric, existing, metrics.length, reset]);

  const handleSaveMetricAndValues: SubmitHandler<ChiTieuQuyMoFormValues> = async (data) => {
    const metricId = existing?.id ?? `ct-${Date.now()}`;
    const loaiBieuDo = data.loai_bieu_do ?? 'bar_vertical';
    if (isNew) {
      const newMetric: ChiTieuQuyMo = {
        id: metricId,
        ten: data.ten,
        don_vi: data.don_vi,
        thu_tu: data.thu_tu,
        loai_bieu_do: loaiBieuDo,
      };
      const nextMetrics = [...metrics, newMetric].sort((a, b) => a.thu_tu - b.thu_tu);
      await updateMetric.mutateAsync(nextMetrics);
    } else {
      const nextMetrics = metrics.map((m) =>
        m.id === existing!.id ? { ...m, ten: data.ten, don_vi: data.don_vi, thu_tu: data.thu_tu, loai_bieu_do: loaiBieuDo } : m
      );
      await updateMetric.mutateAsync(nextMetrics);
    }
    const otherValues = valuesByYear.filter((v) => v.id_chi_tieu !== metricId);
    const thisValues = yearItems.map((item) => ({
      id_chi_tieu: metricId,
      nam: item.nam,
      gia_tri: item.gia_tri,
    }));
    await updateValues.mutateAsync([...otherValues, ...thisValues]);
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const addYear = () => {
    const nextYear = yearItems.length
      ? Math.min(currentYear + 30, Math.max(...yearItems.map((x) => x.nam), currentYear) + 1)
      : currentYear;
    if (yearItems.some((x) => x.nam === nextYear)) return;
    setYearItems((prev) => [...prev, { nam: nextYear, gia_tri: 0 }].sort((a, b) => a.nam - b.nam));
  };

  const removeYear = (index: number) => {
    setYearItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: 'nam' | 'gia_tri', value: number) => {
    setYearItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next.sort((a, b) => a.nam - b.nam);
    });
  };

  const isLoading = updateMetric.isPending || updateValues.isPending;
  const donVi = watch('don_vi') ?? existing?.don_vi ?? '';

  return (
    <GenericDrawer
      title={t('suMenhTamNhin.settingsMetric')}
      icon={<TrendingUp size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="chi-tieu-quy-mo-settings-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="chi-tieu-quy-mo-settings-form" onSubmit={handleSubmit(handleSaveMetricAndValues)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.metricInfo')} variant="primary">
          <Input
            label={t('suMenhTamNhin.metricName')}
            placeholder={t('suMenhTamNhin.metricNamePlaceholder')}
            required
            {...register('ten')}
            error={errors.ten?.message ? t(errors.ten.message as string) : undefined}
          />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input
              label={t('suMenhTamNhin.unit')}
              placeholder={t('suMenhTamNhin.unitPlaceholder')}
              {...register('don_vi')}
              error={errors.don_vi?.message ? t(errors.don_vi.message as string) : undefined}
            />
            <Input
              type="number"
              min={0}
              label={t('suMenhTamNhin.order')}
              {...register('thu_tu', { valueAsNumber: true })}
              error={errors.thu_tu?.message ? t(errors.thu_tu.message as string) : undefined}
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('suMenhTamNhin.chartType')}</label>
            <div className="flex gap-0.5 p-0.5 rounded-lg border border-border bg-muted/40 w-fit">
              {(['bar_vertical', 'bar_horizontal'] as const).map((value) => {
                const isActive = watch('loai_bieu_do') === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('loai_bieu_do', value)}
                    className={[
                      'px-3.5 py-1.5 rounded-md text-sm font-medium transition-all',
                      isActive
                        ? 'bg-card text-primary shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent',
                    ].join(' ')}
                  >
                    {value === 'bar_vertical' ? t('suMenhTamNhin.chartBarVertical') : t('suMenhTamNhin.chartBarHorizontal')}
                  </button>
                );
              })}
            </div>
          </div>
        </FormSection>

        <FormSection title={t('suMenhTamNhin.dataByYear')} variant="primary">
          <div className="space-y-2">
            {yearItems.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">{t('suMenhTamNhin.emptyYearsHint')}</p>
            )}
            {yearItems.map((item, index) => (
              <div key={`${item.nam}-${index}`} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                <input
                  type="number"
                  min={2000}
                  max={currentYear + 30}
                  value={item.nam}
                  onChange={(e) => updateRow(index, 'nam', Number(e.target.value))}
                  className="h-9 w-24 rounded-lg border border-border px-2 text-sm bg-background"
                />
                <div className="flex-1 min-w-[100px]">
                  <CurrencyInput
                    value={item.gia_tri}
                    onChange={(v) => updateRow(index, 'gia_tri', v)}
                    suffix={donVi ? ` ${donVi}` : ''}
                    placeholder="0"
                  />
                </div>
                <Tooltip content={t('common.delete')} placement="top">
                  <button
                    type="button"
                    onClick={() => removeYear(index)}
                    className="p-1.5 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </Tooltip>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addYear}
              className="mt-2"
            >
              <Plus size={14} className="mr-1.5" />
              {t('suMenhTamNhin.addYear')}
            </Button>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ChiTieuQuyMoSettingsDrawer;
