import React, { useEffect, useMemo, useId, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, ArrowUpFromLine, Power, Folder, DollarSign, FileText, Camera } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import SingleImageInput from '../../../../components/ui/SingleImageInput';
import { uploadImageToCloudinary } from '../../../../lib/cloudinary';

const CLOUDINARY_READY =
  Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) &&
  Boolean(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
import StatusToggle from '../../../../components/ui/StatusToggle';
import Combobox from '../../../../components/ui/Combobox';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import { HangHoaFormValues, hangHoaSchema } from '../core/schema';
import type { HangHoa } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useCreateHangHoa, useUpdateHangHoa } from '../hooks/use-hang-hoa';
import { useDanhMucCap2WithParent } from '../../danh-muc-hang-hoa/hooks/use-danh-muc-hang-hoa';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  initialData?: HangHoa | null;
  /** Khi tạo mới: thứ tự mặc định (tự tăng từ max + 1). */
  defaultThuTu?: number;
  /** Các đơn vị tính đã có trong bảng – dùng gợi ý khi nhập DVT. */
  existingDvtList?: string[];
  /** Các phẩm cấp đã có trong bảng – gợi ý khi nhập phẩm cấp (datalist). */
  existingPhamCapList?: string[];
  onClose: () => void;
  /** Gọi khi tạo mới thành công với hàng hóa vừa tạo. */
  onSuccessCreate?: (item: HangHoa) => void;
}

const DanhSachHangHoaForm: React.FC<Props> = ({
  initialData,
  defaultThuTu,
  existingDvtList = [],
  existingPhamCapList = [],
  onClose,
  onSuccessCreate,
}) => {
  const { t } = useTranslation();
  const dvtListId = useId();
  const phamCapListId = useId();
  const isEdit = !!initialData;
  const createMutation = useCreateHangHoa(onClose);
  const updateMutation = useUpdateHangHoa(onClose);
  const { data: danhMucCap2List = [] } = useDanhMucCap2WithParent();

  /** Chỉ danh mục cấp 2; label = "Tên cấp 1 / Tên cấp 2". */
  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('hangHoa.form.categoryNone') },
      ...danhMucCap2List.map((d) => ({
        value: d.id,
        label: d.ten_danh_muc_cha ? `${d.ten_danh_muc_cha} / ${d.ten_danh_muc}` : d.ten_danh_muc,
        subLabel: d.ten_danh_muc,
      })),
    ],
    [danhMucCap2List, t]
  );

  const defaultValues: Partial<HangHoaFormValues> = {
    ma_hang_hoa: '',
    ten_hang_hoa: '',
    id_danh_muc_cap2: null,
    dvt: '',
    don_gia: undefined,
    trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
    thu_tu: defaultThuTu ?? 1,
    pham_cap: null,
    mo_ta: null,
    hinh_anh: null,
  };

  const [isImageUploading, setIsImageUploading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<HangHoaFormValues>({
    resolver: zodResolver(hangHoaSchema) as any,
    defaultValues,
  });

  const handleUploadImage = useCallback(async (file: File) => {
    if (!CLOUDINARY_READY) return null;
    setIsImageUploading(true);
    try {
      return await uploadImageToCloudinary(file, 'farm-erp/hang-hoa');
    } finally {
      setIsImageUploading(false);
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      reset({
        ma_hang_hoa: initialData.ma_hang_hoa,
        ten_hang_hoa: initialData.ten_hang_hoa,
        id_danh_muc_cap2: initialData.danh_muc_id ?? null,
        dvt: initialData.dvt ?? '',
        don_gia: initialData.don_gia ?? undefined,
        trang_thai: initialData.trang_thai,
        thu_tu: initialData.thu_tu,
        pham_cap: initialData.pham_cap ?? null,
        mo_ta: initialData.mo_ta ?? null,
        hinh_anh: initialData.hinh_anh ?? null,
      });
    } else {
      reset({ ...defaultValues, thu_tu: defaultThuTu ?? 1 });
    }
  }, [initialData, defaultThuTu, reset]);

  const onSubmit: SubmitHandler<HangHoaFormValues> = (data) => {
    const sanitized = {
      ...data,
      id_danh_muc_cap2: data.id_danh_muc_cap2 === '' || data.id_danh_muc_cap2 === undefined ? null : data.id_danh_muc_cap2,
      dvt: data.dvt?.trim() || null,
      don_gia: data.don_gia != null && !Number.isNaN(Number(data.don_gia)) && Number(data.don_gia) >= 0 ? Number(data.don_gia) : null,
      pham_cap: data.pham_cap?.trim() || null,
      mo_ta: data.mo_ta?.trim() || null,
      hinh_anh: data.hinh_anh?.trim() || null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized, {
        onSuccess: (created) => {
          if (onSuccessCreate) {
            onSuccessCreate(created);
          } else {
            onClose();
          }
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const footerLoading = isLoading || isImageUploading;

  return (
    <GenericDrawer
      title={isEdit ? t('hangHoa.form.editTitle') : t('hangHoa.form.createTitle')}
      icon={<Package size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="hang-hoa-form"
          onCancel={onClose}
          isLoading={footerLoading}
          isEdit={isEdit}
          saveLabel={t('hangHoa.form.save')}
          createLabel={t('hangHoa.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="hang-hoa-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('hangHoa.detail.basicInfo')} icon={<Package size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('hangHoa.form.code')}
              placeholder={t('hangHoa.form.codePlaceholder')}
              icon={<Package size={12} />}
              required
              {...register('ma_hang_hoa')}
              error={errors.ma_hang_hoa?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_hang_hoa').onChange(e);
              }}
            />
            <Input
              label={t('hangHoa.form.name')}
              placeholder={t('hangHoa.form.namePlaceholder')}
              icon={<Package size={12} />}
              required
              {...register('ten_hang_hoa')}
              error={errors.ten_hang_hoa?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_danh_muc_cap2"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('hangHoa.form.category')}
                    icon={<Folder size={12} />}
                    options={categoryOptions}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v ?? '')}
                    placeholder={t('hangHoa.form.categoryPlaceholderCap2')}
                    searchable
                    dropdownInPortal
                    required
                    error={errors.id_danh_muc_cap2?.message}
                  />
                )}
              />
            </div>
            <div className="relative">
              <Input
                label={t('hangHoa.form.unit')}
                placeholder={t('hangHoa.form.unitPlaceholder')}
                icon={<Package size={12} />}
                list={dvtListId}
                required
                {...register('dvt')}
                error={errors.dvt?.message}
              />
              {existingDvtList.length > 0 && (
                <datalist id={dvtListId}>
                  {existingDvtList.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              )}
            </div>
            <div className="relative">
              <Input
                label={t('hangHoa.form.phamCap')}
                placeholder={t('hangHoa.form.phamCapPlaceholder')}
                icon={<Package size={12} />}
                list={phamCapListId}
                {...register('pham_cap')}
                error={errors.pham_cap?.message}
              />
              {existingPhamCapList.length > 0 && (
                <datalist id={phamCapListId}>
                  {existingPhamCapList.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              )}
            </div>
            <Controller
              name="don_gia"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label={t('hangHoa.form.price')}
                  placeholder={t('hangHoa.form.pricePlaceholder')}
                  icon={<DollarSign size={12} />}
                  value={field.value ?? 0}
                  onChange={(n) => field.onChange(n != null && !Number.isNaN(n) ? n : undefined)}
                  required
                  error={errors.don_gia?.message}
                  suffix=""
                />
              )}
            />
            <Input
              type="number"
              min={1}
              label={t('hangHoa.detail.order')}
              icon={<ArrowUpFromLine size={12} />}
              required
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="trang_thai"
                control={control}
                render={({ field }) => (
                  <StatusToggle
                    label={t('common.status')}
                    value={field.value}
                    onChange={field.onChange}
                    activeValue={TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG}
                    inactiveValue={TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG}
                    activeLabel={t('common.activeStatus')}
                    inactiveLabel={t('common.inactiveStatus')}
                    icon={<Power size={12} />}
                    required
                  />
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="mo_ta"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                      <FileText size={12} className="text-muted-foreground shrink-0" />
                      {t('hangHoa.detail.description')}
                    </label>
                    <textarea
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      placeholder={t('hangHoa.form.descriptionPlaceholder')}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y min-h-[56px]"
                    />
                  </div>
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2 flex justify-center">
              <Controller
                name="hinh_anh"
                control={control}
                render={({ field }) => (
                  <SingleImageInput
                    label={t('hangHoa.form.image')}
                    icon={<Camera className="w-4 h-4" />}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    placeholder={t('hangHoa.form.imagePlaceholder')}
                    hint={t('hangHoa.form.imageHint')}
                    uploadFile={CLOUDINARY_READY ? handleUploadImage : undefined}
                    shape="rounded"
                    aspectRatio="1/1"
                    maxSizeMB={2}
                    className="w-[180px]"
                  />
                )}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DanhSachHangHoaForm;
