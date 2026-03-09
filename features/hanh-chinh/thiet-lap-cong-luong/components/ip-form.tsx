import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wifi, MapPin, FileText, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { PayrollWifiIp } from '../core/types';
import { PayrollWifiIpFormValues, payrollWifiIpSchema } from '../core/schema';
import { useCreatePayrollWifiIp, useUpdatePayrollWifiIp } from '../hooks/use-payroll-wifi-ip';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const DEFAULT_VALUES: PayrollWifiIpFormValues = {
  id_chi_nhanh: '',
  ip_wifi: '',
  ghi_chu: '',
  trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
};

interface Props {
  initialData?: PayrollWifiIp | null;
  onClose: () => void;
}

const PayrollWifiIpForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreatePayrollWifiIp(onClose);
  const updateMutation = useUpdatePayrollWifiIp(onClose);
  const { data: branches = [] } = useBranches();

  const branchOptions = branches.map(b => ({
    label: b.ten_chi_nhanh,
    value: b.id,
    subLabel: b.ma_chi_nhanh,
  }));

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<PayrollWifiIpFormValues>({
    resolver: zodResolver(payrollWifiIpSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id_chi_nhanh: initialData.id_chi_nhanh,
        ip_wifi: initialData.ip_wifi,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<PayrollWifiIpFormValues> = (data) => {
    const sanitizedData = {
      ...data,
      ip_wifi: data.ip_wifi.trim(),
      ghi_chu: data.ghi_chu?.trim() || undefined,
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
      title={isEdit ? t('payrollIp.form.editTitle') : t('payrollIp.form.createTitle')}
      icon={<Wifi size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="payroll-ip-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('payrollIp.form.save')}
          createLabel={t('payrollIp.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="payroll-ip-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('payrollIp.form.basicInfo')} icon={<Wifi size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('payrollIp.form.branch')}
                  options={branchOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('payrollIp.form.branchPlaceholder')}
                  error={errors.id_chi_nhanh?.message}
                  icon={<MapPin size={12} />}
                />
              )}
            />
            <Input
              label={t('payrollIp.form.ip')}
              placeholder={t('payrollIp.form.ipPlaceholder')}
              icon={<Wifi size={12} />}
              required
              {...register('ip_wifi')}
              error={errors.ip_wifi?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('payrollIp.form.note')}
                placeholder={t('payrollIp.form.notePlaceholder')}
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
                  label={t('payrollIp.form.status')}
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

export default PayrollWifiIpForm;
