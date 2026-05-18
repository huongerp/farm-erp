import React, { useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Boxes } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import { duBaoSlDongThungFormSchema, type DuBaoSlDongThungFormValues } from '../core/schema';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { defaultFormValues, farmDuBaoSlDongThungToForm, computeKpiFromForm } from '../core/form-mappers';
import { useCreateDuBaoSlDongThung, useUpdateDuBaoSlDongThung } from '../hooks/use-du-bao-sl-dong-thung';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TRANG_THAI } from '../../../../lib/constants';
import GenericDrawer, { DRAWER_WIDTH_BAO_CAO_NHAN_CONG } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  branches: Branch[];
  initialData?: FarmDuBaoSlDongThung | null;
  preferredBranch?: { id_chi_nhanh: string; ten_chi_nhanh: string } | null;
  onClose: () => void;
  /** Chỉ quản trị mới được nhập dòng 10–14 (phần thực tế). */
  canAdmin?: boolean;
}

const inputCell = 'bg-amber-50/80 dark:bg-amber-950/25';

const DuBaoSlDongThungForm: React.FC<Props> = ({ branches, initialData, preferredBranch, onClose, canAdmin = false }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDuBaoSlDongThung(onClose);
  const updateMutation = useUpdateDuBaoSlDongThung(onClose);

  const branchComboboxOptions = useMemo(() => {
    const active = branches.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG);
    const opts = active.map((b) => ({
      value: b.id,
      label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}`,
      subLabel: b.ma_chi_nhanh,
    }));
    if (initialData?.id_chi_nhanh && initialData.ten_chi_nhanh) {
      const idStr = String(initialData.id_chi_nhanh);
      if (!opts.some((o) => String(o.value) === idStr)) {
        opts.unshift({
          value: idStr,
          label: `${initialData.ten_chi_nhanh} (${t('duBaoSlDongThung.form.branchInactiveHint')})`,
          subLabel: '',
        });
      }
    }
    return opts;
  }, [branches, initialData?.id_chi_nhanh, initialData?.ten_chi_nhanh, t]);

  const defaultValues = useMemo(() => {
    if (initialData) return farmDuBaoSlDongThungToForm(initialData);
    const base = defaultFormValues();
    if (preferredBranch?.id_chi_nhanh) {
      return {
        ...base,
        id_chi_nhanh: preferredBranch.id_chi_nhanh,
        ten_chi_nhanh: preferredBranch.ten_chi_nhanh,
      };
    }
    return base;
  }, [initialData, preferredBranch?.id_chi_nhanh, preferredBranch?.ten_chi_nhanh]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DuBaoSlDongThungFormValues>({
    resolver: zodResolver(duBaoSlDongThungFormSchema) as any,
    defaultValues,
  });

  const idChiNhanh = watch('id_chi_nhanh');
  const watched = watch();
  const kpi = computeKpiFromForm(watched);

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!idChiNhanh) {
      setValue('ten_chi_nhanh', '');
      return;
    }
    const b = branches.find((x) => String(x.id) === String(idChiNhanh));
    if (b) setValue('ten_chi_nhanh', b.ten_chi_nhanh);
  }, [idChiNhanh, branches, setValue]);

  const onSubmit: SubmitHandler<DuBaoSlDongThungFormValues> = (data) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
      return;
    }
    createMutation.mutate(data);
  };

  const readOnlyNum = useCallback((n: number | null, bold?: boolean) => {
    const text = n == null ? '—' : formatNumberVN(n);
    return (
      <span
        className={cn(
          'block w-full text-right tabular-nums text-sm py-1.5 px-2',
          bold ? 'font-bold text-primary' : 'font-medium text-foreground'
        )}
      >
        {text}
      </span>
    );
  }, []);

  return (
    <GenericDrawer
      onClose={onClose}
      title={isEdit ? t('duBaoSlDongThung.form.editTitle') : t('duBaoSlDongThung.form.createTitle')}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_NHAN_CONG}
      icon={<Boxes size={18} />}
      footer={
        <FormDrawerFooter
          onCancel={onClose}
          formId="dbdt-form"
          isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
          isEdit={isEdit}
        />
      }
    >
      <form id="dbdt-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('duBaoSlDongThung.form.ngay')} icon={<Building2 size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="ngay"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  label={t('duBaoSlDongThung.form.ngay')}
                  required
                  error={errors.ngay?.message}
                />
              )}
            />
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('duBaoSlDongThung.form.branch')}
                  options={branchComboboxOptions}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v ? String(v) : '')}
                  placeholder={t('duBaoSlDongThung.form.branchPlaceholder')}
                  searchPlaceholder={t('duBaoSlDongThung.form.branchPlaceholder')}
                  required
                  error={errors.id_chi_nhanh?.message as string | undefined}
                />
              )}
            />
          </FormGrid>
          <Controller
            name="ghi_chu"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value ?? ''}
                label={t('duBaoSlDongThung.form.ghiChuPhieu')}
                rows={4}
                className="mt-3 min-h-[6rem] whitespace-pre-wrap w-full max-w-none"
              />
            )}
          />
        </FormSection>

        <FormSection title={t('duBaoSlDongThung.form.sectionBangTinh')} icon={<Boxes size={14} />} variant="primary">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[42rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-center px-2 py-2 font-medium w-12">{t('duBaoSlDongThung.form.colStt')}</th>
                  <th className="text-left px-3 py-2 font-medium min-w-[12rem]">{t('duBaoSlDongThung.form.colHangMuc')}</th>
                  <th className="text-right px-2 py-2 font-medium min-w-[8rem]">{t('duBaoSlDongThung.form.colGiaTri')}</th>
                  <th className="text-left px-2 py-2 font-medium w-28">{t('duBaoSlDongThung.form.colDonVi')}</th>
                  <th className="text-left px-2 py-2 font-medium min-w-[14rem]">{t('duBaoSlDongThung.form.colGhiChu')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">1</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row1')}</td>
                  <td className={cn('px-1 py-1', inputCell)}>
                    <Controller
                      name="so_buong_can_mau"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          compact
                          value={field.value}
                          onChange={(n) => field.onChange(Math.max(0, Math.floor(n)))}
                          maxFractionDigits={0}
                          className="border-0 bg-transparent shadow-none"
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row1Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">2</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row2')}</td>
                  <td className={cn('px-1 py-1', inputCell)}>
                    <Controller
                      name="tong_can_nang_mau"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          compact
                          value={field.value}
                          onChange={field.onChange}
                          maxFractionDigits={4}
                          className="border-0 bg-transparent shadow-none"
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row2Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">3</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row3')}</td>
                  <td className="px-2 py-2">{readOnlyNum(kpi.can_nang_binh_quan_buong)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerBuong')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row3Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">4</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row4')}</td>
                  <td className={cn('px-1 py-1', inputCell)}>
                    <Controller
                      name="tong_buong_nhap_ke_hoach"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          compact
                          value={field.value}
                          onChange={(n) => field.onChange(Math.max(0, Math.floor(n)))}
                          maxFractionDigits={0}
                          className="border-0 bg-transparent shadow-none"
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row4Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">5</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row5')}</td>
                  <td className="px-2 py-2">{readOnlyNum(kpi.tong_khoi_luong_ke_hoach)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row5Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">6</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row6')}</td>
                  <td className={cn('px-1 py-1', inputCell)}>
                    <Controller
                      name="ty_le_thu_hoi_ke_hoach_pct"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          compact
                          value={field.value}
                          onChange={(n) => field.onChange(Math.min(100, Math.max(0, n)))}
                          max={100}
                          maxFractionDigits={2}
                          className="border-0 bg-transparent shadow-none"
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitPercent')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row6Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">7</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row7')}</td>
                  <td className="px-2 py-2">{readOnlyNum(kpi.khoi_luong_dong_thung_ke_hoach)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row7Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">8</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row8')}</td>
                  <td className={cn('px-1 py-1', inputCell)}>
                    <Controller
                      name="quy_cach_dong_thung_ke_hoach"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          compact
                          value={field.value}
                          onChange={field.onChange}
                          maxFractionDigits={4}
                          className="border-0 bg-transparent shadow-none"
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerThung')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row8Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-primary/10 dark:bg-primary/15">
                  <td className="px-2 py-2 text-center font-bold text-primary tabular-nums">9</td>
                  <td className="px-3 py-2 font-bold text-primary">{t('duBaoSlDongThung.form.row9')}</td>
                  <td className="px-2 py-2">{readOnlyNum(kpi.tong_so_thung_ke_hoach, true)}</td>
                  <td className="px-2 py-2 font-medium text-primary">{t('duBaoSlDongThung.form.unitThung')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row9Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">10</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row10')}</td>
                  <td className={cn('px-1 py-1', canAdmin && inputCell)}>
                    {canAdmin ? (
                      <Controller
                        name="tong_buong_nhap_thuc_te"
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            compact
                            value={field.value}
                            onChange={(n) => field.onChange(Math.max(0, Math.floor(n)))}
                            maxFractionDigits={0}
                            className="border-0 bg-transparent shadow-none"
                          />
                        )}
                      />
                    ) : (
                      readOnlyNum(watched.tong_buong_nhap_thuc_te)
                    )}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row10Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">11</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row11')}</td>
                  <td className="px-2 py-2">{readOnlyNum(kpi.tong_khoi_luong_thuc_te)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row11Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">12</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row12')}</td>
                  <td className={cn('px-1 py-1', canAdmin && inputCell)}>
                    {canAdmin ? (
                      <Controller
                        name="ty_le_thu_hoi_thuc_te_pct"
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            compact
                            value={field.value}
                            onChange={(n) => field.onChange(Math.min(100, Math.max(0, n)))}
                            max={100}
                            maxFractionDigits={2}
                            className="border-0 bg-transparent shadow-none"
                          />
                        )}
                      />
                    ) : (
                      readOnlyNum(watched.ty_le_thu_hoi_thuc_te_pct)
                    )}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitPercent')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row12Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">13</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row13')}</td>
                  <td className="px-2 py-2">{readOnlyNum(kpi.khoi_luong_dong_thung_thuc_te)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row13Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">14</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row14')}</td>
                  <td className={cn('px-1 py-1', canAdmin && inputCell)}>
                    {canAdmin ? (
                      <Controller
                        name="quy_cach_dong_thung_thuc_te"
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            compact
                            value={field.value}
                            onChange={field.onChange}
                            maxFractionDigits={4}
                            className="border-0 bg-transparent shadow-none"
                          />
                        )}
                      />
                    ) : (
                      readOnlyNum(watched.quy_cach_dong_thung_thuc_te)
                    )}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerThung')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row14Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-primary/15 dark:bg-primary/20 last:border-0">
                  <td className="px-2 py-2 text-center font-bold text-primary tabular-nums">15</td>
                  <td className="px-3 py-2 font-bold text-primary">{t('duBaoSlDongThung.form.row15')}</td>
                  <td className="px-2 py-2">{readOnlyNum(kpi.tong_so_thung_thuc_te, true)}</td>
                  <td className="px-2 py-2 font-medium text-primary">{t('duBaoSlDongThung.form.unitThung')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground leading-snug">{t('duBaoSlDongThung.form.row15Note')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DuBaoSlDongThungForm;
