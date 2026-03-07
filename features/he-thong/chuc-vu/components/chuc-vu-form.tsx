import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Layers, Building2, FileText, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import { PositionFormValues, positionSchema } from '../core/schema';
import { Position } from '../core/types';
import { useCreatePosition, useUpdatePosition, usePositions } from '../hooks/use-chuc-vu';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import { useJobLevels } from '../../cap-bac/hooks/use-cap-bac';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import { TRANG_THAI } from '../../../../lib/constants';

const DEFAULT_VALUES: PositionFormValues = {
  ten_chuc_vu: '',
  cap_bac_id: '',
  phong_ban_id: '',
  mo_ta: '',
  tt: 0,
  trang_thai: TRANG_THAI.DANG_DUNG,
};

interface Props {
  initialData?: Position | null;
  onClose: () => void;
}

const PositionForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreatePosition(onClose);
  const updateMutation = useUpdatePosition(onClose);

  const { data: positions = [] } = usePositions();
  const { data: jobLevels = [] } = useJobLevels();
  const { data: departments = [] } = useDepartments();

  const nextOrder = positions.length
    ? Math.max(0, ...positions.map((p) => p.tt)) + 1
    : 0;

  const jobLevelOptions = jobLevels.map((lvl) => ({
    label: lvl.ten_cap_bac,
    value: lvl.id,
    subLabel: String(lvl.cap_bac ?? ''),
  }));

  const departmentOptions = departments.map((dept) => ({
    label: dept.ten_phong_ban,
    value: dept.id,
    subLabel: undefined,
  }));

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ten_chuc_vu: initialData.ten_chuc_vu,
        cap_bac_id: initialData.cap_bac_id || '',
        phong_ban_id: initialData.phong_ban_id || '',
        mo_ta: initialData.mo_ta || '',
        tt: initialData.tt ?? 0,
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        tt: nextOrder,
      });
    }
  }, [initialData, reset, nextOrder]);

  const onSubmit: SubmitHandler<PositionFormValues> = (data) => {
    const sanitizedData = {
        ...data,
        cap_bac_id: data.cap_bac_id || null,
        phong_ban_id: data.phong_ban_id || null,
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
        title={isEdit ? t('position.form.editTitle') : t('position.form.createTitle')}
        icon={<Briefcase size={20} />}
        onClose={onClose}
        footer={
          <FormDrawerFooter
            formId="pos-form"
            onCancel={onClose}
            isLoading={isLoading}
            isEdit={isEdit}
            saveLabel={t('position.form.save')}
            createLabel={t('position.form.create')}
          />
        }
        maxWidthClass={DRAWER_WIDTH_FORM}
    >
          <form id="pos-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title={t('position.detail.basicInfo')} icon={<Briefcase size={14} />} variant="primary">
              <FormGrid cols={3}>
                <div className="sm:col-span-3">
                  <Input
                    label={t('position.form.name')}
                    placeholder={t('position.form.namePlaceholder')}
                    icon={<Briefcase size={12} />}
                    required
                    {...register('ten_chuc_vu')}
                    error={errors.ten_chuc_vu?.message}
                  />
                </div>
                <Controller
                  name="cap_bac_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      label={t('position.form.level')}
                      options={jobLevelOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('position.form.levelPlaceholder')}
                      error={errors.cap_bac_id?.message}
                      icon={<Layers size={12} />}
                    />
                  )}
                />
                <Controller
                  name="phong_ban_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      label={t('position.form.department')}
                      options={departmentOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('position.form.departmentPlaceholder')}
                      error={errors.phong_ban_id?.message}
                      icon={<Building2 size={12} />}
                    />
                  )}
                />
                <div className="col-span-1 sm:col-span-3">
                  <Textarea
                    label={t('position.form.description')}
                    placeholder={t('position.form.descriptionPlaceholder')}
                    icon={<FileText size={12} />}
                    {...register('mo_ta')}
                    error={errors.mo_ta?.message}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Input
                    label={t('position.store.orderCol')}
                    type="number"
                    min={0}
                    {...register('tt')}
                    error={errors.tt?.message}
                  />
                </div>
                <div className="col-span-1 sm:col-span-3">
                  <Controller
                    name="trang_thai"
                    control={control}
                    render={({ field }) => (
                      <StatusToggle
                        label={t('position.form.status')}
                        value={field.value}
                        onChange={field.onChange}
                        icon={<Power size={12} />}
                        required
                      />
                    )}
                  />
                </div>
              </FormGrid>
            </FormSection>
          </form>
    </GenericDrawer>
  );
};

export default PositionForm;
