import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Calendar, Clock, ImagePlus, Phone, Truck, User } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import MultiImageInput from '../../../../components/ui/MultiImageInput';
import { TRANG_THAI } from '../../../../lib/constants';
import { getTodayISO } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { dangKyNhanHangFormSchema, type DangKyNhanHangFormValues } from '../core/schema';
import type { DangKyNhanHang } from '../core/types';
import { useCreateDangKyNhanHang, useUpdateDangKyNhanHang } from '../hooks/use-dang-ky-nhan-hang';
import { MAX_ANH_PHIEU, imageItemsToUrls, uploadAnhDangKyNhanHang, urlsToImageItems } from '../utils/anh-upload';

interface Props {
  branches: Branch[];
  initialData?: DangKyNhanHang | null;
  preferredBranchId?: string | null;
  /** Giá trị đã dùng (toàn bộ phiếu) — gợi ý cho ô khách hàng / loại hàng. */
  goiYKhachHang: string[];
  goiYLoaiHang: string[];
  onClose: () => void;
}

function toForm(d: DangKyNhanHang): DangKyNhanHangFormValues {
  return {
    id_chi_nhanh: d.id_chi_nhanh,
    ngay_dang_ky: d.ngay_dang_ky,
    khach_hang: d.khach_hang ?? '',
    loai_hang_hoa: d.loai_hang_hoa ?? '',
    so_xe: d.so_xe ?? '',
    so_cont: d.so_cont ?? '',
    ten_tai_xe: d.ten_tai_xe ?? '',
    sdt_tai_xe: d.sdt_tai_xe ?? '',
    gio_dang_ky_tu: d.gio_dang_ky_tu ?? '',
    gio_dang_ky_den: d.gio_dang_ky_den ?? '',
    ghi_chu: d.ghi_chu ?? '',
    hinh_anh_urls: d.hinh_anh_urls ?? [],
  };
}

const DangKyNhanHangForm: React.FC<Props> = ({
  branches,
  initialData,
  preferredBranchId,
  goiYKhachHang,
  goiYLoaiHang,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDangKyNhanHang(onClose);
  const updateMutation = useUpdateDangKyNhanHang(onClose);

  const defaultValues = useMemo<DangKyNhanHangFormValues>(
    () =>
      initialData
        ? toForm(initialData)
        : {
            id_chi_nhanh: preferredBranchId ?? '',
            ngay_dang_ky: getTodayISO(),
            khach_hang: '',
            loai_hang_hoa: '',
            so_xe: '',
            so_cont: '',
            ten_tai_xe: '',
            sdt_tai_xe: '',
            gio_dang_ky_tu: '',
            gio_dang_ky_den: '',
            ghi_chu: '',
            hinh_anh_urls: [],
          },
    [initialData, preferredBranchId]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DangKyNhanHangFormValues>({
    resolver: zodResolver(dangKyNhanHangFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isDirty) return;
    reset(defaultValues);
  }, [defaultValues, reset, isDirty]);

  const branchOptions = useMemo(() => {
    const opts = branches
      .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG || b.id === initialData?.id_chi_nhanh)
      .map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` }));
    return opts;
  }, [branches, initialData?.id_chi_nhanh]);

  const toOptions = (list: string[]) => list.map((v) => ({ value: v, label: v }));
  const khachHangOptions = useMemo(() => toOptions(goiYKhachHang), [goiYKhachHang]);
  const loaiHangOptions = useMemo(() => toOptions(goiYLoaiHang), [goiYLoaiHang]);

  const onSubmit: SubmitHandler<DangKyNhanHangFormValues> = (values) => {
    if (isEdit && initialData) updateMutation.mutate({ id: initialData.id, data: values });
    else createMutation.mutate(values);
  };

  const pending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  const textField = (
    name: 'so_xe' | 'so_cont' | 'ten_tai_xe' | 'sdt_tai_xe',
    labelKey: string,
    icon: React.ReactNode,
    extra?: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          {...field}
          {...extra}
          value={field.value ?? ''}
          label={t(labelKey)}
          icon={icon}
          error={errors[name]?.message}
        />
      )}
    />
  );

  return (
    <GenericDrawer
      title={t(isEdit ? 'dangKyNhanHang.form.titleEdit' : 'dangKyNhanHang.form.titleCreate')}
      subtitle={t('dangKyNhanHang.form.subtitle')}
      icon={<Truck className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="dang-ky-nhan-hang-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="dang-ky-nhan-hang-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('dangKyNhanHang.detail.thongTinDangKy')}>
          <FormGrid cols={2}>
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('dangKyNhanHang.col.chiNhanh')}
                  required
                  icon={<Building2 size={16} className="text-muted-foreground" />}
                  options={branchOptions}
                  value={field.value || null}
                  onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                  error={errors.id_chi_nhanh?.message}
                />
              )}
            />
            <Controller
              name="ngay_dang_ky"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  label={t('dangKyNhanHang.col.ngay')}
                  icon={<Calendar size={12} />}
                  required
                  error={errors.ngay_dang_ky?.message}
                />
              )}
            />
            <Controller
              name="khach_hang"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('dangKyNhanHang.col.khachHang')}
                  placeholder={t('dangKyNhanHang.form.khachHangPlaceholder')}
                  options={khachHangOptions}
                  value={field.value || null}
                  onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                  creatable
                  creatableLabel={t('dangKyNhanHang.form.dungGiaTriMoi')}
                />
              )}
            />
            <Controller
              name="loai_hang_hoa"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('dangKyNhanHang.col.loaiHang')}
                  placeholder={t('dangKyNhanHang.form.loaiHangPlaceholder')}
                  options={loaiHangOptions}
                  value={field.value || null}
                  onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                  creatable
                  creatableLabel={t('dangKyNhanHang.form.dungGiaTriMoi')}
                />
              )}
            />
            {textField('so_xe', 'dangKyNhanHang.form.soXe', <Truck size={12} />, {
              placeholder: '81C-180.26',
              autoCapitalize: 'characters',
            })}
            {textField('so_cont', 'dangKyNhanHang.form.soCont', <Truck size={12} />, {
              placeholder: 'EMCU 547xxxx',
              autoCapitalize: 'characters',
            })}
            {textField('ten_tai_xe', 'dangKyNhanHang.col.taiXe', <User size={12} />)}
            {textField('sdt_tai_xe', 'dangKyNhanHang.form.sdtTaiXe', <Phone size={12} />, {
              type: 'tel',
              inputMode: 'tel',
            })}
          </FormGrid>
        </FormSection>

        <FormSection title={t('dangKyNhanHang.form.xinPhepRaVao')}>
          <FormGrid cols={2}>
            <Controller
              name="gio_dang_ky_tu"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="time"
                  label={t('dangKyNhanHang.form.tuGio')}
                  icon={<Clock size={12} />}
                  error={errors.gio_dang_ky_tu?.message}
                />
              )}
            />
            <Controller
              name="gio_dang_ky_den"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="time"
                  label={t('dangKyNhanHang.form.denGio')}
                  icon={<Clock size={12} />}
                  error={errors.gio_dang_ky_den?.message}
                />
              )}
            />
          </FormGrid>
          <p className="text-xs text-muted-foreground mt-2">{t('dangKyNhanHang.form.gioHint')}</p>
          <div className="mt-3">
            <Controller
              name="ghi_chu"
              control={control}
              render={({ field }) => (
                <Textarea label={t('dangKyNhanHang.col.ghiChu')} {...field} value={field.value ?? ''} rows={2} />
              )}
            />
          </div>
        </FormSection>

        <FormSection title={t('dangKyNhanHang.anh.title')}>
          <Controller
            name="hinh_anh_urls"
            control={control}
            render={({ field }) => (
              <MultiImageInput
                icon={<ImagePlus size={12} />}
                value={urlsToImageItems(field.value ?? [])}
                onChange={(items) => field.onChange(imageItemsToUrls(items))}
                uploadFile={uploadAnhDangKyNhanHang}
                maxFiles={MAX_ANH_PHIEU}
                maxSizeMB={8}
                columns={4}
                hint={t('dangKyNhanHang.anh.hintTuyChon')}
              />
            )}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DangKyNhanHangForm;
