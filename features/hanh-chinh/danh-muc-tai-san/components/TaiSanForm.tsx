import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Hash, Type, Layers, MapPin, Tag, User, Calendar, DollarSign, FileText, Power, Image as ImageIcon } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import StatusToggle from '../../../../components/ui/StatusToggle';
import SingleImageInput from '../../../../components/ui/SingleImageInput';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { TaiSan } from '../core/types';
import { TaiSanFormValues, taiSanSchema } from '../core/schema';
import { useCreateTaiSan, useUpdateTaiSan } from '../hooks/use-danh-muc-tai-san';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
const DEFAULT_VALUES: TaiSanFormValues = {
  ma_tai_san: '',
  ten_tai_san: '',
  id_nhom: '',
  id_noi_luu: '',
  id_trang_thai: '',
  id_nhan_vien_dang_giu: '',
  ngay_nhap: new Date().toISOString().slice(0, 10),
  nguyen_gia: undefined,
  ngay_bat_dau_trich_khau_hao: '',
  hinh_anh: '',
  ghi_chu: '',
  trang_thai: 1,
};

interface Props {
  initialData?: TaiSan | null;
  onClose: () => void;
}

const TaiSanForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateTaiSan(onClose);
  const updateMutation = useUpdateTaiSan(onClose);
  const { data: groups = [] } = useAssetGroups();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: statuses = [] } = useAssetStatuses();
  const { data: employees = [] } = useEmployees();

  const groupOptions = useMemo(
    () => groups.map((g) => ({ label: g.ten, value: g.id, subLabel: g.ma })),
    [groups]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ma_noi_luu })),
    [locations]
  );
  const statusOptions = useMemo(
    () => statuses.map((s) => ({ label: s.ten, value: s.id, subLabel: s.ma })),
    [statuses]
  );
  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
      })),
    [employees]
  );

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<TaiSanFormValues>({
    resolver: zodResolver(taiSanSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_tai_san: initialData.ma_tai_san,
        ten_tai_san: initialData.ten_tai_san,
        id_nhom: initialData.id_nhom,
        id_noi_luu: initialData.id_noi_luu,
        id_trang_thai: initialData.id_trang_thai,
        id_nhan_vien_dang_giu: initialData.id_nhan_vien_dang_giu ?? '',
        ngay_nhap: initialData.ngay_nhap?.slice(0, 10) ?? DEFAULT_VALUES.ngay_nhap,
        nguyen_gia: initialData.nguyen_gia ?? undefined,
        ngay_bat_dau_trich_khau_hao: initialData.ngay_bat_dau_trich_khau_hao?.slice(0, 10) ?? initialData.ngay_nhap?.slice(0, 10) ?? '',
        hinh_anh: initialData.hinh_anh ?? '',
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      reset({ ...DEFAULT_VALUES, ngay_nhap: today, ngay_bat_dau_trich_khau_hao: today });
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<TaiSanFormValues> = (data) => {
    const sanitized: TaiSanFormValues = {
      ...data,
      id_nhan_vien_dang_giu: data.id_nhan_vien_dang_giu || undefined,
      hinh_anh: data.hinh_anh?.trim() || undefined,
      ghi_chu: data.ghi_chu?.trim() || undefined,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('danhSachTaiSan.form.editTitle') : t('danhSachTaiSan.form.createTitle')}
      icon={<Building2 size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="tai-san-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('danhSachTaiSan.form.save')}
          createLabel={t('danhSachTaiSan.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="tai-san-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('danhSachTaiSan.form.basicInfo')} icon={<Building2 size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('danhSachTaiSan.form.ma')}
              placeholder={t('danhSachTaiSan.form.maPlaceholder')}
              icon={<Hash size={12} />}
              required
              {...register('ma_tai_san')}
              error={errors.ma_tai_san?.message}
            />
            <Input
              label={t('danhSachTaiSan.form.ten')}
              placeholder={t('danhSachTaiSan.form.tenPlaceholder')}
              icon={<Type size={12} />}
              required
              {...register('ten_tai_san')}
              error={errors.ten_tai_san?.message}
            />
            <Controller
              name="id_nhom"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.nhom')}
                  options={groupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('danhSachTaiSan.form.nhomPlaceholder')}
                  error={errors.id_nhom?.message}
                  icon={<Layers size={12} />}
                />
              )}
            />
            <Controller
              name="id_noi_luu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.noiLuu')}
                  options={locationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('danhSachTaiSan.form.noiLuuPlaceholder')}
                  error={errors.id_noi_luu?.message}
                  icon={<MapPin size={12} />}
                />
              )}
            />
            <Controller
              name="id_trang_thai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.trangThai')}
                  options={statusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('danhSachTaiSan.form.trangThaiPlaceholder')}
                  error={errors.id_trang_thai?.message}
                  icon={<Tag size={12} />}
                />
              )}
            />
            <Controller
              name="id_nhan_vien_dang_giu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.nguoiGiu')}
                  options={employeeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('danhSachTaiSan.form.nguoiGiuPlaceholder')}
                  icon={<User size={12} />}
                />
              )}
            />
            <Input
              type="date"
              label={t('danhSachTaiSan.form.ngayNhap')}
              {...register('ngay_nhap')}
              error={errors.ngay_nhap?.message}
              icon={<Calendar size={12} />}
            />
            <Input
              type="number"
              min={0}
              step={1000}
              label={t('danhSachTaiSan.form.nguyenGia')}
              placeholder={t('danhSachTaiSan.form.nguyenGiaPlaceholder')}
              icon={<DollarSign size={12} />}
              {...register('nguyen_gia')}
              error={errors.nguyen_gia?.message}
            />
            <Input
              type="date"
              label={t('danhSachTaiSan.form.ngayBatDauTrichKhauHao')}
              {...register('ngay_bat_dau_trich_khau_hao')}
              error={errors.ngay_bat_dau_trich_khau_hao?.message}
              icon={<Calendar size={12} />}
            />
            <Controller
              name="hinh_anh"
              control={control}
              render={({ field }) => (
                <div className="col-span-1 sm:col-span-2">
                  <SingleImageInput
                    label={t('danhSachTaiSan.form.hinhAnh')}
                    icon={<ImageIcon size={12} />}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? '')}
                    placeholder={t('danhSachTaiSan.form.hinhAnhPlaceholder')}
                    hint={t('danhSachTaiSan.form.hinhAnhHint')}
                    shape="rounded"
                    aspectRatio="1/1"
                    maxSizeMB={3}
                  />
                  {errors.hinh_anh?.message && (
                    <p className="text-xs font-medium text-destructive mt-1.5">{errors.hinh_anh.message}</p>
                  )}
                </div>
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('danhSachTaiSan.form.ghiChu')}
                placeholder={t('danhSachTaiSan.form.ghiChuPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('danhSachTaiSan.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<Power size={12} />}
                  required
                />
              )}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TaiSanForm;
