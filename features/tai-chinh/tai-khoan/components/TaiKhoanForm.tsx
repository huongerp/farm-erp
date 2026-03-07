import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Building2, Hash, User, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import StatusToggle from '../../../../components/ui/StatusToggle';
import { taiKhoanSchema, type TaiKhoanFormValues } from '../core/schema';
import type { TaiKhoan } from '../../core/types';
import { useCreateTaiKhoan, useUpdateTaiKhoan } from '../hooks/use-tai-khoan';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { BANKS_VN } from '../data/banks-vn';

const defaultValues: Partial<TaiKhoanFormValues> = {
  ten_tai_khoan: '',
  loai_tai_khoan: 'tien_mat',
  so_tai_khoan: '',
  ngan_hang: '',
  ma_ngan_hang: '',
  chu_tai_khoan: '',
  trang_thai: 1,
};

interface Props {
  initialData?: TaiKhoan | null;
  onClose: () => void;
}

const TaiKhoanForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateTaiKhoan(onClose);
  const updateMutation = useUpdateTaiKhoan(onClose);

  const bankOptions = useMemo(
    () =>
      BANKS_VN.map((b) => ({
        value: b.ma_ngan_hang,
        label: b.ten_ngan_hang,
      })),
    []
  );

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<
    TaiKhoanFormValues
  >({
    resolver: zodResolver(taiKhoanSchema) as any,
    defaultValues,
  });

  const loaiTaiKhoan = watch('loai_tai_khoan');

  useEffect(() => {
    if (initialData) {
      reset({
        ten_tai_khoan: initialData.ten_tai_khoan,
        loai_tai_khoan: initialData.loai_tai_khoan as 'tien_mat' | 'ngan_hang',
        so_tai_khoan: initialData.so_tai_khoan ?? '',
        ngan_hang: initialData.ngan_hang ?? '',
        ma_ngan_hang: initialData.ma_ngan_hang ?? '',
        chu_tai_khoan: initialData.chu_tai_khoan ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset({
        ...defaultValues,
        loai_tai_khoan: 'tien_mat',
        so_tai_khoan: '',
        ngan_hang: '',
        ma_ngan_hang: '',
        chu_tai_khoan: '',
      });
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<TaiKhoanFormValues> = (data) => {
    const sanitized = {
      ...data,
      ten_tai_khoan: data.ten_tai_khoan.trim(),
      so_tai_khoan: data.so_tai_khoan?.trim() ?? '',
      ngan_hang:
        data.loai_tai_khoan === 'ngan_hang' && data.ma_ngan_hang
          ? BANKS_VN.find((b) => b.ma_ngan_hang === data.ma_ngan_hang)?.ten_ngan_hang ?? data.ngan_hang ?? ''
          : '',
      ma_ngan_hang: data.loai_tai_khoan === 'ngan_hang' ? data.ma_ngan_hang?.trim() ?? '' : '',
      chu_tai_khoan: data.chu_tai_khoan?.trim() ?? '',
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
      title={isEdit ? t('taiKhoan.form.editTitle') : t('taiKhoan.form.createTitle')}
      icon={<Wallet size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="tai-khoan-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="tai-khoan-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection
          title={t('taiKhoan.form.tenTaiKhoan')}
          icon={<Wallet size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Input
              label={t('taiKhoan.form.tenTaiKhoan')}
              placeholder={t('taiKhoan.form.tenTaiKhoanPlaceholder')}
              icon={<Wallet size={12} />}
              required
              {...register('ten_tai_khoan')}
              error={errors.ten_tai_khoan?.message}
            />
            <Controller
              name="loai_tai_khoan"
              control={control}
              render={({ field }) => (
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                    <Wallet size={12} className="text-muted-foreground" />
                    {t('taiKhoan.form.loaiTaiKhoan')}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="tien_mat"
                        checked={field.value === 'tien_mat'}
                        onChange={() => field.onChange('tien_mat')}
                        className="rounded border-border text-primary accent-primary"
                      />
                      <span className="text-sm">{t('taiKhoan.loaiTienMat')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="ngan_hang"
                        checked={field.value === 'ngan_hang'}
                        onChange={() => field.onChange('ngan_hang')}
                        className="rounded border-border text-primary accent-primary"
                      />
                      <span className="text-sm">{t('taiKhoan.loaiNganHang')}</span>
                    </label>
                  </div>
                </div>
              )}
            />
            {loaiTaiKhoan === 'ngan_hang' && (
              <>
                <div className="col-span-1 sm:col-span-2">
                  <Controller
                    name="ma_ngan_hang"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label={t('taiKhoan.form.nganHangVN')}
                        placeholder={t('taiKhoan.form.nganHangPlaceholder')}
                        options={bankOptions}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        icon={<Building2 size={12} />}
                        error={errors.ma_ngan_hang?.message}
                      />
                    )}
                  />
                </div>
                <Input
                  label={t('taiKhoan.form.soTaiKhoan')}
                  placeholder={t('taiKhoan.form.soTaiKhoanPlaceholder')}
                  icon={<Hash size={12} />}
                  {...register('so_tai_khoan')}
                  error={errors.so_tai_khoan?.message}
                />
                <Input
                  label={t('taiKhoan.form.chuTaiKhoan')}
                  placeholder={t('taiKhoan.form.chuTaiKhoanPlaceholder')}
                  icon={<User size={12} />}
                  {...register('chu_tai_khoan')}
                  error={errors.chu_tai_khoan?.message}
                />
              </>
            )}
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('taiKhoan.form.trangThai')}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<Power size={12} />}
                />
              )}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TaiKhoanForm;
