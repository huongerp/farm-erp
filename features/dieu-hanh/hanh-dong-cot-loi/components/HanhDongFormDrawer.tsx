import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Zap } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_FORM } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import {
  hanhDongCotLoiFormSchema,
  type HanhDongCotLoiFormValues,
} from '../core/schema';
import type { HanhDongCotLoi } from '../core/types';
import { BSC_DIMENSIONS, BSC_LABEL_KEYS, TY_TRONG_SUM_MIN, TY_TRONG_SUM_MAX } from '../core/constants';
import type { BscDimension } from '../core/types';
import type { NhomHanhDong } from '../core/types';
import type { ChienLuoc } from '../../chien-luoc/core/types';
import { useCreateHanhDongCotLoi, useUpdateHanhDongCotLoi } from '../hooks/use-hanh-dong-cot-loi';

interface Props {
  initialData?: HanhDongCotLoi | null;
  fixedChienLuocId?: string | null;
  chienLuocDaDuyet: ChienLuoc[];
  nhomHanhDongList: NhomHanhDong[];
  existingHanhDongForSum: HanhDongCotLoi[];
  onClose: () => void;
}

const HanhDongFormDrawer: React.FC<Props> = ({
  initialData,
  fixedChienLuocId,
  chienLuocDaDuyet,
  nhomHanhDongList,
  existingHanhDongForSum,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateHanhDongCotLoi(onClose);
  const updateMutation = useUpdateHanhDongCotLoi(onClose);

  const chienLuocOptions = useMemo(
    () =>
      chienLuocDaDuyet.map((c) => ({
        value: c.id,
        label: `${c.ten} (${c.nam})`,
      })),
    [chienLuocDaDuyet]
  );

  const nhomOptions = useMemo(
    () => nhomHanhDongList.map((n) => ({ value: n.ma, label: n.ten })),
    [nhomHanhDongList]
  );

  const bscOptions = useMemo(
    () =>
      BSC_DIMENSIONS.map((d) => ({
        value: d,
        label: t(BSC_LABEL_KEYS[d as BscDimension]),
      })),
    [t]
  );

  const defaultValues: Partial<HanhDongCotLoiFormValues> = {
    id_chien_luoc: fixedChienLuocId ?? chienLuocOptions[0]?.value ?? '',
    ma: '',
    ten: '',
    mo_ta: '',
    bsc_dimension: 'tai_chinh',
    nhom_hanh_dong: nhomOptions[0]?.value ?? '',
    ty_trong: 0,
    thu_tu: 0,
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<
    HanhDongCotLoiFormValues
  >({
    resolver: zodResolver(hanhDongCotLoiFormSchema) as any,
    defaultValues,
  });

  const idChienLuoc = watch('id_chien_luoc');
  const tyTrong = watch('ty_trong');

  const { sumTyTrong, isValidSum } = useMemo(() => {
    const siblings = existingHanhDongForSum.filter(
      (h) => h.id_chien_luoc === idChienLuoc && h.id !== initialData?.id
    );
    const otherSum = siblings.reduce((s, h) => s + h.ty_trong, 0);
    const sum = otherSum + (tyTrong ?? 0);
    return {
      sumTyTrong: sum,
      isValidSum: sum >= TY_TRONG_SUM_MIN && sum <= TY_TRONG_SUM_MAX,
    };
  }, [existingHanhDongForSum, idChienLuoc, initialData?.id, tyTrong]);

  useEffect(() => {
    if (initialData) {
      reset({
        id_chien_luoc: initialData.id_chien_luoc,
        ma: initialData.ma ?? '',
        ten: initialData.ten,
        mo_ta: initialData.mo_ta ?? '',
        bsc_dimension: initialData.bsc_dimension,
        nhom_hanh_dong: initialData.nhom_hanh_dong,
        ty_trong: initialData.ty_trong,
        thu_tu: initialData.thu_tu ?? 0,
      });
    } else if (fixedChienLuocId) {
      reset({
        ...defaultValues,
        id_chien_luoc: fixedChienLuocId,
      });
    } else if (chienLuocOptions.length) {
      reset({
        ...defaultValues,
        id_chien_luoc: chienLuocOptions[0].value,
      });
    }
  }, [initialData, fixedChienLuocId, chienLuocOptions.length]);

  const onSubmit: SubmitHandler<HanhDongCotLoiFormValues> = async (data) => {
    if (!isValidSum) {
      return;
    }
    if (isEdit && initialData) {
      await updateMutation.mutateAsync({ id: initialData.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const canSubmit = isValidSum;

  return (
    <GenericDrawer
      title={isEdit ? t('hanhDongCotLoi.form.editTitle') : t('hanhDongCotLoi.form.createTitle')}
      subtitle={initialData?.ten}
      icon={<Zap size={18} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="hanh-dong-cot-loi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="hanh-dong-cot-loi-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 p-4"
      >
        <FormSection title={t('hanhDongCotLoi.form.sectionBasic')}>
          <FormGrid col={2}>
            {!fixedChienLuocId && (
              <div className="col-span-2">
                <Controller
                  name="id_chien_luoc"
                  control={control}
                  render={({ field }) => (
                    <Select
                      ref={field.ref}
                      label={t('hanhDongCotLoi.form.chienLuoc')}
                      required
                      options={chienLuocOptions}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={errors.id_chien_luoc?.message}
                    />
                  )}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('hanhDongCotLoi.form.chienLuocHint')}
                </p>
              </div>
            )}
            <Input
              label={t('hanhDongCotLoi.form.ma')}
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('hanhDongCotLoi.form.ten')}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <div className="col-span-2">
              <Textarea
                label={t('hanhDongCotLoi.form.moTa')}
                {...register('mo_ta')}
                error={errors.mo_ta?.message}
                rows={3}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('hanhDongCotLoi.form.sectionBsc')}>
          <FormGrid col={2}>
            <Controller
              name="bsc_dimension"
              control={control}
              render={({ field }) => (
                <Select
                  ref={field.ref}
                  label={t('hanhDongCotLoi.form.bscDimension')}
                  required
                  options={bscOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.bsc_dimension?.message}
                />
              )}
            />
            <Controller
              name="nhom_hanh_dong"
              control={control}
              render={({ field }) => (
                <Select
                  ref={field.ref}
                  label={t('hanhDongCotLoi.form.nhomHanhDong')}
                  required
                  options={nhomOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.nhom_hanh_dong?.message}
                />
              )}
            />
            <div>
              <Controller
                name="ty_trong"
                control={control}
                render={({ field }) => (
                  <>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('hanhDongCotLoi.form.tyTrong')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
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
                {t('hanhDongCotLoi.form.tyTrongSum')}
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isValidSum ? 'text-foreground' : 'text-amber-600'
                }`}
              >
                {sumTyTrong.toFixed(2)}%
              </span>
              {!isValidSum && idChienLuoc && (
                <p className="text-xs text-amber-600">
                  Tổng tỷ trọng theo chiến lược phải bằng 100%. Hãy điều chỉnh hoặc dùng Cân bằng lại sau khi lưu.
                </p>
              )}
            </div>
            <Controller
              name="thu_tu"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {t('hanhDongCotLoi.form.thuTu')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              )}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default HanhDongFormDrawer;
