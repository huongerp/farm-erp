import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag, Hash, Type, ListOrdered, FileText, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { AssetStatus } from '../core/types';
import { AssetStatusFormValues, assetStatusSchema } from '../core/schema';
import { useCreateAssetStatus, useUpdateAssetStatus } from '../hooks/use-trang-thai';

const DEFAULT_VALUES: AssetStatusFormValues = {
  ma: '',
  ten: '',
  thu_tu: 0,
  ghi_chu: '',
  trang_thai: 1,
};

interface Props {
  initialData?: AssetStatus | null;
  onClose: () => void;
}

const TrangThaiForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateAssetStatus(onClose);
  const updateMutation = useUpdateAssetStatus(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<AssetStatusFormValues>({
    resolver: zodResolver(assetStatusSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        thu_tu: initialData.thu_tu,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<AssetStatusFormValues> = (data) => {
    const sanitized = {
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
      title={isEdit ? t('thietLapTaiSan.trangThai.form.editTitle') : t('thietLapTaiSan.trangThai.form.createTitle')}
      icon={<Tag size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="trang-thai-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapTaiSan.trangThai.form.save')}
          createLabel={t('thietLapTaiSan.trangThai.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="trang-thai-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapTaiSan.trangThai.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thietLapTaiSan.trangThai.form.ma')}
              placeholder={t('thietLapTaiSan.trangThai.form.maPlaceholder')}
              icon={<Hash size={14} />}
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('thietLapTaiSan.trangThai.form.ten')}
              placeholder={t('thietLapTaiSan.trangThai.form.tenPlaceholder')}
              icon={<Type size={14} />}
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Input
              type="number"
              min={0}
              label={t('thietLapTaiSan.trangThai.form.thuTu')}
              placeholder={t('thietLapTaiSan.trangThai.form.thuTuPlaceholder')}
              icon={<Hash size={14} />}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapTaiSan.trangThai.form.note')}
                placeholder={t('thietLapTaiSan.trangThai.form.notePlaceholder')}
                icon={<FileText size={12} />}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapTaiSan.trangThai.form.status')}
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

export default TrangThaiForm;
