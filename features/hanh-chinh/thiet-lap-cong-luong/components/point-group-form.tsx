import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, Hash, Type, ListOrdered, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { PayrollPointGroup } from '../core/types';
import { PayrollPointGroupFormValues, payrollPointGroupSchema } from '../core/schema';
import { getPointGroupTypeOptions } from '../core/constants';
import { usePayrollPointGroups, useCreatePayrollPointGroup, useUpdatePayrollPointGroup } from '../hooks/use-payroll-point-group';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const DEFAULT_VALUES: PayrollPointGroupFormValues = {
  ma: '',
  ten: '',
  loai: 'cong',
  thu_tu: 1,
  ghi_chu: '',
  trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
};

interface Props {
  initialData?: PayrollPointGroup | null;
  onClose: () => void;
}

const PayrollPointGroupForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const { data: groups = [] } = usePayrollPointGroups();
  const createMutation = useCreatePayrollPointGroup(onClose);
  const updateMutation = useUpdatePayrollPointGroup(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<PayrollPointGroupFormValues>({
    resolver: zodResolver(payrollPointGroupSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        loai: initialData.loai,
        thu_tu: initialData.thu_tu,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      const nextThuTu = groups.length > 0
        ? Math.max(0, ...groups.map((g) => g.thu_tu)) + 1
        : 1;
      reset({ ...DEFAULT_VALUES, thu_tu: nextThuTu });
    }
  }, [initialData, reset, groups]);

  const typeOptions = useMemo(() => getPointGroupTypeOptions(t), [t]);

  const onSubmit: SubmitHandler<PayrollPointGroupFormValues> = (data) => {
    const sanitized: PayrollPointGroupFormValues = {
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
      title={isEdit ? t('payrollIp.pointGroups.form.editTitle') : t('payrollIp.pointGroups.form.createTitle')}
      icon={<Scale size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="payroll-point-group"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('payrollIp.pointGroups.form.save')}
          createLabel={t('payrollIp.pointGroups.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="payroll-point-group" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('payrollIp.pointGroups.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('payrollIp.pointGroups.form.ma')}
              placeholder={t('payrollIp.pointGroups.form.maPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('payrollIp.pointGroups.form.ten')}
              placeholder={t('payrollIp.pointGroups.form.tenPlaceholder')}
              icon={<Type size={14} />}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('payrollIp.pointGroups.form.loai')}
                  options={typeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('payrollIp.pointGroups.form.loaiPlaceholder')}
                  icon={<Scale size={16} className="text-muted-foreground" />}
                  required
                />
              )}
            />
            <Input
              type="number"
              min={0}
              label={t('payrollIp.pointGroups.form.thuTu')}
              placeholder={t('payrollIp.pointGroups.form.thuTuPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('payrollIp.pointGroups.form.note')}
                placeholder={t('payrollIp.pointGroups.form.notePlaceholder')}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('payrollIp.pointGroups.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  activeValue={TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG}
                  inactiveValue={TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG}
                  activeLabel={t('common.activeStatus')}
                  inactiveLabel={t('common.inactiveStatus')}
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

export default PayrollPointGroupForm;
