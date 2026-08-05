import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Calendar, Building2, Users, Tag, User, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import { thanhToanDoiTacSchema, type ThanhToanDoiTacFormValues } from '../core/schema';
import type { ThanhToanDoiTac } from '../core/types';
import type { DoiTacRefLite } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { TrangThaiThanhToanDoiTac } from '../../thiet-lap-de-xuat-vat-tu/core/types';
import { useCreateThanhToanDoiTac, useUpdateThanhToanDoiTac } from '../hooks/use-thanh-toan-doi-tac';
import { useCauHinhSoPhieuThanhToan } from '../hooks/use-cau-hinh-so-phieu-thanh-toan';
import { getNextSoPhieuThanhToanPreview } from '../services/cau-hinh-so-phieu-thanh-toan.service';
import { getNextSoPhieuThanhToanDoiTacRpc } from '../services/thanh-toan-doi-tac-supabase.service';
import { getTodayISO } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG, TRANG_THAI } from '../../../../lib/constants';
import { useAuthStore } from '../../../../store/useStore';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  doiTacList: DoiTacRefLite[];
  chiNhanhList: Branch[];
  employees: EmployeeRef[];
  statusList: TrangThaiThanhToanDoiTac[];
  initialData?: ThanhToanDoiTac | null;
  onClose: () => void;
}

const ThanhToanDoiTacForm: React.FC<Props> = ({
  doiTacList,
  chiNhanhList,
  employees,
  statusList,
  initialData,
  onClose,
}) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData;
  const isCreate = !isEdit;
  const createMutation = useCreateThanhToanDoiTac(onClose);
  const updateMutation = useUpdateThanhToanDoiTac(onClose);
  const { data: config } = useCauHinhSoPhieuThanhToan();

  const doiTacOptions = useMemo(
    () =>
      doiTacList
        .filter((d) => d.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((d) => ({ value: d.id, label: `${d.ma_ncc} - ${d.ten_ncc}` })),
    [doiTacList]
  );

  const donViOptions = useMemo(
    () => [
      { value: '', label: t('thanhToanDoiTac.form.donViPlaceholder') },
      ...chiNhanhList
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
        .map((b) => ({ value: b.id, label: b.ten_chi_nhanh })),
    ],
    [chiNhanhList, t]
  );

  /** Trạng thái có thu_tu nhỏ nhất (đang hoạt động) – dùng làm mặc định khi tạo mới */
  const idTrangThaiMacDinh = useMemo(() => {
    const active = statusList.filter((s) => s.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG);
    if (active.length === 0) return '';
    const min = active.reduce((best, s) => (s.thu_tu < best.thu_tu ? s : best), active[0]);
    return min.id;
  }, [statusList]);

  const statusOptions = useMemo(() => {
    const fromList = statusList
      .filter((s) => s.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
      .map((s) => ({ value: s.id, label: s.ten }));
    const current = initialData?.id_trang_thai_thanh_toan;
    if (current && !fromList.some((o) => o.value === current)) {
      return [{ value: current, label: initialData?.ten_trang_thai ?? current }, ...fromList];
    }
    return fromList;
  }, [statusList, initialData?.id_trang_thai_thanh_toan, initialData?.ten_trang_thai]);

  const nguoiTaoOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}`,
      })),
    [employees]
  );

  const defaultValues: Partial<ThanhToanDoiTacFormValues> = {
    so_phieu: '',
    hang_muc_thanh_toan: '',
    ngay: getTodayISO().slice(0, 10),
    id_don_vi: '',
    id_doi_tac: '',
    id_trang_thai_thanh_toan: '',
    so_tien: 0,
    ngay_xu_ly: null,
    ghi_chu: null,
    id_nguoi_tao: '',
  };

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control, setValue } = useForm<ThanhToanDoiTacFormValues>({
    resolver: zodResolver(thanhToanDoiTacSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    // Không reset nếu người dùng đã bắt đầu sửa — cùng lý do đã sửa ở DonDatHangForm.
    if (isDirty) return;
    if (initialData) {
      reset({
        so_phieu: initialData.so_phieu,
        hang_muc_thanh_toan: initialData.hang_muc_thanh_toan,
        ngay: initialData.ngay,
        id_don_vi: initialData.id_don_vi ?? '',
        id_doi_tac: initialData.id_doi_tac,
        id_trang_thai_thanh_toan: initialData.id_trang_thai_thanh_toan,
        so_tien: initialData.so_tien,
        ngay_xu_ly: initialData.ngay_xu_ly ?? null,
        ghi_chu: initialData.ghi_chu ?? null,
        id_nguoi_tao: initialData.id_nguoi_tao,
      });
    } else {
      reset({ ...defaultValues, ngay: getTodayISO().slice(0, 10) });
      if (config?.tu_sinh_so_phieu) {
        getNextSoPhieuThanhToanPreview().then((preview) => {
          if (preview) setValue('so_phieu', preview);
        });
      }
      if (user?.id_chi_nhanh) setValue('id_don_vi', user.id_chi_nhanh);
      if (user?.id) setValue('id_nguoi_tao', user.id);
      if (idTrangThaiMacDinh) setValue('id_trang_thai_thanh_toan', idTrangThaiMacDinh);
    }
  }, [initialData, config?.tu_sinh_so_phieu, reset, setValue, user?.id, user?.id_chi_nhanh, idTrangThaiMacDinh, isDirty]);

  // Khi tạo mới và bật tự sinh: đảm bảo preview số phiếu luôn được điền (kể cả config load sau)
  useEffect(() => {
    if (!isCreate || !config?.tu_sinh_so_phieu) return;
    getNextSoPhieuThanhToanPreview().then((preview) => {
      if (preview) setValue('so_phieu', preview);
    });
  }, [isCreate, config?.tu_sinh_so_phieu, setValue]);

  // Tạo mới: tự điền đơn vị (theo chi nhánh) và người tạo (nhân viên đang thao tác)
  useEffect(() => {
    if (!isCreate) return;
    if (user?.id_chi_nhanh) setValue('id_don_vi', user.id_chi_nhanh);
    if (user?.id) setValue('id_nguoi_tao', user.id);
  }, [isCreate, user?.id, user?.id_chi_nhanh, setValue]);

  const onSubmit: SubmitHandler<ThanhToanDoiTacFormValues> = async (data) => {
    let soPhieu = data.so_phieu?.trim() ?? '';
    if (isCreate && config?.tu_sinh_so_phieu) {
      try {
        soPhieu = await getNextSoPhieuThanhToanDoiTacRpc({
          tien_to_so_phieu: config.tien_to_so_phieu ?? 'TTO-',
          do_dai_phan_so: config.do_dai_phan_so ?? 4,
        });
      } catch {
        return;
      }
    }
    const sanitized: ThanhToanDoiTacFormValues = {
      ...data,
      so_phieu: (soPhieu || data.so_phieu?.trim()) ?? '',
      // id_don_vi đã được zod validate là non-empty (schema.ts: min(1)) trước khi RHF gọi handler này.
      ngay_xu_ly: data.ngay_xu_ly === '' ? null : data.ngay_xu_ly,
      ghi_chu: data.ghi_chu === '' ? null : data.ghi_chu,
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
      title={isEdit ? t('thanhToanDoiTac.form.editTitle') : t('thanhToanDoiTac.form.createTitle')}
      icon={<CreditCard size={20} />}
      onClose={onClose}
      isDirty={isDirty}
      footer={
        <FormDrawerFooter
          formId="thanh-toan-doi-tac-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thanhToanDoiTac.form.save')}
          createLabel={t('thanhToanDoiTac.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="thanh-toan-doi-tac-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thanhToanDoiTac.detail.basicInfo')} icon={<CreditCard size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thanhToanDoiTac.form.soPhieu')}
              placeholder={t('thanhToanDoiTac.form.soPhieuPlaceholder')}
              icon={<CreditCard size={12} />}
              required
              {...register('so_phieu')}
              error={errors.so_phieu?.message}
            />
            <Input
              label={t('thanhToanDoiTac.form.hangMuc')}
              placeholder={t('thanhToanDoiTac.form.hangMucPlaceholder')}
              icon={<FileText size={12} />}
              required
              {...register('hang_muc_thanh_toan')}
              error={errors.hang_muc_thanh_toan?.message}
            />
            <Input
              label={t('thanhToanDoiTac.form.ngay')}
              type="date"
              icon={<Calendar size={12} />}
              required
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <Controller
              name="id_don_vi"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thanhToanDoiTac.form.donVi')}
                  options={donViOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder={t('thanhToanDoiTac.form.donViPlaceholder')}
                  icon={<Building2 size={12} />}
                  required
                  error={errors.id_don_vi?.message}
                />
              )}
            />
            <Controller
              name="id_doi_tac"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thanhToanDoiTac.form.doiTac')}
                  options={doiTacOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('thanhToanDoiTac.form.doiTacPlaceholder')}
                  icon={<Users size={12} />}
                  required
                  error={errors.id_doi_tac?.message}
                />
              )}
            />
            <Controller
              name="id_trang_thai_thanh_toan"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thanhToanDoiTac.form.trangThai')}
                  options={statusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('thanhToanDoiTac.form.trangThaiPlaceholder')}
                  icon={<Tag size={12} />}
                  required
                  error={errors.id_trang_thai_thanh_toan?.message}
                />
              )}
            />
            <Controller
              name="so_tien"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label={t('thanhToanDoiTac.form.soTien')}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={1}
                  placeholder="Nhập số tiền"
                  icon={<CreditCard size={12} />}
                  required
                  error={errors.so_tien?.message}
                  maxFractionDigits={0}
                />
              )}
            />
            <Input
              label={t('thanhToanDoiTac.form.ngayXuLy')}
              type="date"
              icon={<Calendar size={12} />}
              {...register('ngay_xu_ly')}
              error={errors.ngay_xu_ly?.message}
            />
            <Controller
              name="id_nguoi_tao"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thanhToanDoiTac.form.nguoiTao')}
                  options={nguoiTaoOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('thanhToanDoiTac.form.nguoiTaoPlaceholder')}
                  icon={<User size={12} />}
                  required
                  error={errors.id_nguoi_tao?.message}
                />
              )}
            />
            <div className="col-span-2">
              <Textarea
                label={t('thanhToanDoiTac.form.ghiChu')}
                placeholder={t('thanhToanDoiTac.form.ghiChuPlaceholder')}
                rows={3}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThanhToanDoiTacForm;
