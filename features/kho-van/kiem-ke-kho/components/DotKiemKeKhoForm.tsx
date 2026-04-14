import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Warehouse, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import MultiSelect from '../../../../components/ui/MultiSelect';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { dotKiemKeKhoSchema, type DotKiemKeKhoFormValues } from '../core/schema';
import { useCreateDotKiemKeKho, useUpdateDotKiemKeKho, useNextMaDotDotKiemKeKho, formatMaDotDotKiemKeKho } from '../hooks/use-kiem-ke-kho';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useEmployeesRefQuery } from '@/lib/hooks/use-supabase-ref-queries';
import type { DotKiemKeKho } from '../core/types';

const DEFAULT_VALUES: DotKiemKeKhoFormValues = {
  ma_dot: '',
  ten_dot: '',
  ngay_bat_dau: new Date().toISOString().slice(0, 10),
  ngay_ket_thuc: new Date().toISOString().slice(0, 10),
  id_nguoi_phu_trach: '',
  id_kho: [],
  ghi_chu: null,
};

interface Props {
  onClose: () => void;
  initialData?: DotKiemKeKho | null;
  onSuccessAfterEdit?: (item: DotKiemKeKho) => void;
}

const DotKiemKeKhoForm: React.FC<Props> = ({ onClose, initialData, onSuccessAfterEdit }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDotKiemKeKho(onClose);
  const updateMutation = useUpdateDotKiemKeKho(() => {
    onClose();
    if (initialData) onSuccessAfterEdit?.(initialData);
  });
  const nextMaDot = useNextMaDotDotKiemKeKho();
  const { data: khoList = [] } = useKhoList();
  const { data: employees = [] } = useEmployeesRefQuery();

  const defaultValuesFromData = initialData
    ? {
        ma_dot: initialData.ma_dot,
        ten_dot: initialData.ten_dot,
        ngay_bat_dau: initialData.ngay_bat_dau,
        ngay_ket_thuc: initialData.ngay_ket_thuc,
        id_nguoi_phu_trach: initialData.id_nguoi_phu_trach,
        id_kho: initialData.id_kho ?? [],
        ghi_chu: initialData.ghi_chu ?? null,
      }
    : DEFAULT_VALUES;

  const { register, handleSubmit, formState: { errors }, control, setValue, reset } = useForm<DotKiemKeKhoFormValues>({
    resolver: zodResolver(dotKiemKeKhoSchema),
    defaultValues: defaultValuesFromData,
  });

  useEffect(() => {
    if (initialData) {
      reset(defaultValuesFromData);
    }
  }, [initialData?.id]);

  useEffect(() => {
    if (!isEdit && !nextMaDot.isSuccess) {
      nextMaDot.mutate(undefined, {
        onSuccess: (seq) => setValue('ma_dot', formatMaDotDotKiemKeKho(seq)),
      });
    }
  }, [isEdit]);

  const onSubmit: SubmitHandler<DotKiemKeKhoFormValues> = (data) => {
    const payload = {
      ma_dot: data.ma_dot.trim(),
      ten_dot: data.ten_dot.trim(),
      ngay_bat_dau: data.ngay_bat_dau,
      ngay_ket_thuc: data.ngay_ket_thuc,
      id_nguoi_phu_trach: data.id_nguoi_phu_trach,
      id_kho: data.id_kho ?? [],
      ghi_chu: data.ghi_chu?.trim() || null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const khoOptions = khoList
    .filter((k) => k.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
    .map((k) => ({ label: k.ten_kho, value: k.id, subLabel: k.ma_kho }));
  const employeeOptions = employees.map((e) => ({
    label: e.ho_ten,
    value: e.id,
    subLabel: e.ma_nhan_vien,
  }));

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoadingMaDot = !isEdit && nextMaDot.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('kiemKeKho.form.editTitle') : t('kiemKeKho.form.createTitle')}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="dot-kiem-ke-kho-form"
          onCancel={onClose}
          isLoading={isSubmitting || isLoadingMaDot}
          isEdit={isEdit}
          saveLabel={t('common.save')}
          createLabel={t('kiemKeKho.form.create')}
        />
      }
    >
      <form id="dot-kiem-ke-kho-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormSection title={t('kiemKeKho.form.infoSection')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('kiemKeKho.store.maDotCol')}
              {...register('ma_dot')}
              error={errors.ma_dot?.message}
              placeholder={t('kiemKeKho.form.maDotPlaceholder')}
              disabled={!isEdit}
              readOnly={!isEdit}
            />
            <Input
              label={t('kiemKeKho.store.tenDotCol')}
              {...register('ten_dot')}
              error={errors.ten_dot?.message}
              placeholder={t('kiemKeKho.form.tenDotPlaceholder')}
              required
            />
            <Input
              type="date"
              label={t('kiemKeKho.store.ngayBatDauCol')}
              {...register('ngay_bat_dau')}
              error={errors.ngay_bat_dau?.message}
              required
            />
            <Input
              type="date"
              label={t('kiemKeKho.store.ngayKetThucCol')}
              {...register('ngay_ket_thuc')}
              error={errors.ngay_ket_thuc?.message}
              required
            />
            <Controller
              name="id_nguoi_phu_trach"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('kiemKeKho.store.nguoiPhuTrachCol')}
                  options={employeeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('kiemKeKho.form.nguoiPhuTrachPlaceholder')}
                  error={errors.id_nguoi_phu_trach?.message}
                  icon={<User size={12} />}
                  required
                />
              )}
            />
          </FormGrid>
          <Controller
            name="ghi_chu"
            control={control}
            render={({ field }) => (
              <Textarea
                label={t('kiemKeKho.store.ghiChuCol')}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder={t('kiemKeKho.form.ghiChuPlaceholder')}
              />
            )}
          />
        </FormSection>
        <FormSection title={t('kiemKeKho.form.phamViKhoSection')} icon={<Warehouse size={14} />} variant="primary">
          <p className="text-sm text-muted-foreground mb-3">{t('kiemKeKho.form.phamViKhoHint')}</p>
          <Controller
            name="id_kho"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label={t('kiemKeKho.store.khoCol')}
                options={khoOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={t('kiemKeKho.form.idKhoPlaceholder')}
                error={errors.id_kho?.message}
              />
            )}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DotKiemKeKhoForm;
