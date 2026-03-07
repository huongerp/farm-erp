import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Building2, Hash, Map, Power, Globe } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { Branch } from '../core/types';
import { BranchFormValues, branchSchema } from '../core/schema';
import { useCreateBranch, useUpdateBranch } from '../hooks/use-chi-nhanh';
import { TRANG_THAI } from '../../../../lib/constants';

const DEFAULT_VALUES: BranchFormValues = {
  ma_chi_nhanh: '',
  ten_chi_nhanh: '',
  dia_chi: '',
  tinh_thanh: '',
  quan_huyen: '',
  vi_do: undefined,
  kinh_do: undefined,
  duong_dan_map: '',
  trang_thai: TRANG_THAI.DANG_DUNG,
};

interface Props {
  initialData?: Branch | null;
  onClose: () => void;
}

const BranchForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateBranch(onClose);
  const updateMutation = useUpdateBranch(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_chi_nhanh: initialData.ma_chi_nhanh,
        ten_chi_nhanh: initialData.ten_chi_nhanh,
        dia_chi: initialData.dia_chi,
        tinh_thanh: initialData.tinh_thanh,
        quan_huyen: initialData.quan_huyen,
        vi_do: initialData.vi_do ?? undefined,
        kinh_do: initialData.kinh_do ?? undefined,
        duong_dan_map: initialData.duong_dan_map ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<BranchFormValues> = (data) => {
    const sanitizedData: BranchFormValues = {
      ...data,
      ma_chi_nhanh: data.ma_chi_nhanh.trim().toUpperCase(),
      ten_chi_nhanh: data.ten_chi_nhanh.trim(),
      dia_chi: data.dia_chi.trim(),
      tinh_thanh: data.tinh_thanh.trim(),
      quan_huyen: data.quan_huyen.trim(),
      duong_dan_map: data.duong_dan_map?.trim() || undefined,
      vi_do: data.vi_do === undefined || data.vi_do === null ? undefined : Number(data.vi_do),
      kinh_do: data.kinh_do === undefined || data.kinh_do === null ? undefined : Number(data.kinh_do),
      trang_thai: data.trang_thai,
    };

    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitizedData });
    } else {
      createMutation.mutate(sanitizedData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('branch.form.editTitle') : t('branch.form.createTitle')}
      icon={<MapPin size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="branch-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('branch.form.save')}
          createLabel={t('branch.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="branch-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('branch.form.basicInfo')} icon={<Building2 size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('branch.form.name')}
              placeholder={t('branch.form.namePlaceholder')}
              icon={<Building2 size={12} />}
              required
              {...register('ten_chi_nhanh')}
              error={errors.ten_chi_nhanh?.message}
            />
            <Input
              label={t('branch.form.code')}
              placeholder={t('branch.form.codePlaceholder')}
              icon={<Hash size={12} />}
              required
              {...register('ma_chi_nhanh')}
              error={errors.ma_chi_nhanh?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_chi_nhanh').onChange(e);
              }}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('branch.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<Power size={12} />}
                  required
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('branch.form.addressInfo')} icon={<MapPin size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('branch.form.address')}
                placeholder={t('branch.form.addressPlaceholder')}
                icon={<MapPin size={12} />}
                required
                {...register('dia_chi')}
                error={errors.dia_chi?.message}
              />
            </div>
            <Input
              label={t('branch.form.province')}
              placeholder={t('branch.form.provincePlaceholder')}
              icon={<Globe size={12} />}
              required
              {...register('tinh_thanh')}
              error={errors.tinh_thanh?.message}
            />
            <Input
              label={t('branch.form.district')}
              placeholder={t('branch.form.districtPlaceholder')}
              icon={<Globe size={12} />}
              required
              {...register('quan_huyen')}
              error={errors.quan_huyen?.message}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('branch.form.mapInfo')} icon={<Map size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              type="number"
              step="0.000001"
              label={t('branch.form.latitude')}
              placeholder={t('branch.form.latitudePlaceholder')}
              icon={<MapPin size={12} />}
              {...register('vi_do')}
              error={errors.vi_do?.message}
            />
            <Input
              type="number"
              step="0.000001"
              label={t('branch.form.longitude')}
              placeholder={t('branch.form.longitudePlaceholder')}
              icon={<MapPin size={12} />}
              {...register('kinh_do')}
              error={errors.kinh_do?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('branch.form.mapUrl')}
                placeholder={t('branch.form.mapUrlPlaceholder')}
                icon={<Map size={12} />}
                {...register('duong_dan_map')}
                error={errors.duong_dan_map?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default BranchForm;
