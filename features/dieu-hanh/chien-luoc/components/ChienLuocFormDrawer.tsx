import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Target, Grid3X3, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import { chienLuocFormSchema, type ChienLuocFormValues } from '../core/schema';
import type { ChienLuoc, LoaiTows } from '../core/types';
import { LOAI_TOWS } from '../core/constants';
import { TRANG_THAI_DUYET_LABEL_KEYS, TRANG_THAI_TRIEN_KHAI_LABEL_KEYS } from '../core/constants';
import type { TrangThaiDuyet, TrangThaiTrienKhai } from '../core/types';
import { useCreateChienLuoc, useUpdateChienLuoc, useSwotByYear } from '../hooks/use-chien-luoc';
import { useLoaiChienLuocList } from '../hooks/use-thiet-lap-chien-luoc';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_FORM } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import SwotReferencePanel from './SwotReferencePanel';
import StrategySuggestionPanel from './StrategySuggestionPanel';
const currentYear = new Date().getFullYear();

interface Props {
  initialData?: ChienLuoc | null;
  onClose: () => void;
}

const ChienLuocFormDrawer: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateChienLuoc(onClose);
  const updateMutation = useUpdateChienLuoc(onClose);
  const { data: loaiChienLuocList = [] } = useLoaiChienLuocList();

  const [showSwotPopup, setShowSwotPopup] = useState(false);
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);

  const nhomChienLuocOptions = useMemo(() => {
    return loaiChienLuocList
      .filter((x) => x.nhom !== 'tows')
      .map((x) => ({ value: x.ma, label: x.ten }));
  }, [loaiChienLuocList]);

  const defaultValues: Partial<ChienLuocFormValues> = {
    nam: currentYear,
    ma: '',
    ten: '',
    mo_ta: '',
    loai_tows: 'SO',
    nhom_chien_luoc: nhomChienLuocOptions[0]?.value ?? '',
    id_swot_analysis: null,
    id_strengths: [],
    id_weaknesses: [],
    id_opportunities: [],
    id_threats: [],
    trang_thai_duyet: 'cho_duyet',
    trang_thai_trien_khai: 'chua_bat_dau',
    id_nguoi_phu_trach: null,
    ngay_bat_dau: null,
    ngay_ket_thuc: null,
    uu_tien: null,
    ghi_chu: null,
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<ChienLuocFormValues>({
    resolver: zodResolver(chienLuocFormSchema) as any,
    defaultValues,
  });

  const nam = watch('nam');
  const watchedStrengths = watch('id_strengths') ?? [];
  const watchedWeaknesses = watch('id_weaknesses') ?? [];
  const watchedOpportunities = watch('id_opportunities') ?? [];
  const watchedThreats = watch('id_threats') ?? [];
  const watchedTows = watch('loai_tows');
  const watchedNhom = watch('nhom_chien_luoc');

  const { data: swotByYear } = useSwotByYear(nam ?? currentYear);

  const totalSwotSelected = watchedStrengths.length + watchedWeaknesses.length + watchedOpportunities.length + watchedThreats.length;

  useEffect(() => {
    if (swotByYear && !initialData) {
      setValue('id_swot_analysis', swotByYear.id);
    }
  }, [swotByYear?.id, initialData, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        nam: initialData.nam,
        ma: initialData.ma ?? '',
        ten: initialData.ten,
        mo_ta: initialData.mo_ta ?? '',
        loai_tows: initialData.loai_tows,
        nhom_chien_luoc: initialData.nhom_chien_luoc,
        id_swot_analysis: initialData.id_swot_analysis ?? null,
        id_strengths: initialData.id_strengths ?? [],
        id_weaknesses: initialData.id_weaknesses ?? [],
        id_opportunities: initialData.id_opportunities ?? [],
        id_threats: initialData.id_threats ?? [],
        trang_thai_duyet: initialData.trang_thai_duyet,
        trang_thai_trien_khai: initialData.trang_thai_trien_khai,
        id_nguoi_phu_trach: initialData.id_nguoi_phu_trach ?? null,
        ngay_bat_dau: initialData.ngay_bat_dau ?? null,
        ngay_ket_thuc: initialData.ngay_ket_thuc ?? null,
        uu_tien: initialData.uu_tien ?? null,
        ghi_chu: initialData.ghi_chu ?? null,
      });
    } else if (nhomChienLuocOptions.length) {
      reset({
        ...defaultValues,
        nhom_chien_luoc: nhomChienLuocOptions[0].value,
      });
    }
  }, [initialData, nhomChienLuocOptions.length]);

  const onSubmit: SubmitHandler<ChienLuocFormValues> = async (data) => {
    if (isEdit && initialData) {
      await updateMutation.mutateAsync({ id: initialData.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const toggleArrayItem = useCallback(
    (field: 'id_strengths' | 'id_weaknesses' | 'id_opportunities' | 'id_threats', id: string) => {
      const current: string[] = watch(field) ?? [];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      setValue(field, next, { shouldDirty: true });
    },
    [watch, setValue]
  );

  const handleSelectSuggestion = useCallback(
    (tows: LoaiTows, nhomMa: string) => {
      setValue('loai_tows', tows, { shouldDirty: true });
      setValue('nhom_chien_luoc', nhomMa, { shouldDirty: true });
    },
    [setValue]
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <GenericDrawer
        title={isEdit ? t('chienLuoc.form.editTitle') : t('chienLuoc.form.createTitle')}
        subtitle={initialData?.ten}
        icon={<Target size={18} />}
        onClose={onClose}
        footer={
          <FormDrawerFooter
            formId="chien-luoc-form"
            onCancel={onClose}
            isLoading={isLoading}
            isEdit={isEdit}
          />
        }
        maxWidthClass={DRAWER_WIDTH_FORM}
      >
        <form
          id="chien-luoc-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 p-4"
        >
          <FormSection title={t('chienLuoc.form.sectionBasic')}>
            <FormGrid col={2}>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {t('chienLuoc.form.nam')} <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="nam"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {Array.from({ length: 10 }, (_, i) => currentYear - 2 + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <Input
                label={t('chienLuoc.form.ten')}
                required
                {...register('ten')}
                error={errors.ten?.message}
              />
              <Input
                label={t('chienLuoc.form.ma')}
                {...register('ma')}
                error={errors.ma?.message}
                className="col-span-2"
              />
              <div className="col-span-2">
                <Textarea
                  label={t('chienLuoc.form.moTa')}
                  {...register('mo_ta')}
                  error={errors.mo_ta?.message}
                  rows={3}
                />
              </div>
            </FormGrid>
          </FormSection>

          <FormSection title={t('chienLuoc.form.sectionTows')}>
            <FormGrid col={2}>
              <Controller
                name="loai_tows"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('chienLuoc.form.loaiTows')}
                    </label>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {LOAI_TOWS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <Controller
                name="nhom_chien_luoc"
                control={control}
                render={({ field }) => (
                  <Select
                    ref={field.ref}
                    label={t('chienLuoc.form.nhomChienLuoc')}
                    options={nhomChienLuocOptions}
                    value={field.value || (nhomChienLuocOptions[0]?.value ?? '')}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </FormGrid>

            {/* Action buttons for SWOT reference & strategy suggestions */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowSwotPopup(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all text-sm group"
              >
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Grid3X3 size={14} className="text-primary" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block text-xs">{t('chienLuoc.form.btnSwot')}</span>
                  {totalSwotSelected > 0 && (
                    <span className="text-[10px] text-primary font-medium">
                      {t('chienLuoc.form.swotSelectedCount', { count: totalSwotSelected })}
                    </span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowSuggestionPopup(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all text-sm group"
              >
                <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Sparkles size={14} className="text-amber-600" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block text-xs">{t('chienLuoc.form.btnSuggestion')}</span>
                </div>
              </button>
            </div>
          </FormSection>

          <FormSection title={t('chienLuoc.form.sectionStatus')}>
            <FormGrid col={2}>
              <Controller
                name="trang_thai_duyet"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('chienLuoc.form.trangThaiDuyet')}
                    </label>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {(['cho_duyet', 'da_duyet', 'khong_duyet'] as TrangThaiDuyet[]).map((v) => (
                        <option key={v} value={v}>{t(TRANG_THAI_DUYET_LABEL_KEYS[v])}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <Controller
                name="trang_thai_trien_khai"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('chienLuoc.form.trangThaiTrienKhai')}
                    </label>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {(
                        [
                          'chua_bat_dau',
                          'dang_trien_khai',
                          'tam_ngung',
                          'hoan_thanh',
                          'huy',
                        ] as TrangThaiTrienKhai[]
                      ).map((v) => (
                        <option key={v} value={v}>{t(TRANG_THAI_TRIEN_KHAI_LABEL_KEYS[v])}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <Input
                label={t('chienLuoc.form.ngayBatDau')}
                type="date"
                {...register('ngay_bat_dau')}
                error={errors.ngay_bat_dau?.message}
              />
              <Input
                label={t('chienLuoc.form.ngayKetThuc')}
                type="date"
                {...register('ngay_ket_thuc')}
                error={errors.ngay_ket_thuc?.message}
              />
              <Controller
                name="uu_tien"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('chienLuoc.form.uuTien')}
                    </label>
                    <select
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <div className="col-span-2">
                <Textarea
                  label={t('chienLuoc.form.ghiChu')}
                  {...register('ghi_chu')}
                  error={errors.ghi_chu?.message}
                  rows={2}
                />
              </div>
            </FormGrid>
          </FormSection>
        </form>
      </GenericDrawer>

      {/* SWOT Popup */}
      <AnimatePresence>
        {showSwotPopup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSwotPopup(false)}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-card rounded-xl shadow-2xl border border-border/40 w-full max-w-2xl max-h-[85vh] flex flex-col outline-none"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Grid3X3 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('chienLuoc.swotPanel.title', { nam: nam ?? currentYear })}
                    </h3>
                    {totalSwotSelected > 0 && (
                      <p className="text-[11px] text-primary font-medium">
                        {t('chienLuoc.form.swotSelectedCount', { count: totalSwotSelected })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowSwotPopup(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                <SwotReferencePanel
                  swotData={swotByYear}
                  selectedStrengths={watchedStrengths}
                  selectedWeaknesses={watchedWeaknesses}
                  selectedOpportunities={watchedOpportunities}
                  selectedThreats={watchedThreats}
                  onToggleStrength={(id) => toggleArrayItem('id_strengths', id)}
                  onToggleWeakness={(id) => toggleArrayItem('id_weaknesses', id)}
                  onToggleOpportunity={(id) => toggleArrayItem('id_opportunities', id)}
                  onToggleThreat={(id) => toggleArrayItem('id_threats', id)}
                  year={nam ?? currentYear}
                />
              </div>
              <div className="px-5 py-3 border-t border-border shrink-0 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSwotPopup(false)}
                  className="text-sm border-border"
                >
                  {t('common.close')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Strategy Suggestion Popup */}
      <AnimatePresence>
        {showSuggestionPopup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuggestionPopup(false)}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-card rounded-xl shadow-2xl border border-border/40 w-full max-w-2xl max-h-[85vh] flex flex-col outline-none"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('chienLuoc.suggestion.title')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSuggestionPopup(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                <StrategySuggestionPanel
                  selectedStrengths={watchedStrengths}
                  selectedWeaknesses={watchedWeaknesses}
                  selectedOpportunities={watchedOpportunities}
                  selectedThreats={watchedThreats}
                  loaiChienLuocList={loaiChienLuocList}
                  currentTows={watchedTows}
                  currentNhom={watchedNhom}
                  onSelectSuggestion={(tows, nhomMa) => {
                    handleSelectSuggestion(tows, nhomMa);
                    setShowSuggestionPopup(false);
                  }}
                />
              </div>
              <div className="px-5 py-3 border-t border-border shrink-0 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSuggestionPopup(false)}
                  className="text-sm border-border"
                >
                  {t('common.close')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChienLuocFormDrawer;
