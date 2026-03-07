import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Hash, Type, FileText, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { AssetStorageLocation } from '../core/types';
import { AssetStorageLocationFormValues, assetStorageLocationSchema } from '../core/schema';
import { useCreateAssetStorageLocation, useUpdateAssetStorageLocation } from '../hooks/use-noi-luu';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';

const DEFAULT_VALUES: AssetStorageLocationFormValues = {
  id_chi_nhanh: '',
  ma_noi_luu: '',
  ten_noi_luu: '',
  ghi_chu: '',
  trang_thai: 1,
};

interface Props {
  initialData?: AssetStorageLocation | null;
  onClose: () => void;
}

const NoiLuuForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateAssetStorageLocation(onClose);
  const updateMutation = useUpdateAssetStorageLocation(onClose);
  const { data: branches = [] } = useBranches();

  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({
        label: b.ten_chi_nhanh,
        value: b.id,
        subLabel: b.ma_chi_nhanh,
      })),
    [branches]
  );

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<AssetStorageLocationFormValues>({
    resolver: zodResolver(assetStorageLocationSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id_chi_nhanh: initialData.id_chi_nhanh,
        ma_noi_luu: initialData.ma_noi_luu,
        ten_noi_luu: initialData.ten_noi_luu,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<AssetStorageLocationFormValues> = (data) => {
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
      title={isEdit ? t('thietLapTaiSan.noiLuu.form.editTitle') : t('thietLapTaiSan.noiLuu.form.createTitle')}
      icon={<MapPin size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="noi-luu-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapTaiSan.noiLuu.form.save')}
          createLabel={t('thietLapTaiSan.noiLuu.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="noi-luu-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapTaiSan.noiLuu.form.basicInfo')} icon={<MapPin size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thietLapTaiSan.noiLuu.form.branch')}
                  options={branchOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('thietLapTaiSan.noiLuu.form.branchPlaceholder')}
                  error={errors.id_chi_nhanh?.message}
                  icon={<MapPin size={12} />}
                />
              )}
            />
            <Input
              label={t('thietLapTaiSan.noiLuu.form.ma')}
              placeholder={t('thietLapTaiSan.noiLuu.form.maPlaceholder')}
              icon={<Hash size={12} />}
              required
              {...register('ma_noi_luu')}
              error={errors.ma_noi_luu?.message}
            />
            <Input
              label={t('thietLapTaiSan.noiLuu.form.ten')}
              placeholder={t('thietLapTaiSan.noiLuu.form.tenPlaceholder')}
              icon={<Type size={12} />}
              required
              {...register('ten_noi_luu')}
              error={errors.ten_noi_luu?.message}
              className="col-span-1 sm:col-span-2"
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapTaiSan.noiLuu.form.note')}
                placeholder={t('thietLapTaiSan.noiLuu.form.notePlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapTaiSan.noiLuu.form.status')}
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

export default NoiLuuForm;
