import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, ListOrdered, Wrench } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import type { ThietBi } from '../core/types';
import { thietBiFormSchema, type ThietBiFormValues } from '../core/schema';
import { useCreateThietBi, useTaiSanRef, useUpdateThietBi } from '../hooks/use-bao-duong-thiet-bi';

interface Props {
  initialData?: ThietBi | null;
  onClose: () => void;
}

function toForm(d: ThietBi): ThietBiFormValues {
  return {
    ten: d.ten,
    ma_ts: d.ma_ts ?? '',
    so_luong: d.so_luong ?? '',
    khu_vuc: d.khu_vuc ?? '',
    id_tai_san: d.id_tai_san ?? '',
    ghi_chu: d.ghi_chu ?? '',
    dang_dung: d.dang_dung,
    thu_tu: d.thu_tu,
  };
}

const DEFAULT: ThietBiFormValues = {
  ten: '',
  ma_ts: '',
  so_luong: '',
  khu_vuc: '',
  id_tai_san: '',
  ghi_chu: '',
  dang_dung: true,
  thu_tu: 0,
};

/** Drawer thêm/sửa thiết bị — react-hook-form + zod. */
const ThietBiFormDrawer: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateThietBi(() => onClose());
  const updateMutation = useUpdateThietBi(() => onClose());
  const { data: taiSanList = [] } = useTaiSanRef();

  const defaultValues = useMemo<ThietBiFormValues>(() => (initialData ? toForm(initialData) : DEFAULT), [initialData]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ThietBiFormValues>({
    resolver: zodResolver(thietBiFormSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (isDirty) return;
    reset(defaultValues);
  }, [defaultValues, reset, isDirty]);

  const onSubmit: SubmitHandler<ThietBiFormValues> = (values) => {
    if (isEdit && initialData) updateMutation.mutate({ id: initialData.id, data: values });
    else createMutation.mutate(values);
  };

  const pending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  const taiSanOptions = useMemo(
    () => [
      { value: '', label: t('baoDuongThietBi.thietBi.form.khongTaiSan') },
      ...taiSanList.map((x) => ({ value: x.id, label: `${x.ma_tai_san} — ${x.ten_tai_san}` })),
    ],
    [taiSanList, t]
  );

  return (
    <GenericDrawer
      title={t(isEdit ? 'baoDuongThietBi.thietBi.form.titleEdit' : 'baoDuongThietBi.thietBi.form.titleCreate')}
      subtitle={isEdit ? initialData?.ten : t('baoDuongThietBi.thietBi.form.subtitle')}
      icon={<Wrench className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="bao-duong-thiet-bi-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="bao-duong-thiet-bi-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('baoDuongThietBi.thietBi.form.thongTin')}>
          <FormGrid cols={2}>
            <div className="sm:col-span-2">
              <Controller
                name="ten"
                control={control}
                render={({ field }) => (
                  <Input {...field} label={t('baoDuongThietBi.thietBi.form.ten')} required error={errors.ten?.message} />
                )}
              />
            </div>
            <Controller
              name="ma_ts"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  label={t('baoDuongThietBi.thietBi.form.maTs')}
                  icon={<Hash size={12} />}
                  autoCapitalize="characters"
                  error={errors.ma_ts?.message}
                />
              )}
            />
            <Controller
              name="so_luong"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  label={t('baoDuongThietBi.thietBi.form.soLuong')}
                  error={errors.so_luong?.message}
                />
              )}
            />
            <Controller
              name="khu_vuc"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  label={t('baoDuongThietBi.thietBi.form.khuVuc')}
                  error={errors.khu_vuc?.message}
                />
              )}
            />
            <Controller
              name="thu_tu"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  label={t('baoDuongThietBi.col.thuTu')}
                  icon={<ListOrdered size={12} />}
                  error={errors.thu_tu?.message}
                />
              )}
            />
            <div className="sm:col-span-2">
              <Controller
                name="id_tai_san"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('baoDuongThietBi.col.taiSan')}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    options={taiSanOptions}
                    error={errors.id_tai_san?.message}
                  />
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <Controller
                name="ghi_chu"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    label={t('baoDuongThietBi.thietBi.form.ghiChu')}
                    rows={2}
                    error={errors.ghi_chu?.message}
                  />
                )}
              />
            </div>
          </FormGrid>
          <div className="mt-3">
            <Controller
              name="dang_dung"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  checked={field.value}
                  onChange={field.onChange}
                  label={t('baoDuongThietBi.thietBi.form.dangDung')}
                />
              )}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThietBiFormDrawer;
