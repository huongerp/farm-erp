import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Hash, Power, ListOrdered } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { PayrollAdminFormGroup } from '../core/types';
import { PayrollAdminFormGroupFormValues, payrollAdminFormGroupSchema } from '../core/schema';
import { getAdminFormTypeOptions } from '../core/constants';
import { useCreatePayrollAdminFormGroup, useUpdatePayrollAdminFormGroup } from '../hooks/use-payroll-form-group';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const DEFAULT_VALUES: PayrollAdminFormGroupFormValues = {
  loai_phieu: 'late_early',
  so_luong_thang: 1,
  ghi_chu: '',
  trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
};

interface Props {
  initialData?: PayrollAdminFormGroup | null;
  onClose: () => void;
}

const PayrollFormGroupForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreatePayrollAdminFormGroup(onClose);
  const updateMutation = useUpdatePayrollAdminFormGroup(onClose);

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control } = useForm<PayrollAdminFormGroupFormValues>({
    resolver: zodResolver(payrollAdminFormGroupSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        loai_phieu: initialData.loai_phieu,
        so_luong_thang: initialData.so_luong_thang,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const typeOptions = useMemo(() => getAdminFormTypeOptions(t), [t]);

  const onSubmit: SubmitHandler<PayrollAdminFormGroupFormValues> = (data) => {
    const sanitized: PayrollAdminFormGroupFormValues = {
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
      isDirty={isDirty}
      title={isEdit ? t('payrollIp.groups.form.editTitle') : t('payrollIp.groups.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="payroll-form-group"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('payrollIp.groups.form.save')}
          createLabel={t('payrollIp.groups.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="payroll-form-group" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('payrollIp.groups.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="loai_phieu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('payrollIp.groups.form.type')}
                  options={typeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('payrollIp.groups.form.typePlaceholder')}
                  icon={<FileText size={16} className="text-muted-foreground" />}
                />
              )}
            />
            <Input
              type="number"
              min={0}
              label={t('payrollIp.groups.form.quota')}
              placeholder={t('payrollIp.groups.form.quotaPlaceholder')}
              icon={<Hash size={14} />}
              {...register('so_luong_thang')}
              error={errors.so_luong_thang?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('payrollIp.groups.form.note')}
                placeholder={t('payrollIp.groups.form.notePlaceholder')}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('payrollIp.groups.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  activeValue={TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG}
                  inactiveValue={TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG}
                  activeLabel={t('payrollIp.active')}
                  inactiveLabel={t('payrollIp.inactive')}
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

export default PayrollFormGroupForm;
