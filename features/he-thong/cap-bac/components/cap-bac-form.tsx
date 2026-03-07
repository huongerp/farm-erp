import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, ArrowUpFromLine, FileText, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import { JobLevelFormValues, jobLevelSchema } from '../core/schema';
import { JobLevel } from '../core/types';
import { useCreateJobLevel, useUpdateJobLevel, useJobLevels } from '../hooks/use-cap-bac';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';

import { TRANG_THAI } from '../../../../lib/constants';

const DEFAULT_VALUES: JobLevelFormValues = {
  ten_cap_bac: '',
  cap_bac: 1,
  mo_ta: '',
  trang_thai: TRANG_THAI.DANG_DUNG,
};

interface Props {
  initialData?: JobLevel | null;
  onClose: () => void;
}

const JobLevelForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const { data: jobLevels = [] } = useJobLevels();
  const createMutation = useCreateJobLevel(onClose);
  const updateMutation = useUpdateJobLevel(onClose);

  const nextOrder = jobLevels.length
    ? Math.max(0, ...jobLevels.map((l) => l.cap_bac)) + 1
    : 1;

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<JobLevelFormValues>({
    resolver: zodResolver(jobLevelSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ten_cap_bac: initialData.ten_cap_bac,
        cap_bac: initialData.cap_bac,
        mo_ta: initialData.mo_ta || '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        cap_bac: nextOrder,
      });
    }
  }, [initialData, reset, nextOrder]);

  const onSubmit: SubmitHandler<JobLevelFormValues> = (data) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
        title={isEdit ? t('jobLevel.form.editTitle') : t('jobLevel.form.createTitle')}
        icon={<Layers size={20} />}
        onClose={onClose}
        footer={
          <FormDrawerFooter
            formId="level-form"
            onCancel={onClose}
            isLoading={isLoading}
            isEdit={isEdit}
            saveLabel={t('jobLevel.form.save')}
            createLabel={t('jobLevel.form.create')}
          />
        }
        maxWidthClass={DRAWER_WIDTH_FORM}
    >
          <form id="level-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title={t('jobLevel.form.basicInfo')} icon={<Layers size={14} />} variant="primary">
              <FormGrid cols={2}>
                <Input
                  label={t('jobLevel.form.name')}
                  placeholder={t('jobLevel.form.namePlaceholder')}
                  icon={<Layers size={12} />}
                  required
                  {...register('ten_cap_bac')}
                  error={errors.ten_cap_bac?.message}
                />
                <Input
                  label={t('jobLevel.form.order')}
                  type="number"
                  min={0}
                  icon={<ArrowUpFromLine size={12} />}
                  required
                  {...register('cap_bac')}
                  error={errors.cap_bac?.message}
                />
              </FormGrid>
            </FormSection>

            <FormSection title={t('jobLevel.form.detailSection')} icon={<Layers size={14} />} variant="primary">
              <FormGrid cols={2}>
                <div className="col-span-1 sm:col-span-2">
                  <Textarea
                    label={t('jobLevel.form.description')}
                    placeholder={t('jobLevel.form.descriptionPlaceholder')}
                    icon={<FileText size={12} />}
                    {...register('mo_ta')}
                    error={errors.mo_ta?.message}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <Controller
                    name="trang_thai"
                    control={control}
                    render={({ field }) => (
                      <StatusToggle
                        label={t('jobLevel.form.status')}
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

export default JobLevelForm;
