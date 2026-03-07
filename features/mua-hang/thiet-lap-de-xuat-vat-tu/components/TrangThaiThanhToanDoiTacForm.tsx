import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Hash, Type, ListOrdered, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { TrangThaiThanhToanDoiTac } from '../core/types';
import { TrangThaiThanhToanDoiTacFormValues, trangThaiThanhToanDoiTacSchema } from '../core/schema';
import { TRANG_THAI_MAU_DEFAULT } from '../core/constants';
import { useCreateTrangThaiThanhToanDoiTac, useUpdateTrangThaiThanhToanDoiTac } from '../hooks/use-trang-thai-thanh-toan-doi-tac';

const DEFAULT_VALUES: TrangThaiThanhToanDoiTacFormValues = {
  ma: '',
  ten: '',
  thu_tu: 0,
  mau: TRANG_THAI_MAU_DEFAULT,
  ghi_chu: '',
  trang_thai: 1,
};

interface Props {
  initialData?: TrangThaiThanhToanDoiTac | null;
  onClose: () => void;
}

const TrangThaiThanhToanDoiTacForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateTrangThaiThanhToanDoiTac(onClose);
  const updateMutation = useUpdateTrangThaiThanhToanDoiTac(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<TrangThaiThanhToanDoiTacFormValues>({
    resolver: zodResolver(trangThaiThanhToanDoiTacSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        thu_tu: initialData.thu_tu,
        mau: initialData.mau ?? TRANG_THAI_MAU_DEFAULT,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<TrangThaiThanhToanDoiTacFormValues> = (data) => {
    const sanitized: TrangThaiThanhToanDoiTacFormValues = {
      ...data,
      ghi_chu: data.ghi_chu?.trim() || undefined,
      mau: data.mau?.trim() || undefined,
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
      title={isEdit ? t('thietLapDeXuatVatTu.thanhToan.form.editTitle') : t('thietLapDeXuatVatTu.thanhToan.form.createTitle')}
      icon={<CreditCard size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="trang-thai-thanh-toan-doi-tac-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapDeXuatVatTu.thanhToan.form.save')}
          createLabel={t('thietLapDeXuatVatTu.thanhToan.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="trang-thai-thanh-toan-doi-tac-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapDeXuatVatTu.thanhToan.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thietLapDeXuatVatTu.thanhToan.form.ma')}
              placeholder={t('thietLapDeXuatVatTu.thanhToan.form.maPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('thietLapDeXuatVatTu.thanhToan.form.ten')}
              placeholder={t('thietLapDeXuatVatTu.thanhToan.form.tenPlaceholder')}
              icon={<Type size={14} />}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Input
              type="number"
              min={0}
              label={t('thietLapDeXuatVatTu.thanhToan.form.thuTu')}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <Controller
              name="mau"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2 items-end">
                  <Input
                    label={t('thietLapDeXuatVatTu.thanhToan.form.mau')}
                    placeholder="#6366f1"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.mau?.message}
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={field.value || TRANG_THAI_MAU_DEFAULT}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent"
                    title={t('thietLapDeXuatVatTu.thanhToan.form.mau')}
                  />
                </div>
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapDeXuatVatTu.thanhToan.form.ghiChu')}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapDeXuatVatTu.thanhToan.form.status')}
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

export default TrangThaiThanhToanDoiTacForm;
