import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building, Building2, ArrowUpFromLine, Power, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import { DepartmentFormValues, departmentSchema } from '../core/schema';
import { Department } from '../core/types';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/use-phong-ban';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { TRANG_THAI } from '../../../../lib/constants';

interface Props {
  initialData?: Department | null;
  allDepartments: Department[];
  onClose: () => void;
  defaultParentId?: string | null;
}

const DepartmentForm: React.FC<Props> = ({ initialData, allDepartments, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDepartment(onClose);
  const updateMutation = useUpdateDepartment(onClose);

  const defaultValues: Partial<DepartmentFormValues> = {
    ten_phong_ban: '',
    chuc_nang: '',
    tt: 0,
    trang_thai: TRANG_THAI.DANG_DUNG,
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ten_phong_ban: initialData.ten_phong_ban,
        chuc_nang: initialData.chuc_nang ?? '',
        tt: initialData.tt,
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<DepartmentFormValues> = (data) => {
    const sanitizedData = {
      ...data,
      chuc_nang: data.chuc_nang?.trim() || null,
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
      title={isEdit ? t('department.form.editTitle') : t('department.form.createTitle')}
      icon={<Building size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="dept-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('department.form.save')}
          createLabel={t('department.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="dept-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('department.detail.basicInfo')} icon={<Building2 size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('department.name')}
              placeholder={t('department.form.namePlaceholder')}
              icon={<Building2 size={12} />}
              required
              {...register('ten_phong_ban')}
              error={errors.ten_phong_ban?.message}
            />
            <Input
              type="number"
              label={t('department.detail.order')}
              icon={<ArrowUpFromLine size={12} />}
              required
              {...register('tt')}
              error={errors.tt?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('chuc_nang')}
                label={t('department.form.chucNang')}
                placeholder={t('department.form.chucNangPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                error={errors.chuc_nang?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('common.status')}
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

export default DepartmentForm;
