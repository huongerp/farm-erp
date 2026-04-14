import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Layers, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import MultiSelect from '../../../../components/ui/MultiSelect';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { dotKiemKeSchema, type DotKiemKeFormValues } from '../core/schema';
import { useCreateDotKiemKe, useUpdateDotKiemKe, useNextMaDotDotKiemKeTaiSan, formatMaDotDotKiemKeTaiSan } from '../hooks/use-kiem-ke-tai-san';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useEmployeesRefQuery } from '@/lib/hooks/use-supabase-ref-queries';
import { useAuthStore } from '../../../../store/useStore';
import type { DotKiemKe } from '../core/types';

const DEFAULT_VALUES: DotKiemKeFormValues = {
  ma_dot: '',
  ten_dot: '',
  ngay_bat_dau: new Date().toISOString().slice(0, 10),
  ngay_ket_thuc: new Date().toISOString().slice(0, 10),
  id_nguoi_phu_trach: '',
  id_nhom: [],
  id_noi_luu: [],
  id_nguoi_giu: [],
  ghi_chu: null,
};

interface Props {
  onClose: () => void;
  initialData?: DotKiemKe | null;
  onSuccessAfterEdit?: (item: DotKiemKe) => void;
}

const RequiredStar = () => <span className="text-destructive ml-0.5">*</span>;

const DotKiemKeForm: React.FC<Props> = ({ onClose, initialData, onSuccessAfterEdit }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData;
  const createMutation = useCreateDotKiemKe(onClose);
  const updateMutation = useUpdateDotKiemKe(() => {
    onClose();
    if (initialData) onSuccessAfterEdit?.(initialData);
  });
  const nextMaDot = useNextMaDotDotKiemKeTaiSan();
  const { data: groups = [] } = useAssetGroups();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: employees = [] } = useEmployeesRefQuery();

  const defaultValuesFromData = initialData
    ? {
        ma_dot: initialData.ma_dot,
        ten_dot: initialData.ten_dot,
        ngay_bat_dau: initialData.ngay_bat_dau,
        ngay_ket_thuc: initialData.ngay_ket_thuc,
        id_nguoi_phu_trach: initialData.id_nguoi_phu_trach,
        id_nhom: initialData.id_nhom ?? [],
        id_noi_luu: initialData.id_noi_luu ?? [],
        id_nguoi_giu: initialData.id_nguoi_giu ?? [],
        ghi_chu: initialData.ghi_chu ?? null,
      }
    : DEFAULT_VALUES;

  const { register, handleSubmit, formState: { errors }, control, setValue, reset } = useForm<DotKiemKeFormValues>({
    resolver: zodResolver(dotKiemKeSchema),
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
        onSuccess: (seq) => setValue('ma_dot', formatMaDotDotKiemKeTaiSan(seq)),
      });
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit && user?.id) {
      setValue('id_nguoi_phu_trach', String(user.id));
    }
  }, [isEdit, user?.id]);

  const onSubmit: SubmitHandler<DotKiemKeFormValues> = (data) => {
    const payload = {
      ma_dot: data.ma_dot.trim(),
      ten_dot: data.ten_dot.trim(),
      ngay_bat_dau: data.ngay_bat_dau,
      ngay_ket_thuc: data.ngay_ket_thuc,
      id_nguoi_phu_trach: data.id_nguoi_phu_trach,
      id_nhom: data.id_nhom ?? [],
      id_noi_luu: data.id_noi_luu ?? [],
      id_nguoi_giu: data.id_nguoi_giu ?? [],
      ghi_chu: data.ghi_chu?.trim() || null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const groupOptions = groups.map((g) => {
    const ma = g.ma ?? '';
    const ten = g.ten ?? '';
    const label = [ma, ten].filter(Boolean).join(' – ') || String(g.id);
    return { label, value: g.id };
  });
  const locationOptions = locations.map((l) => {
    const label = [l.ma_noi_luu, l.ten_noi_luu].filter(Boolean).join(' – ') || l.ten_noi_luu || l.id;
    return { label, value: l.id };
  });
  const holderOptions = employees.map((e) => ({
    label: e.ho_ten,
    value: e.id,
    subLabel: e.ma_nhan_vien,
  }));
  const employeeOptions = employees.map((e) => ({
    label: e.ho_ten,
    value: e.id,
    subLabel: e.ma_nhan_vien,
  }));

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('kiemKeTaiSan.form.editTitle') : t('kiemKeTaiSan.form.createTitle')}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="dot-kiem-ke-form"
          onCancel={onClose}
          isLoading={isSubmitting}
          isEdit={isEdit}
          saveLabel={t('common.save')}
          createLabel={t('kiemKeTaiSan.form.create')}
        />
      }
    >
      <form id="dot-kiem-ke-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormSection title={t('kiemKeTaiSan.form.infoSection')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('kiemKeTaiSan.store.maDotCol')}
              {...register('ma_dot')}
              error={errors.ma_dot?.message}
              placeholder={t('kiemKeTaiSan.form.maDotPlaceholder')}
              required
            />
            <Input
              label={t('kiemKeTaiSan.store.tenDotCol')}
              {...register('ten_dot')}
              error={errors.ten_dot?.message}
              placeholder={t('kiemKeTaiSan.form.tenDotPlaceholder')}
              required
            />
            <Input
              type="date"
              label={t('kiemKeTaiSan.store.ngayBatDauCol')}
              {...register('ngay_bat_dau')}
              error={errors.ngay_bat_dau?.message}
              required
            />
            <Input
              type="date"
              label={t('kiemKeTaiSan.store.ngayKetThucCol')}
              {...register('ngay_ket_thuc')}
              error={errors.ngay_ket_thuc?.message}
              required
            />
            <Controller
              name="id_nguoi_phu_trach"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('kiemKeTaiSan.store.nguoiPhuTrachCol')}
                  options={employeeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('kiemKeTaiSan.form.nguoiPhuTrachPlaceholder')}
                  error={errors.id_nguoi_phu_trach?.message}
                  icon={<User size={12} />}
                />
              )}
            />
          </FormGrid>
          <Controller
            name="ghi_chu"
            control={control}
            render={({ field }) => (
              <Textarea
                label={t('kiemKeTaiSan.store.ghiChuCol')}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder={t('kiemKeTaiSan.form.ghiChuPlaceholder')}
              />
            )}
          />
        </FormSection>
        <FormSection title={t('kiemKeTaiSan.form.phamViSection')} icon={<Layers size={14} />} variant="primary">
          <p className="text-sm text-muted-foreground mb-3">{t('kiemKeTaiSan.form.phamViHint')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Controller
              name="id_nhom"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label={t('kiemKeTaiSan.form.idNhom')}
                  options={groupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('kiemKeTaiSan.form.idNhomPlaceholder')}
                  labelAbove
                />
              )}
            />
            <Controller
              name="id_noi_luu"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label={t('kiemKeTaiSan.form.idNoiLuu')}
                  options={locationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('kiemKeTaiSan.form.idNoiLuuPlaceholder')}
                  labelAbove
                />
              )}
            />
            <Controller
              name="id_nguoi_giu"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label={t('kiemKeTaiSan.form.idNguoiGiu')}
                  options={holderOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('kiemKeTaiSan.form.idNguoiGiuPlaceholder')}
                  labelAbove
                />
              )}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DotKiemKeForm;
