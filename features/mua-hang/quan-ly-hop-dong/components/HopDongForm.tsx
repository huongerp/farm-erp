import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Images } from 'lucide-react';
import { toast } from 'sonner';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import MultiImageInput, { type ImageItem } from '../../../../components/ui/MultiImageInput';
import { uploadImageToCloudinary } from '../../../../lib/cloudinary';
import { hopDongSchema, type HopDongFormValues } from '../core/schema';
import type { HopDong } from '../core/types';
import type { DoiTacRefLite } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import { useCreateHopDong, useUpdateHopDong } from '../hooks/use-hop-dong';
import { TRANG_THAI_HOP_DONG } from '../core/constants';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { getTodayISO } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/useStore';

const CLOUDINARY_READY =
  Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) && Boolean(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

function urlsToImageItems(urls: string[]): ImageItem[] {
  return urls.map((src) => ({ id: src, src }));
}

function imageItemsToUrls(items: ImageItem[]): string[] {
  return items
    .map((i) => i.src)
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
}

interface Props {
  doiTacList: DoiTacRefLite[];
  initialData?: HopDong | null;
  onClose: () => void;
}

function hopDongToFormValues(item: HopDong | null | undefined): HopDongFormValues {
  if (!item) {
    return {
      ngay: getTodayISO(),
      ma_hop_dong: '',
      ten_hop_dong: '',
      id_nha_cung_cap: '',
      noi_dung: '',
      so_luong_cay: undefined,
      don_gia: undefined,
      thanh_tien: undefined,
      trang_thai: TRANG_THAI_HOP_DONG[0],
      ghi_chu: '',
      hinh_anh_urls: [],
    };
  }
  return {
    ngay: item.ngay ?? '',
    ma_hop_dong: item.ma_hop_dong,
    ten_hop_dong: item.ten_hop_dong ?? '',
    id_nha_cung_cap: item.id_nha_cung_cap,
    noi_dung: item.noi_dung ?? '',
    so_luong_cay: item.so_luong_cay ?? undefined,
    don_gia: item.don_gia ?? undefined,
    thanh_tien: item.thanh_tien ?? undefined,
    trang_thai: item.trang_thai,
    ghi_chu: item.ghi_chu ?? '',
    hinh_anh_urls: item.hinh_anh_urls ?? [],
  };
}

const HopDongForm: React.FC<Props> = ({ doiTacList, initialData, onClose }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData?.id;
  const createMutation = useCreateHopDong(onClose);
  const updateMutation = useUpdateHopDong(onClose);

  const defaultValues = useMemo(() => hopDongToFormValues(initialData ?? null), [initialData]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HopDongFormValues>({
    resolver: zodResolver(hopDongSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    reset(hopDongToFormValues(initialData ?? null));
  }, [initialData, reset]);

  const sl = watch('so_luong_cay');
  const dg = watch('don_gia');
  useEffect(() => {
    const a = sl != null ? Number(sl) : NaN;
    const b = dg != null ? Number(dg) : NaN;
    if (Number.isFinite(a) && Number.isFinite(b)) {
      setValue('thanh_tien', a * b);
    }
  }, [sl, dg, setValue]);

  const nccOptions = useMemo(
    () =>
      doiTacList
        .filter((d) => d.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((d) => ({ value: d.id, label: `${d.ma_ncc} - ${d.ten_ncc}` })),
    [doiTacList]
  );

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_HOP_DONG.map((s) => ({
        value: s,
        label: s === 'Đang thực hiện' ? t('hopDong.trangThai.dangThucHien') : t('hopDong.trangThai.daThanhLy'),
      })),
    [t]
  );

  const onSubmit: SubmitHandler<HopDongFormValues> = (data) => {
    if (isEdit && initialData?.id) {
      updateMutation.mutate({ id: initialData.id, data });
      return;
    }
    if (!user?.id) {
      toast.error(t('hopDong.validation.userRequired'));
      return;
    }
    createMutation.mutate({ data, idNguoiTao: user.id });
  };

  const pending = createMutation.isPending || updateMutation.isPending;
  const thanhTien = watch('thanh_tien');

  const handleUploadImage = useCallback(
    (file: File) => uploadImageToCloudinary(file, 'farm-erp/hop-dong'),
    []
  );

  return (
    <GenericDrawer
      title={isEdit ? t('hopDong.form.editTitle') : t('hopDong.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="hop-dong-form"
          onCancel={onClose}
          isLoading={pending}
          isEdit={isEdit}
          saveLabel={t('hopDong.form.save')}
          createLabel={t('hopDong.form.create')}
        />
      }
    >
      <form id="hop-dong-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-6">
          <FormSection title={t('hopDong.detail.basic')} icon={<FileText size={14} />} variant="primary">
            <FormGrid cols={2}>
              <Input
                label={t('hopDong.form.maHopDong')}
                placeholder={t('hopDong.form.maHopDongPlaceholder')}
                error={errors.ma_hop_dong?.message}
                required
                {...register('ma_hop_dong')}
              />
              <Input
                label={t('hopDong.form.ngay')}
                type="date"
                required
                error={errors.ngay?.message}
                {...register('ngay')}
              />
              <div className="sm:col-span-2">
                <Controller
                  name="id_nha_cung_cap"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      label={t('hopDong.form.ncc')}
                      placeholder={t('hopDong.form.nccPlaceholder')}
                      options={nccOptions}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.id_nha_cung_cap?.message}
                      required
                    />
                  )}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label={t('hopDong.form.tenHopDong')}
                  required
                  error={errors.ten_hop_dong?.message}
                  {...register('ten_hop_dong')}
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea label={t('hopDong.form.noiDung')} rows={5} {...register('noi_dung')} />
              </div>
              <Controller
                name="so_luong_cay"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label={t('hopDong.form.soLuongCay')}
                    suffix={t('hopDong.form.suffixCay')}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v === 0 ? undefined : v)}
                    error={errors.so_luong_cay?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name="don_gia"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label={t('hopDong.form.donGia')}
                    suffix={t('hopDong.form.suffixDong')}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v === 0 ? undefined : v)}
                    error={errors.don_gia?.message as string | undefined}
                  />
                )}
              />
              <div className="sm:col-span-2">
                <CurrencyInput
                  label={t('hopDong.form.thanhTien')}
                  suffix={t('hopDong.form.suffixDong')}
                  value={thanhTien ?? ''}
                  disabled
                />
              </div>
              <Controller
                name="trang_thai"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('hopDong.form.trangThai')}
                    options={trangThaiOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.trang_thai?.message}
                    required
                  />
                )}
              />
              <div className="sm:col-span-2">
                <Textarea label={t('hopDong.form.ghiChu')} rows={2} {...register('ghi_chu')} />
              </div>
            </FormGrid>
          </FormSection>

          <FormSection title={t('hopDong.form.hinhAnhSection')} icon={<Images size={14} />} variant="primary">
            <Controller
              name="hinh_anh_urls"
              control={control}
              render={({ field }) => (
                <MultiImageInput
                  label={t('hopDong.form.hinhAnh')}
                  icon={<Images className="w-4 h-4 text-muted-foreground" />}
                  value={urlsToImageItems(field.value ?? [])}
                  onChange={(items) => field.onChange(imageItemsToUrls(items))}
                  uploadFile={CLOUDINARY_READY ? handleUploadImage : undefined}
                  hint={
                    CLOUDINARY_READY
                      ? t('hopDong.form.hinhAnhHint')
                      : t('hopDong.form.hinhAnhOfflineHint')
                  }
                  maxFiles={20}
                  maxSizeMB={5}
                  columns={4}
                  error={errors.hinh_anh_urls?.message as string | undefined}
                />
              )}
            />
          </FormSection>
        </div>
      </form>
    </GenericDrawer>
  );
};

export default HopDongForm;
