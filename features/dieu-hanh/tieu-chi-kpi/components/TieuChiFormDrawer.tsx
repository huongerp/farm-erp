import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Gauge } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_FORM } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import {
  tieuChiKpiFormSchema,
  type TieuChiKpiFormValues,
} from '../core/schema';
import type { TieuChiKpi } from '../core/types';
import {
  LOAI_DO_LUONG_VALUES,
  LOAI_DO_LUONG_LABEL_KEYS,
  TAN_SUAT_VALUES,
  TAN_SUAT_LABEL_KEYS,
  TY_TRONG_SUM_MIN,
  TY_TRONG_SUM_MAX,
} from '../core/constants';
import type { LoaiDoLuong, TanSuat } from '../core/types';
import type { HanhDongCotLoi } from '../../hanh-dong-cot-loi/core/types';
import type { DonViTinh, CachTinhDiem } from '../core/types';
import { useCreateTieuChiKpi, useUpdateTieuChiKpi } from '../hooks/use-tieu-chi-kpi';

interface Props {
  initialData?: TieuChiKpi | null;
  fixedHanhDongId?: string | null;
  hanhDongList: HanhDongCotLoi[];
  donViTinhList: DonViTinh[];
  cachTinhDiemList: CachTinhDiem[];
  existingTieuChiForSum: TieuChiKpi[];
  onClose: () => void;
}

const TieuChiFormDrawer: React.FC<Props> = ({
  initialData,
  fixedHanhDongId,
  hanhDongList,
  donViTinhList,
  cachTinhDiemList,
  existingTieuChiForSum,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateTieuChiKpi(onClose);
  const updateMutation = useUpdateTieuChiKpi(onClose);

  const hanhDongOptions = useMemo(
    () => hanhDongList.map((h) => ({ value: h.id, label: h.ten })),
    [hanhDongList]
  );

  const dvtOptions = useMemo(
    () => donViTinhList.map((d) => ({ value: d.ma, label: `${d.ten}${d.ky_hieu ? ` (${d.ky_hieu})` : ''}` })),
    [donViTinhList]
  );

  const ctdOptions = useMemo(
    () => cachTinhDiemList.map((c) => ({ value: c.ma, label: c.ten })),
    [cachTinhDiemList]
  );

  const loaiOptions = useMemo(
    () =>
      LOAI_DO_LUONG_VALUES.map((l) => ({
        value: l,
        label: t(LOAI_DO_LUONG_LABEL_KEYS[l]),
      })),
    [t]
  );

  const tanSuatOptions = useMemo(
    () =>
      TAN_SUAT_VALUES.map((s) => ({
        value: s,
        label: t(TAN_SUAT_LABEL_KEYS[s]),
      })),
    [t]
  );

  const defaultValues: Partial<TieuChiKpiFormValues> = {
    id_hanh_dong: fixedHanhDongId ?? hanhDongOptions[0]?.value ?? '',
    ma: '',
    ten: '',
    mo_ta: '',
    don_vi_tinh: dvtOptions[0]?.value ?? '',
    loai: 'xuoi',
    gia_tri_muc_tieu: 0,
    gia_tri_toi_thieu: null,
    cach_tinh_diem: ctdOptions[0]?.value ?? '',
    tan_suat: 'quy',
    ty_trong: 0,
    thu_tu: 0,
    nguon_du_lieu: '',
    ghi_chu: '',
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<
    TieuChiKpiFormValues
  >({
    resolver: zodResolver(tieuChiKpiFormSchema) as any,
    defaultValues,
  });

  const idHanhDong = watch('id_hanh_dong');
  const tyTrong = watch('ty_trong');

  const { sumTyTrong, isValidSum } = useMemo(() => {
    const siblings = existingTieuChiForSum.filter(
      (t) => t.id_hanh_dong === idHanhDong && t.id !== initialData?.id
    );
    const otherSum = siblings.reduce((s, t) => s + t.ty_trong, 0);
    const sum = otherSum + (tyTrong ?? 0);
    return {
      sumTyTrong: sum,
      isValidSum: sum >= TY_TRONG_SUM_MIN && sum <= TY_TRONG_SUM_MAX,
    };
  }, [existingTieuChiForSum, idHanhDong, initialData?.id, tyTrong]);

  useEffect(() => {
    if (initialData) {
      reset({
        id_hanh_dong: initialData.id_hanh_dong,
        ma: initialData.ma ?? '',
        ten: initialData.ten,
        mo_ta: initialData.mo_ta ?? '',
        don_vi_tinh: initialData.don_vi_tinh,
        loai: initialData.loai,
        gia_tri_muc_tieu: initialData.gia_tri_muc_tieu,
        gia_tri_toi_thieu: initialData.gia_tri_toi_thieu ?? null,
        cach_tinh_diem: initialData.cach_tinh_diem,
        tan_suat: initialData.tan_suat,
        ty_trong: initialData.ty_trong,
        thu_tu: initialData.thu_tu ?? 0,
        nguon_du_lieu: initialData.nguon_du_lieu ?? '',
        ghi_chu: initialData.ghi_chu ?? '',
      });
    } else if (fixedHanhDongId) {
      reset({
        ...defaultValues,
        id_hanh_dong: fixedHanhDongId,
      });
    } else if (hanhDongOptions.length) {
      reset({
        ...defaultValues,
        id_hanh_dong: hanhDongOptions[0].value,
      });
    }
  }, [initialData, fixedHanhDongId, hanhDongOptions.length]);

  const onSubmit: SubmitHandler<TieuChiKpiFormValues> = async (data) => {
    if (!isValidSum) return;
    if (isEdit && initialData) {
      await updateMutation.mutateAsync({ id: initialData.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('tieuChiKpi.form.editTitle') : t('tieuChiKpi.form.createTitle')}
      subtitle={initialData?.ten}
      icon={<Gauge size={18} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="tieu-chi-kpi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="tieu-chi-kpi-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 p-4"
      >
        <FormSection title={t('tieuChiKpi.form.sectionBasic')}>
          <FormGrid cols={2}>
            {!fixedHanhDongId && (
              <div className="col-span-2">
                <Controller
                  name="id_hanh_dong"
                  control={control}
                  render={({ field }) => (
                    <Select
                      ref={field.ref}
                      label={t('tieuChiKpi.form.hanhDong')}
                      required
                      options={hanhDongOptions}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={errors.id_hanh_dong?.message}
                    />
                  )}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('tieuChiKpi.form.hanhDongHint')}
                </p>
              </div>
            )}
            <Input
              label={t('tieuChiKpi.form.ma')}
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('tieuChiKpi.form.ten')}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <div className="col-span-2">
              <Textarea
                label={t('tieuChiKpi.form.moTa')}
                {...register('mo_ta')}
                error={errors.mo_ta?.message}
                rows={3}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('tieuChiKpi.form.sectionDoLuong')}>
          <FormGrid cols={2}>
            <Controller
              name="don_vi_tinh"
              control={control}
              render={({ field }) => (
                <Select
                  ref={field.ref}
                  label={t('tieuChiKpi.form.donViTinh')}
                  required
                  options={dvtOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.don_vi_tinh?.message}
                />
              )}
            />
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <Select
                  ref={field.ref}
                  label={t('tieuChiKpi.form.loai')}
                  required
                  options={loaiOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.loai?.message}
                />
              )}
            />
            <Controller
              name="gia_tri_muc_tieu"
              control={control}
              render={({ field }) => (
                <Input
                  label={t('tieuChiKpi.form.giaTriMucTieu')}
                  required
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.valueAsNumber ?? 0)}
                  error={errors.gia_tri_muc_tieu?.message}
                />
              )}
            />
            <Controller
              name="gia_tri_toi_thieu"
              control={control}
              render={({ field }) => (
                <Input
                  label={t('tieuChiKpi.form.giaTriToiThieu')}
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.valueAsNumber ?? null)}
                  error={errors.gia_tri_toi_thieu?.message}
                />
              )}
            />
            <Controller
              name="cach_tinh_diem"
              control={control}
              render={({ field }) => (
                <Select
                  ref={field.ref}
                  label={t('tieuChiKpi.form.cachTinhDiem')}
                  required
                  options={ctdOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.cach_tinh_diem?.message}
                />
              )}
            />
            <Controller
              name="tan_suat"
              control={control}
              render={({ field }) => (
                <Select
                  ref={field.ref}
                  label={t('tieuChiKpi.form.tanSuat')}
                  required
                  options={tanSuatOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.tan_suat?.message}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('tieuChiKpi.form.sectionTyTrong')}>
          <FormGrid cols={2}>
            <div>
              <Controller
                name="ty_trong"
                control={control}
                render={({ field }) => (
                  <>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('tieuChiKpi.form.tyTrong')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.valueAsNumber ?? 0)}
                    />
                    {errors.ty_trong && (
                      <p className="text-xs text-rose-600 mt-1">{errors.ty_trong.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                {t('tieuChiKpi.form.tyTrongSum')}
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isValidSum ? 'text-foreground' : 'text-amber-600'
                }`}
              >
                {sumTyTrong.toFixed(2)}%
              </span>
              {!isValidSum && idHanhDong && (
                <p className="text-xs text-amber-600">
                  Tổng tỷ trọng theo hành động phải bằng 100%. Hãy điều chỉnh hoặc dùng Cân bằng lại sau khi lưu.
                </p>
              )}
            </div>
            <Controller
              name="thu_tu"
              control={control}
              render={({ field }) => (
                <Input
                  label={t('tieuChiKpi.form.thuTu')}
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  error={errors.thu_tu?.message}
                />
              )}
            />
            <div className="col-span-2">
              <Input
                label={t('tieuChiKpi.form.nguonDuLieu')}
                {...register('nguon_du_lieu')}
                error={errors.nguon_du_lieu?.message}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label={t('tieuChiKpi.form.ghiChu')}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
                rows={2}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TieuChiFormDrawer;
