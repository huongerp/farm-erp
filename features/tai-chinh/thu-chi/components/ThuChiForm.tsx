import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, Wallet, User, ArrowRightLeft } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import { thuChiSchema, type ThuChiFormValues } from '../core/schema';
import type { ThuChi } from '../../core/types';
import { useCreateThuChi, useUpdateThuChi } from '../hooks/use-thu-chi';
import { useDanhMucTaiChinh } from '../../danh-muc-tai-chinh/hooks/use-danh-muc-tai-chinh';
import { useTaiKhoan } from '../../tai-khoan/hooks/use-tai-khoan';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useDeXuatChiPhiList } from '../../de-xuat-chi-phi/hooks/use-de-xuat-chi-phi';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { toast } from 'sonner';

interface Props {
  initialData?: ThuChi | null;
  onClose: () => void;
}

const ThuChiForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateThuChi(onClose);
  const updateMutation = useUpdateThuChi(onClose);

  const { data: allDanhMuc = [] } = useDanhMucTaiChinh();
  const { data: taiKhoanList = [] } = useTaiKhoan();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: deXuatList = [] } = useDeXuatChiPhiList();

  const taiKhoanOptions = useMemo(
    () =>
      taiKhoanList
        .filter((tk) => tk.trang_thai === 1)
        .map((tk) => ({ value: tk.id, label: `${tk.ten_tai_khoan}${tk.so_tai_khoan ? ` (${tk.so_tai_khoan})` : ''}` })),
    [taiKhoanList]
  );

  const nhanVienOptions = useMemo(
    () => [
      { value: '', label: t('thuChi.form.chonNhanVien') },
      ...employees.map((e) => ({ value: e.id, label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}` })),
    ],
    [employees, t]
  );

  const danhMucOptionsThu = useMemo(() => {
    const list = allDanhMuc.filter((d) => d.loai === 'thu' && d.trang_thai === 1);
    return [{ value: '', label: t('thuChi.form.chonDanhMuc') }, ...list.map((d) => ({ value: d.id, label: `${d.ma_danh_muc} - ${d.ten_danh_muc}` }))];
  }, [allDanhMuc, t]);

  const danhMucOptionsChi = useMemo(() => {
    const list = allDanhMuc.filter((d) => d.loai === 'chi' && d.trang_thai === 1);
    return [{ value: '', label: t('thuChi.form.chonDanhMuc') }, ...list.map((d) => ({ value: d.id, label: `${d.ma_danh_muc} - ${d.ten_danh_muc}` }))];
  }, [allDanhMuc, t]);

  const deXuatOptions = useMemo(
    () => [
      { value: '', label: t('thuChi.form.lienKetDeXuat') + ' (tùy chọn)' },
      ...deXuatList.filter((d) => d.trang_thai === 1).map((d) => ({ value: d.id, label: d.so_phieu })),
    ],
    [deXuatList, t]
  );

  const defaultValues: Partial<ThuChiFormValues> = {
    ma_giao_dich: '',
    ngay_giao_dich: new Date().toISOString().slice(0, 16),
    so_tien: 0,
    loai: 'chi',
    id_tai_khoan: '',
    id_danh_muc: '',
    noi_dung: '',
    id_nhan_vien_thuc_hien: '',
    trang_thai: 'hoan_thanh',
    id_tai_khoan_dich: '',
    phi_giao_dich: undefined,
    id_de_xuat_chi_phi: '',
    ghi_chu: null,
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<ThuChiFormValues>({
    resolver: zodResolver(thuChiSchema) as any,
    defaultValues,
  });

  const selectedLoai = watch('loai');

  useEffect(() => {
    if (initialData) {
      reset({
        ma_giao_dich: initialData.ma_giao_dich,
        ngay_giao_dich: initialData.ngay_giao_dich.slice(0, 16),
        so_tien: initialData.so_tien,
        loai: initialData.loai,
        id_tai_khoan: initialData.id_tai_khoan,
        id_danh_muc: initialData.id_danh_muc ?? '',
        noi_dung: initialData.noi_dung,
        id_nhan_vien_thuc_hien: initialData.id_nhan_vien_thuc_hien ?? '',
        trang_thai: initialData.trang_thai,
        id_tai_khoan_dich: initialData.id_tai_khoan_dich ?? '',
        phi_giao_dich: initialData.phi_giao_dich,
        id_de_xuat_chi_phi: initialData.id_de_xuat_chi_phi ?? '',
        ghi_chu: null,
      });
    } else {
      reset({
        ...defaultValues,
        ngay_giao_dich: new Date().toISOString().slice(0, 16),
      });
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<ThuChiFormValues> = (data) => {
    const sanitized: ThuChiFormValues = {
      ...data,
      id_danh_muc: data.loai === 'chuyen_quy' ? undefined : data.id_danh_muc,
      id_tai_khoan_dich: data.loai === 'chuyen_quy' ? data.id_tai_khoan_dich : undefined,
      phi_giao_dich: data.loai === 'chuyen_quy' ? data.phi_giao_dich : undefined,
      id_de_xuat_chi_phi: data.id_de_xuat_chi_phi || undefined,
      ghi_chu: data.ghi_chu?.trim() || null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate(
        { id: initialData.id, data: sanitized },
        {
          onSuccess: () => toast.success(t('thuChi.toast.updateSuccess')),
          onError: () => toast.error(t('common.error')),
        }
      );
    } else {
      createMutation.mutate(sanitized, {
        onSuccess: () => toast.success(t('thuChi.toast.createSuccess')),
        onError: () => toast.error(t('common.error')),
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const danhMucOptions = selectedLoai === 'thu' ? danhMucOptionsThu : danhMucOptionsChi;

  return (
    <GenericDrawer
      title={isEdit ? t('thuChi.form.editTitle') : t('thuChi.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="thu-chi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thuChi.form.save')}
          createLabel={t('thuChi.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="thu-chi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thuChi.form.maGiaoDich')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thuChi.form.maGiaoDich')}
              placeholder="TC-2025-001"
              icon={<FileText size={12} />}
              required
              {...register('ma_giao_dich')}
              error={errors.ma_giao_dich?.message}
            />
            <Input
              label={t('thuChi.form.ngayGiaoDich')}
              type="datetime-local"
              icon={<Calendar size={12} />}
              required
              {...register('ngay_giao_dich')}
              error={errors.ngay_giao_dich?.message}
            />
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                <ArrowRightLeft size={12} className="text-muted-foreground" />
                {t('thuChi.form.loai')}
              </label>
              <div className="flex gap-4 flex-wrap">
                {(['thu', 'chi', 'chuyen_quy'] as const).map((loai) => (
                  <label key={loai} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={loai}
                      checked={watch('loai') === loai}
                      onChange={() => control.setValue('loai', loai)}
                      className="rounded border-border text-primary accent-primary"
                    />
                    <span className="text-sm">
                      {loai === 'thu' ? t('thuChi.loaiThu') : loai === 'chi' ? t('thuChi.loaiChi') : t('thuChi.loaiChuyenQuy')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Controller
              name="id_tai_khoan"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('thuChi.form.taiKhoan')}
                  options={[{ value: '', label: t('thuChi.form.taiKhoan') + '...' }, ...taiKhoanOptions]}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  icon={<Wallet size={12} />}
                  required
                  error={errors.id_tai_khoan?.message}
                />
              )}
            />
            {selectedLoai !== 'chuyen_quy' && (
              <Controller
                name="id_danh_muc"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('thuChi.form.danhMuc')}
                    options={danhMucOptions}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    error={errors.id_danh_muc?.message}
                  />
                )}
              />
            )}
            {selectedLoai === 'chuyen_quy' && (
              <>
                <Controller
                  name="id_tai_khoan_dich"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t('thuChi.form.taiKhoanDich')}
                      options={[{ value: '', label: t('thuChi.form.taiKhoanDich') + '...' }, ...taiKhoanOptions]}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      icon={<ArrowRightLeft size={12} />}
                      required={selectedLoai === 'chuyen_quy'}
                      error={errors.id_tai_khoan_dich?.message}
                    />
                  )}
                />
                <Controller
                  name="phi_giao_dich"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      label={t('thuChi.form.phiGiaoDich')}
                      value={field.value ?? 0}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                />
              </>
            )}
            <Controller
              name="so_tien"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label={t('thuChi.form.soTien')}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  required
                  error={errors.so_tien?.message}
                />
              )}
            />
            <Controller
              name="id_nhan_vien_thuc_hien"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('thuChi.form.nguoiThucHien')}
                  options={nhanVienOptions}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  icon={<User size={12} />}
                  error={errors.id_nhan_vien_thuc_hien?.message}
                />
              )}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('thuChi.form.trangThai')}
                  options={[
                    { value: 'cho_duyet', label: t('thuChi.status.choDuyet') },
                    { value: 'hoan_thanh', label: t('thuChi.status.hoanThanh') },
                    { value: 'huy', label: t('thuChi.status.huy') },
                  ]}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              name="id_de_xuat_chi_phi"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('thuChi.form.lienKetDeXuat')}
                  options={deXuatOptions}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              )}
            />
            <div className="col-span-2">
              <Textarea
                label={t('thuChi.form.noiDung')}
                placeholder="Nội dung giao dịch..."
                required
                {...register('noi_dung')}
                error={errors.noi_dung?.message}
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Textarea label={t('thuChi.form.ghiChu')} placeholder="Ghi chú..." {...register('ghi_chu')} error={errors.ghi_chu?.message} rows={2} />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThuChiForm;
