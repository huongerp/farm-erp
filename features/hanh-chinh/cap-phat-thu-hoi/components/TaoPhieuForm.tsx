import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, MapPin, User, Calendar, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { phieuCapPhatThuHoiSchema, type PhieuCapPhatThuHoiFormValues } from '../core/schema';
import { useCreatePhieuAndExecute, useUpdatePhieu } from '../hooks/use-cap-phat-thu-hoi';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { useAuthStore } from '../../../../store/useStore';
import { LOAI_PHIEU_OPTIONS } from '../core/constants';
import type { PhieuCapPhatThuHoi } from '../core/types';

const DEFAULT_VALUES: PhieuCapPhatThuHoiFormValues = {
  loai_phieu: 'cap_phat',
  id_tai_san: '',
  id_noi_luu_truoc: '',
  id_noi_luu_sau: '',
  id_nguoi_giu_truoc: null,
  id_nguoi_giu_sau: null,
  ngay_thuc_hien: new Date().toISOString().slice(0, 10),
  id_nguoi_thuc_hien: '',
  ghi_chu: null,
};

interface Props {
  onClose: () => void;
  defaultTaiSanId?: string;
  initialData?: PhieuCapPhatThuHoi | null;
  /** Sau khi lưu sửa thành công: đóng form và mở detail bản ghi (finish view generic) */
  onSuccessAfterEdit?: (item: PhieuCapPhatThuHoi) => void;
}

const RequiredStar = () => <span className="text-destructive ml-0.5">*</span>;

const TaoPhieuForm: React.FC<Props> = ({ onClose, defaultTaiSanId, initialData, onSuccessAfterEdit }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const isEdit = !!initialData;
  const createMutation = useCreatePhieuAndExecute(onClose);
  const updateMutation = useUpdatePhieu((updatedItem) => {
    onClose();
    onSuccessAfterEdit?.(updatedItem);
  });
  const { data: assets = [] } = useTaiSanList();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: employees = [] } = useEmployees();

  const defaultValuesFromData = initialData
    ? {
        loai_phieu: initialData.loai_phieu,
        id_tai_san: initialData.id_tai_san,
        id_noi_luu_truoc: initialData.id_noi_luu_truoc,
        id_noi_luu_sau: initialData.id_noi_luu_sau,
        id_nguoi_giu_truoc: initialData.id_nguoi_giu_truoc ?? null,
        id_nguoi_giu_sau: initialData.id_nguoi_giu_sau ?? null,
        ngay_thuc_hien: initialData.ngay_thuc_hien,
        id_nguoi_thuc_hien: initialData.id_nguoi_thuc_hien,
        ghi_chu: initialData.ghi_chu ?? null,
      }
    : { ...DEFAULT_VALUES, id_tai_san: defaultTaiSanId ?? '' };

  const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<PhieuCapPhatThuHoiFormValues>({
    resolver: zodResolver(phieuCapPhatThuHoiSchema),
    defaultValues: defaultValuesFromData,
  });

  const selectedLoai = useWatch({ control, name: 'loai_phieu', defaultValue: 'cap_phat' });
  const selectedTaiSanId = useWatch({ control, name: 'id_tai_san', defaultValue: '' });

  useEffect(() => {
    if (defaultTaiSanId) {
      setValue('id_tai_san', defaultTaiSanId);
      const asset = assets.find((a) => a.id === defaultTaiSanId);
      if (asset) {
        setValue('id_noi_luu_truoc', asset.id_noi_luu);
        setValue('id_nguoi_giu_truoc', asset.id_nhan_vien_dang_giu ?? null);
      }
    }
  }, [defaultTaiSanId, assets, setValue]);

  useEffect(() => {
    if (!selectedTaiSanId) return;
    const asset = assets.find((a) => a.id === selectedTaiSanId);
    if (asset) {
      setValue('id_noi_luu_truoc', asset.id_noi_luu);
      setValue('id_nguoi_giu_truoc', asset.id_nhan_vien_dang_giu ?? null);
    }
  }, [selectedTaiSanId, assets, setValue]);

  useEffect(() => {
    if (!currentUserId) return;
    setValue('id_nguoi_thuc_hien', currentUserId);
  }, [currentUserId, setValue]);

  const assetOptions = useMemo(
    () => assets.filter((a) => a.trang_thai === 1).map((a) => ({
      value: a.id,
      label: `${a.ma_tai_san} - ${a.ten_tai_san}`,
      subLabel: a.ten_noi_luu ?? undefined,
    })),
    [assets]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: l.id, label: l.ten_noi_luu, subLabel: l.ma_noi_luu })),
    [locations]
  );
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.ho_ten, subLabel: e.ma_nhan_vien })),
    [employees]
  );
  const loaiOptions = useMemo(
    () => LOAI_PHIEU_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );

  const needNguoiGiuSau =
    selectedLoai === 'cap_phat' ||
    selectedLoai === 'luan_chuyen_nguoi' ||
    selectedLoai === 'luan_chuyen_ca_hai';
  const needNoiLuuSau = selectedLoai !== 'thu_hoi' || true;

  const payload = (data: PhieuCapPhatThuHoiFormValues) => ({
    loai_phieu: data.loai_phieu,
    id_tai_san: data.id_tai_san,
    id_noi_luu_truoc: data.id_noi_luu_truoc,
    id_noi_luu_sau: data.id_noi_luu_sau,
    id_nguoi_giu_truoc: data.id_nguoi_giu_truoc || null,
    id_nguoi_giu_sau: data.id_nguoi_giu_sau || null,
    ngay_thuc_hien: data.ngay_thuc_hien,
    id_nguoi_thuc_hien: data.id_nguoi_thuc_hien,
    ghi_chu: data.ghi_chu?.trim() || null,
  });

  const onSubmit: SubmitHandler<PhieuCapPhatThuHoiFormValues> = (data) => {
    if (!currentUserId) return;
    const body = payload(data);
    if (isEdit && initialData) {
      updateMutation.mutate({
        id: initialData.id,
        data: body,
        id_nguoi_thuc_hien: currentUserId,
      });
    } else {
      createMutation.mutate({
        data: body,
        id_nguoi_thuc_hien: currentUserId,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={t(isEdit ? 'capPhatThuHoi.form.editTitle' : 'capPhatThuHoi.form.createTitle')}
      icon={<Package size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="phieu-cap-phat-thu-hoi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('capPhatThuHoi.form.submitEdit')}
          createLabel={t('capPhatThuHoi.form.submit')}
        />
      }
    >
      <form id="phieu-cap-phat-thu-hoi-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormSection title={t('capPhatThuHoi.form.sectionTypeAsset')} icon={<Package size={18} />} variant="primary">
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.loaiPhieu')}<RequiredStar /></label>
              <Controller name="loai_phieu" control={control} render={({ field }) => (
                <Combobox value={field.value} onChange={field.onChange} options={loaiOptions} placeholder={t('capPhatThuHoi.form.loaiPhieuPlaceholder')} searchable dropdownInPortal />
              )} />
              {errors.loai_phieu && <p className="text-destructive text-xs mt-1">{errors.loai_phieu.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.taiSan')}<RequiredStar /></label>
              <Controller name="id_tai_san" control={control} render={({ field }) => (
                <Combobox value={field.value} onChange={field.onChange} options={assetOptions} placeholder={t('capPhatThuHoi.form.taiSanPlaceholder')} searchable dropdownInPortal />
              )} />
              {errors.id_tai_san && <p className="text-destructive text-xs mt-1">{errors.id_tai_san.message}</p>}
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('capPhatThuHoi.form.sectionLocation')} icon={<MapPin size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.noiLuuTruoc')}<RequiredStar /></label>
              <Controller name="id_noi_luu_truoc" control={control} render={({ field }) => (
                <Combobox value={field.value} onChange={field.onChange} options={locationOptions} placeholder={t('capPhatThuHoi.form.noiLuuTruocPlaceholder')} searchable dropdownInPortal />
              )} />
              {errors.id_noi_luu_truoc && <p className="text-destructive text-xs mt-1">{errors.id_noi_luu_truoc.message}</p>}
            </div>
            {needNoiLuuSau && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.noiLuuSau')}<RequiredStar /></label>
                <Controller name="id_noi_luu_sau" control={control} render={({ field }) => (
                  <Combobox value={field.value} onChange={field.onChange} options={locationOptions} placeholder={t('capPhatThuHoi.form.noiLuuSauPlaceholder')} searchable dropdownInPortal />
                )} />
                {errors.id_noi_luu_sau && <p className="text-destructive text-xs mt-1">{errors.id_noi_luu_sau.message}</p>}
              </div>
            )}
          </FormGrid>
        </FormSection>

        <FormSection title={t('capPhatThuHoi.form.sectionHolder')} icon={<User size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.nguoiGiuTruoc')}</label>
              <Controller name="id_nguoi_giu_truoc" control={control} render={({ field }) => (
                <Combobox value={field.value ?? ''} onChange={(v) => field.onChange(v || null)} options={[{ value: '', label: '—' }, ...employeeOptions]} placeholder={t('capPhatThuHoi.form.nguoiGiuTruocPlaceholder')} searchable dropdownInPortal />
              )} />
            </div>
            {needNguoiGiuSau && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.nguoiGiuSau')}<RequiredStar /></label>
                <Controller name="id_nguoi_giu_sau" control={control} render={({ field }) => (
                  <Combobox value={field.value ?? ''} onChange={(v) => field.onChange(v || null)} options={employeeOptions} placeholder={t('capPhatThuHoi.form.nguoiGiuSauPlaceholder')} searchable dropdownInPortal />
                )} />
                {errors.id_nguoi_giu_sau && <p className="text-destructive text-xs mt-1">{errors.id_nguoi_giu_sau.message}</p>}
              </div>
            )}
          </FormGrid>
        </FormSection>

        <FormSection title={t('capPhatThuHoi.form.sectionDatePerformer')} icon={<Calendar size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.ngayThucHien')}<RequiredStar /></label>
              <Input type="date" {...register('ngay_thuc_hien')} className={errors.ngay_thuc_hien ? 'border-destructive' : ''} />
              {errors.ngay_thuc_hien && <p className="text-destructive text-xs mt-1">{errors.ngay_thuc_hien.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.nguoiThucHien')}<RequiredStar /></label>
              <Controller name="id_nguoi_thuc_hien" control={control} render={({ field }) => (
                <Combobox value={field.value} onChange={field.onChange} options={employeeOptions} placeholder={t('capPhatThuHoi.form.nguoiThucHienPlaceholder')} searchable dropdownInPortal />
              )} />
              {errors.id_nguoi_thuc_hien && <p className="text-destructive text-xs mt-1">{errors.id_nguoi_thuc_hien.message}</p>}
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('capPhatThuHoi.form.sectionNote')} icon={<FileText size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.ghiChu')}</label>
              <Textarea {...register('ghi_chu')} placeholder={t('capPhatThuHoi.form.ghiChuPlaceholder')} rows={2} />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TaoPhieuForm;
