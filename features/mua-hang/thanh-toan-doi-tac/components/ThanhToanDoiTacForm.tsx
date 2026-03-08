import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Calendar, Building2, Users, Tag, User, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { thanhToanDoiTacSchema, type ThanhToanDoiTacFormValues } from '../core/schema';
import type { ThanhToanDoiTac } from '../core/types';
import type { DoiTac } from '../../../kho-van/danh-sach-doi-tac/core/types';
import type { Department } from '../../../he-thong/phong-ban/core/types';
import type { Employee } from '../../../he-thong/nhan-vien/core/types';
import type { TrangThaiThanhToanDoiTac } from '../../thiet-lap-de-xuat-vat-tu/core/types';
import { useCreateThanhToanDoiTac, useUpdateThanhToanDoiTac } from '../hooks/use-thanh-toan-doi-tac';
import { getTodayISO } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  doiTacList: DoiTac[];
  donViList: Department[];
  employees: Employee[];
  statusList: TrangThaiThanhToanDoiTac[];
  initialData?: ThanhToanDoiTac | null;
  onClose: () => void;
}

const ThanhToanDoiTacForm: React.FC<Props> = ({
  doiTacList,
  donViList,
  employees,
  statusList,
  initialData,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateThanhToanDoiTac(onClose);
  const updateMutation = useUpdateThanhToanDoiTac(onClose);

  const doiTacOptions = useMemo(
    () =>
      doiTacList
        .filter((d) => d.trang_thai === 1)
        .map((d) => ({ value: d.id, label: `${d.ma_ncc} - ${d.ten_ncc}` })),
    [doiTacList]
  );

  const donViOptions = useMemo(
    () => [
      { value: '', label: t('thanhToanDoiTac.form.donViPlaceholder') },
      ...donViList.map((d) => ({ value: d.id, label: d.ten_phong_ban })),
    ],
    [donViList, t]
  );

  const statusOptions = useMemo(
    () =>
      statusList
        .filter((s) => s.trang_thai === 1)
        .map((s) => ({ value: s.id, label: s.ten })),
    [statusList]
  );

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
    id_don_vi: null,
    id_doi_tac: '',
    id_trang_thai_thanh_toan: '',
    so_tien: 0,
    ngay_xu_ly: null,
    ghi_chu: null,
    id_nguoi_tao: '',
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<ThanhToanDoiTacFormValues>({
    resolver: zodResolver(thanhToanDoiTacSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        so_phieu: initialData.so_phieu,
        hang_muc_thanh_toan: initialData.hang_muc_thanh_toan,
        ngay: initialData.ngay,
        id_don_vi: initialData.id_don_vi ?? null,
        id_doi_tac: initialData.id_doi_tac,
        id_trang_thai_thanh_toan: initialData.id_trang_thai_thanh_toan,
        so_tien: initialData.so_tien,
        ngay_xu_ly: initialData.ngay_xu_ly ?? null,
        ghi_chu: initialData.ghi_chu ?? null,
        id_nguoi_tao: initialData.id_nguoi_tao,
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<ThanhToanDoiTacFormValues> = (data) => {
    const sanitized: ThanhToanDoiTacFormValues = {
      ...data,
      id_don_vi: data.id_don_vi === '' ? null : data.id_don_vi,
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
                  onChange={(v) => field.onChange(v === '' ? null : v)}
                  placeholder={t('thanhToanDoiTac.form.donViPlaceholder')}
                  icon={<Building2 size={12} />}
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
            <Input
              label={t('thanhToanDoiTac.form.soTien')}
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              icon={<CreditCard size={12} />}
              {...register('so_tien')}
              error={errors.so_tien?.message}
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
