import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Hash, Type, List, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { LoaiTaiLieu } from '../core/types';
import { LoaiTaiLieuFormValues, loaiTaiLieuSchema } from '../core/schema';
import { useCreateLoaiTaiLieu, useUpdateLoaiTaiLieu } from '../hooks/use-loai-tai-lieu';

const DEFAULT_VALUES: LoaiTaiLieuFormValues = {
  ma: '',
  ten: '',
  ghi_chu: '',
  trang_thai: 1,
};

interface Props {
  initialData?: LoaiTaiLieu | null;
  onClose: () => void;
}

const LoaiTaiLieuForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateLoaiTaiLieu(onClose);
  const updateMutation = useUpdateLoaiTaiLieu(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<LoaiTaiLieuFormValues>({
    resolver: zodResolver(loaiTaiLieuSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<LoaiTaiLieuFormValues> = (data) => {
    const sanitized: LoaiTaiLieuFormValues = {
      ...data,
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
      title={isEdit ? t('thietLapTaiLieu.loai.form.editTitle') : t('thietLapTaiLieu.loai.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="loai-tai-lieu-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapTaiLieu.loai.form.save')}
          createLabel={t('thietLapTaiLieu.loai.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="loai-tai-lieu-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapTaiLieu.loai.form.basicInfo')} icon={<List size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thietLapTaiLieu.loai.form.ma')}
              placeholder={t('thietLapTaiLieu.loai.form.maPlaceholder')}
              icon={<Hash size={14} />}
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('thietLapTaiLieu.loai.form.ten')}
              placeholder={t('thietLapTaiLieu.loai.form.tenPlaceholder')}
              icon={<Type size={14} />}
              {...register('ten')}
              error={errors.ten?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapTaiLieu.loai.form.ghiChu')}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapTaiLieu.loai.form.status')}
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

export default LoaiTaiLieuForm;
