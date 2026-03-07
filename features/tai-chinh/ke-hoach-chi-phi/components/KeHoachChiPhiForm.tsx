import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, Building2, List, Plus } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import { keHoachChiPhiSchema, type KeHoachChiPhiFormValues } from '../core/schema';
import type { KeHoachChiPhi } from '../core/types';
import { THANG_KEYS } from '../core/types';
import { useCreateKeHoachChiPhi, useUpdateKeHoachChiPhi } from '../hooks/use-ke-hoach-chi-phi';
import { useDanhMucTaiChinh } from '../../danh-muc-tai-chinh/hooks/use-danh-muc-tai-chinh';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { formatCurrency } from '../../../../lib/utils';

const SO_LUONG_KEYS = ['thang_1_so_luong', 'thang_2_so_luong', 'thang_3_so_luong', 'thang_4_so_luong', 'thang_5_so_luong', 'thang_6_so_luong', 'thang_7_so_luong', 'thang_8_so_luong', 'thang_9_so_luong', 'thang_10_so_luong', 'thang_11_so_luong', 'thang_12_so_luong'] as const;

/** Hiển thị đơn giá = tiền / số lượng (tự tính). */
function TinhDonGiaThang({
  nameTien,
  nameSl,
  watch,
  formatCurrency,
  t,
}: {
  nameTien: (typeof THANG_KEYS)[number];
  nameSl: (typeof SO_LUONG_KEYS)[number];
  watch: (name: string) => unknown;
  formatCurrency: (n: number) => string;
  t: (key: string) => string;
}) {
  const tien = Number(watch(nameTien)) || 0;
  const sl = Number(watch(nameSl)) || 0;
  const donGia = sl > 0 ? tien / sl : 0;
  return (
    <div className="text-[11px] text-muted-foreground">
      {t('keHoachChiPhi.donGia')}: {donGia > 0 ? formatCurrency(donGia) : '–'}
    </div>
  );
}

interface Props {
  initialData?: KeHoachChiPhi | null;
  onClose: () => void;
  defaultNam?: number;
}

const KeHoachChiPhiForm: React.FC<Props> = ({ initialData, onClose, defaultNam }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateKeHoachChiPhi(onClose);
  const updateMutation = useUpdateKeHoachChiPhi(onClose);

  const { data: allDanhMuc = [] } = useDanhMucTaiChinh();
  const { data: departments = [] } = useDepartments();

  const phongBanOptions = useMemo(
    () => [
      { value: '', label: t('keHoachChiPhi.form.chonPhongBan') },
      ...departments.filter((d: { trang_thai?: number }) => d.trang_thai !== 0).map((d: { id: string; ten_phong_ban: string }) => ({
        value: d.id,
        label: d.ten_phong_ban,
      })),
    ],
    [departments, t]
  );

  const danhMucChiOptions = useMemo(() => {
    const list = allDanhMuc.filter((d) => d.loai === 'chi' && d.trang_thai === 1);
    return list
      .sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0) || (a.ten_danh_muc ?? '').localeCompare(b.ten_danh_muc ?? ''))
      .map((d) => ({ value: d.id, label: `${d.ma_danh_muc} - ${d.ten_danh_muc}` }));
  }, [allDanhMuc]);

  const defaultValues: Partial<KeHoachChiPhiFormValues> = {
    nam: defaultNam ?? new Date().getFullYear(),
    id_phong_ban: '',
    id_danh_muc: '',
    mo_ta: '',
    thang_1: 0,
    thang_2: 0,
    thang_3: 0,
    thang_4: 0,
    thang_5: 0,
    thang_6: 0,
    thang_7: 0,
    thang_8: 0,
    thang_9: 0,
    thang_10: 0,
    thang_11: 0,
    thang_12: 0,
    thang_1_so_luong: undefined,
    thang_2_so_luong: undefined,
    thang_3_so_luong: undefined,
    thang_4_so_luong: undefined,
    thang_5_so_luong: undefined,
    thang_6_so_luong: undefined,
    thang_7_so_luong: undefined,
    thang_8_so_luong: undefined,
    thang_9_so_luong: undefined,
    thang_10_so_luong: undefined,
    thang_11_so_luong: undefined,
    thang_12_so_luong: undefined,
    ghi_chu: null,
  };

  const { register, handleSubmit, formState: { errors }, reset, control, setValue, watch } = useForm<KeHoachChiPhiFormValues>({
    resolver: zodResolver(keHoachChiPhiSchema) as any,
    defaultValues,
  });

  const watchThang = watch(THANG_KEYS);
  const tongNam = useMemo(
    () => (watchThang ? THANG_KEYS.reduce((s, k) => s + (Number(watchThang[k]) || 0), 0) : 0),
    [watchThang]
  );

  useEffect(() => {
    if (initialData) {
      reset({
        nam: initialData.nam,
        id_phong_ban: initialData.id_phong_ban ?? '',
        id_danh_muc: initialData.id_danh_muc,
        mo_ta: initialData.mo_ta ?? '',
        thang_1: initialData.thang_1,
        thang_2: initialData.thang_2,
        thang_3: initialData.thang_3,
        thang_4: initialData.thang_4,
        thang_5: initialData.thang_5,
        thang_6: initialData.thang_6,
        thang_7: initialData.thang_7,
        thang_8: initialData.thang_8,
        thang_9: initialData.thang_9,
        thang_10: initialData.thang_10,
        thang_11: initialData.thang_11,
        thang_12: initialData.thang_12,
        thang_1_so_luong: (initialData as any).thang_1_so_luong,
        thang_2_so_luong: (initialData as any).thang_2_so_luong,
        thang_3_so_luong: (initialData as any).thang_3_so_luong,
        thang_4_so_luong: (initialData as any).thang_4_so_luong,
        thang_5_so_luong: (initialData as any).thang_5_so_luong,
        thang_6_so_luong: (initialData as any).thang_6_so_luong,
        thang_7_so_luong: (initialData as any).thang_7_so_luong,
        thang_8_so_luong: (initialData as any).thang_8_so_luong,
        thang_9_so_luong: (initialData as any).thang_9_so_luong,
        thang_10_so_luong: (initialData as any).thang_10_so_luong,
        thang_11_so_luong: (initialData as any).thang_11_so_luong,
        thang_12_so_luong: (initialData as any).thang_12_so_luong,
        ghi_chu: initialData.ghi_chu ?? null,
      });
    } else {
      reset({
        ...defaultValues,
        nam: defaultNam ?? new Date().getFullYear(),
      });
    }
  }, [initialData, defaultNam, reset]);

  const onSubmit: SubmitHandler<KeHoachChiPhiFormValues> = (data) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('keHoachChiPhi.form.editTitle') : t('keHoachChiPhi.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="ke-hoach-chi-phi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('keHoachChiPhi.form.save')}
          createLabel={t('keHoachChiPhi.form.create')}
          createIcon={<Plus className="mr-2 h-4 w-4" />}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="ke-hoach-chi-phi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('keHoachChiPhi.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('keHoachChiPhi.form.nam')}
              type="number"
              min={2000}
              max={2100}
              icon={<Calendar size={12} />}
              {...register('nam', { valueAsNumber: true })}
              error={errors.nam?.message}
            />
            <Controller
              name="id_phong_ban"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('keHoachChiPhi.form.phongBan')}
                  options={phongBanOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  icon={<Building2 size={12} />}
                />
              )}
            />
            <Controller
              name="id_danh_muc"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('keHoachChiPhi.form.danhMuc')}
                  options={[{ value: '', label: t('keHoachChiPhi.form.chonDanhMuc') }, ...danhMucChiOptions]}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  required
                  error={errors.id_danh_muc?.message}
                />
              )}
            />
            <Input
              label={t('keHoachChiPhi.form.moTa')}
              placeholder=""
              {...register('mo_ta')}
            />
            <div className="col-span-2">
              <Textarea
                label={t('keHoachChiPhi.form.ghiChu')}
                placeholder={t('keHoachChiPhi.form.ghiChuPlaceholder')}
                {...register('ghi_chu')}
                rows={2}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('keHoachChiPhi.form.detailSection')} icon={<List size={14} />} variant="primary">
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium text-foreground">{t('keHoachChiPhi.form.tongNam')}:</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(tongNam)}</span>
            <span className="text-xs text-muted-foreground">({t('keHoachChiPhi.form.tongNamFromMonths')})</span>
          </div>
          <FormGrid cols={3}>
            {THANG_KEYS.map((key, i) => {
              const slKey = SO_LUONG_KEYS[i];
              return (
                <div key={key} className="space-y-1.5 p-2 rounded-lg border border-border/60 bg-background/50">
                  <span className="text-xs font-medium text-muted-foreground">{t('keHoachChiPhi.monthShort', { n: i + 1 })}</span>
                  <Controller
                    name={key}
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        label=""
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        suffix=""
                      />
                    )}
                  />
                  <Input
                    label=""
                    placeholder={t('keHoachChiPhi.soLuong')}
                    type="number"
                    min={0}
                    step={1}
                    className="tabular-nums"
                    {...register(slKey, { setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v)) })}
                  />
                  <TinhDonGiaThang nameTien={key} nameSl={slKey} watch={watch} formatCurrency={formatCurrency} t={t} />
                </div>
              );
            })}
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default KeHoachChiPhiForm;
