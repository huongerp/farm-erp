import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, MessageSquare, Clock } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { AdminFormRequest } from '../core/types';
import { AdminFormValues, adminFormSchema } from '../core/schema';
import { getAdminFormTypeOptions } from '../../thiet-lap-cong-luong/core/constants';
import { ADMIN_FORM_SHIFTS, getAdminFormShiftLabel } from '../core/constants';
import { useCreateAdminForm, useUpdateAdminForm } from '../hooks/use-admin-form';
import { useAuthStore } from '../../../../store/useStore';

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_VALUES: AdminFormValues = {
  ngay: getTodayDateString(),
  loai_phieu: 'late_early',
  ca: 'morning',
  ly_do: '',
};

interface Props {
  initialData?: AdminFormRequest | null;
  onClose: () => void;
}

const AdminFormForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const user = useAuthStore((s) => s.user);
  const createMutation = useCreateAdminForm(onClose);
  const updateMutation = useUpdateAdminForm(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ngay: initialData.ngay,
        loai_phieu: initialData.loai_phieu,
        ca: initialData.ca,
        ly_do: initialData.ly_do,
      });
    } else {
      reset({ ...DEFAULT_VALUES, ngay: getTodayDateString() });
    }
  }, [initialData, reset]);

  const typeOptions = useMemo(() => getAdminFormTypeOptions(t), [t]);
  const shiftOptions = useMemo(
    () => ADMIN_FORM_SHIFTS.map((s) => ({ value: s, label: getAdminFormShiftLabel(s, t) })),
    [t]
  );

  const onSubmit: SubmitHandler<AdminFormValues> = (data) => {
    if (!data.loai_phieu) return;
    const sanitized: AdminFormValues = {
      ...data,
      loai_phieu: data.loai_phieu as AdminFormValues['loai_phieu'],
      ly_do: data.ly_do.trim(),
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate({
        data: sanitized,
        creator: { id: user?.id ?? 'emp-000', name: user?.full_name ?? 'Lê Minh Công' },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('adminForm.form.editTitle') : t('adminForm.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="admin-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('adminForm.form.save')}
          createLabel={t('adminForm.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="admin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('adminForm.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              type="date"
              label={t('adminForm.form.date')}
              required
              icon={<Calendar size={14} />}
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <Controller
              name="loai_phieu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('adminForm.form.type')}
                  options={typeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('adminForm.form.typePlaceholder')}
                  icon={<FileText size={16} className="text-muted-foreground" />}
                  required
                />
              )}
            />
            <Controller
              name="ca"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('adminForm.form.shift')}
                  options={shiftOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('adminForm.form.shiftPlaceholder')}
                  icon={<Clock size={16} className="text-muted-foreground" />}
                  searchable={false}
                  required
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('adminForm.form.reason')}
                placeholder={t('adminForm.form.reasonPlaceholder')}
                {...register('ly_do')}
                error={errors.ly_do?.message}
                icon={<MessageSquare size={14} />}
                required
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default AdminFormForm;
