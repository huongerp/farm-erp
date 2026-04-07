import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sprout, Building2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import { thuHoachKeHoachFormSchema, type ThuHoachKeHoachFormValues } from '../core/schema';
import type { FarmThuHoach } from '../core/types';
import { sumKeHoachWeek } from '../core/utils';
import { formatNumberVN } from '../../../../lib/utils';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import {
  DAY_FORM_LABEL_KEY,
  defaultKeHoachFormValues,
  farmThuHoachToKeHoachForm,
  findThuHoachDuplicateByBranchYearWeek,
} from '../core/form-mappers';
import { useCreateThuHoach, useUpdateThuHoachKeHoach } from '../hooks/use-thu-hoach';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TRANG_THAI } from '../../../../lib/constants';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  branches: Branch[];
  initialData?: FarmThuHoach | null;
  /** Chi nhánh mặc định khi tạo mới: từ bản ghi gần nhất do user hiện tại tạo */
  preferredBranch?: { id_chi_nhanh: string; ten_chi_nhanh: string } | null;
  /** Danh sách đã tải — dùng cảnh báo trùng farm/chi nhánh + năm + tuần khi tạo mới */
  existingThuHoach?: FarmThuHoach[];
  onClose: () => void;
}

const ThuHoachForm: React.FC<Props> = ({
  branches,
  initialData,
  preferredBranch,
  existingThuHoach = [],
  onClose,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const isEdit = !!initialData;
  const createMutation = useCreateThuHoach(onClose);
  const updateMutation = useUpdateThuHoachKeHoach(onClose);

  /** Danh sách chi nhánh từ module Hệ thống → Chi nhánh (chỉ đang hoạt động; khi sửa giữ option đã lưu nếu đã ngừng). */
  const branchComboboxOptions = useMemo(() => {
    /** Chi nhánh (fp_var_chi_nhanh) dùng TRANG_THAI: 'Đang dùng' | 'Ngừng' */
    const active = branches.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG);
    const opts = active.map((b) => ({
      value: b.id,
      label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}`,
      subLabel: b.ma_chi_nhanh,
    }));
    if (initialData?.id_chi_nhanh && initialData.ten_chi_nhanh) {
      const idStr = String(initialData.id_chi_nhanh);
      if (!opts.some((o) => String(o.value) === idStr)) {
        opts.unshift({ value: idStr, label: `${initialData.ten_chi_nhanh} (${t('thuHoach.form.branchInactiveHint')})` });
      }
    }
    return opts;
  }, [branches, initialData?.id_chi_nhanh, initialData?.ten_chi_nhanh, t]);

  const defaultValues = useMemo(() => {
    if (initialData) return farmThuHoachToKeHoachForm(initialData);
    const base = defaultKeHoachFormValues();
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
  } = useForm<ThuHoachKeHoachFormValues>({
    resolver: zodResolver(thuHoachKeHoachFormSchema),
    defaultValues,
  });

  const idChiNhanh = watch('id_chi_nhanh');
  const watchedForm = watch();
  const tongKeHoachTuan = useMemo(
    () => sumKeHoachWeek(watchedForm as Pick<FarmThuHoach, `ke_hoach_${(typeof THU_HOACH_DAY_SUFFIXES)[number]}`>),
    [watchedForm]
  );

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

  const onSubmit: SubmitHandler<ThuHoachKeHoachFormValues> = (data) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
      return;
    }
    const dup = findThuHoachDuplicateByBranchYearWeek(
      existingThuHoach,
      data.id_chi_nhanh,
      data.nam,
      data.tuan
    );
    if (dup) {
      const branchLabel = data.ten_chi_nhanh?.trim() || dup.ten_chi_nhanh || data.id_chi_nhanh;
      confirm({
        title: t('thuHoach.form.duplicateWarningTitle'),
        message: t('thuHoach.form.duplicateWarningMessage', {
          branch: branchLabel,
          nam: data.nam,
          tuan: data.tuan,
        }),
        variant: 'warning',
        confirmText: t('thuHoach.form.duplicateWarningConfirm'),
        cancelText: t('common.cancel'),
        onConfirm: () => {
          createMutation.mutate(data);
        },
      });
      return;
    }
    createMutation.mutate(data);
  };

  const pending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('thuHoach.form.titleEdit') : t('thuHoach.form.titleCreate')}
      subtitle={t('thuHoach.form.keHoachGroup')}
      icon={<Sprout className="text-emerald-600" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="thu-hoach-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="thu-hoach-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('thuHoach.detail.title')}>
          <FormGrid cols={2}>
            <Controller
              name="nam"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  label={t('thuHoach.form.nam')}
                  required
                  error={errors.nam?.message}
                  value={field.value === undefined ? '' : String(field.value)}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                />
              )}
            />
            <Controller
              name="tuan"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  label={t('thuHoach.form.tuan')}
                  required
                  error={errors.tuan?.message}
                  value={field.value === undefined ? '' : String(field.value)}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                />
              )}
            />
          </FormGrid>
          <div className="mt-3">
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <div onBlur={onBlur}>
                  <Combobox
                    label={t('thuHoach.form.branch')}
                    placeholder={t('thuHoach.form.branchPlaceholder')}
                    required
                    icon={<Building2 size={16} className="text-muted-foreground" />}
                    options={branchComboboxOptions}
                    value={value || null}
                    onChange={(v: string | number | null) => onChange(v != null ? String(v) : '')}
                    error={errors.id_chi_nhanh?.message}
                    searchPlaceholder={t('common.search')}
                  />
                </div>
              )}
            />
          </div>
          <div className="mt-3">
            <Controller
              name="ghi_chu"
              control={control}
              render={({ field }) => (
                <Textarea label={t('thuHoach.form.ghiChu')} {...field} value={field.value ?? ''} rows={2} />
              )}
            />
          </div>
        </FormSection>

        <FormSection title={t('thuHoach.form.keHoachGroup')}>
          <FormGrid cols={2}>
            {THU_HOACH_DAY_SUFFIXES.map((s) => (
              <Controller
                key={s}
                name={`ke_hoach_${s}` as keyof ThuHoachKeHoachFormValues}
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label={t(DAY_FORM_LABEL_KEY[s])}
                    value={field.value as number}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={0}
                    maxFractionDigits={2}
                    showZeroFormatted
                  />
                )}
              />
            ))}
          </FormGrid>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">{t('thuHoach.form.tongTuanKeHoach')}</span>
            <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(tongKeHoachTuan)}</span>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThuHoachForm;
