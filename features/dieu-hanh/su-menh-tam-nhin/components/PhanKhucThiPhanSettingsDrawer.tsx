import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { PieChart, Plus, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { phanKhucThiPhanSchema, type PhanKhucThiPhanFormValues } from '../core/schema';
import type { PhanKhucThiPhan, TamNhinThiPhanItem } from '../core/types';
import { useUpdatePhanKhucThiPhan, useUpdateTamNhinThiPhan } from '../hooks/use-su-menh-tam-nhin';

const currentYear = new Date().getFullYear();

interface YearItem {
  nam: number;
  gia_tri: number;
}

interface Props {
  segments: PhanKhucThiPhan[];
  targets: TamNhinThiPhanItem[];
  segment: PhanKhucThiPhan | null;
  onClose: () => void;
}

const PhanKhucThiPhanSettingsDrawer: React.FC<Props> = ({
  segments,
  targets,
  segment,
  onClose,
}) => {
  const { t } = useTranslation();
  const updateSegments = useUpdatePhanKhucThiPhan();
  const updateTargets = useUpdateTamNhinThiPhan();
  const isNew = segment === null;
  const existing = segment ?? undefined;

  const [yearItems, setYearItems] = useState<YearItem[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<PhanKhucThiPhanFormValues>({
    resolver: zodResolver(phanKhucThiPhanSchema),
    defaultValues: {
      ten: existing?.ten ?? '',
      thu_tu: existing?.thu_tu ?? segments.length,
      loai_bieu_do: existing?.loai_bieu_do ?? 'pie',
    },
  });

  useEffect(() => {
    if (segment) {
      const items = targets
        .filter((x) => x.id_phan_khuc === segment.id)
        .sort((a, b) => a.nam - b.nam)
        .map((x) => ({ nam: x.nam, gia_tri: x.gia_tri }));
      setYearItems(items);
    } else {
      setYearItems([]);
    }
  }, [segment, targets]);

  useEffect(() => {
    reset({
      ten: existing?.ten ?? '',
      thu_tu: existing?.thu_tu ?? segments.length,
      loai_bieu_do: existing?.loai_bieu_do ?? 'pie',
    });
  }, [segment, existing, segments.length, reset]);

  const handleSaveSegmentAndValues: SubmitHandler<PhanKhucThiPhanFormValues> = async (data) => {
    const segmentId = existing?.id ?? `pk-${Date.now()}`;
    const loaiBieuDo = data.loai_bieu_do ?? 'pie';
    if (isNew) {
      const newSeg: PhanKhucThiPhan = {
        id: segmentId,
        ten: data.ten,
        thu_tu: data.thu_tu,
        loai_bieu_do: loaiBieuDo,
      };
      const nextSegments = [...segments, newSeg].sort((a, b) => a.thu_tu - b.thu_tu);
      await updateSegments.mutateAsync(nextSegments);
    } else {
      const nextSegments = segments.map((s) =>
        s.id === existing!.id ? { ...s, ten: data.ten, thu_tu: data.thu_tu, loai_bieu_do: loaiBieuDo } : s
      );
      await updateSegments.mutateAsync(nextSegments);
    }
    const otherTargets = targets.filter((x) => x.id_phan_khuc !== segmentId);
    const thisTargets: TamNhinThiPhanItem[] = yearItems.map((item) => ({
      id_phan_khuc: segmentId,
      nam: item.nam,
      gia_tri: item.gia_tri,
    }));
    await updateTargets.mutateAsync([...otherTargets, ...thisTargets]);
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

  const isLoading = updateSegments.isPending || updateTargets.isPending;

  return (
    <GenericDrawer
      title={t('suMenhTamNhin.settingsSegment')}
      icon={<PieChart size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="phan-khuc-thi-phan-settings-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="phan-khuc-thi-phan-settings-form" onSubmit={handleSubmit(handleSaveSegmentAndValues)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.segmentInfo')} variant="primary">
          <Input
            label={t('suMenhTamNhin.segmentName')}
            placeholder={t('suMenhTamNhin.segmentNamePlaceholder')}
            required
            {...register('ten')}
            error={errors.ten?.message ? t(errors.ten.message as string) : undefined}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Input
              type="number"
              min={0}
              label={t('suMenhTamNhin.order')}
              {...register('thu_tu', { valueAsNumber: true })}
              error={errors.thu_tu?.message ? t(errors.thu_tu.message as string) : undefined}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('suMenhTamNhin.chartType')}</label>
              <div className="flex gap-0.5 p-0.5 rounded-lg border border-border bg-muted/40 w-fit">
                {(['pie', 'donut'] as const).map((value) => {
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
                      {value === 'pie' ? t('suMenhTamNhin.chartPie') : t('suMenhTamNhin.chartDonut')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title={t('suMenhTamNhin.dataByYear')} variant="primary">
          <p className="text-xs text-muted-foreground mb-2">{t('suMenhTamNhin.marketSharePercent')}</p>
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
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={item.gia_tri}
                  onChange={(e) => updateRow(index, 'gia_tri', Number(e.target.value))}
                  className="h-9 flex-1 min-w-[80px] rounded-lg border border-border px-2 text-sm bg-background"
                />
                <span className="text-xs text-muted-foreground">%</span>
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

export default PhanKhucThiPhanSettingsDrawer;
