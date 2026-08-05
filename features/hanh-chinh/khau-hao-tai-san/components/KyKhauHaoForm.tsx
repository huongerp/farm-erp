import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, Calendar } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { KyKhauHao } from '../core/types';
import { KyKhauHaoFormValues, kyKhauHaoSchema } from '../core/schema';
import { useCreateKyKhauHao, useUpdateKyKhauHao } from '../hooks/use-khau-hao-tai-san';
import { THANG_OPTIONS } from '../core/constants';

const currentYear = new Date().getFullYear();

const DEFAULT_VALUES: KyKhauHaoFormValues = {
  thang: new Date().getMonth() + 1,
  nam: currentYear,
  ghi_chu: '',
};

interface Props {
  initialData?: KyKhauHao | null;
  onClose: () => void;
}

const KyKhauHaoForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const createMutation = useCreateKyKhauHao(onClose);
  const updateMutation = useUpdateKyKhauHao(onClose);
  const isEdit = !!initialData?.id;

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control } = useForm<KyKhauHaoFormValues>({
    resolver: zodResolver(kyKhauHaoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        thang: initialData.thang,
        nam: initialData.nam,
        ghi_chu: initialData.ghi_chu ?? '',
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<KyKhauHaoFormValues> = (data) => {
    const sanitized = { ...data, ghi_chu: data.ghi_chu?.trim() || undefined };
    if (isEdit && initialData?.id) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const thangSelectOptions = THANG_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));

  return (
    <GenericDrawer
      isDirty={isDirty}
      title={isEdit ? t('khauHaoTaiSan.form.editTitle') : t('khauHaoTaiSan.form.createTitle')}
      icon={<Calculator size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="ky-khau-hao-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('khauHaoTaiSan.form.save')}
          createLabel={t('khauHaoTaiSan.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="ky-khau-hao-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('khauHaoTaiSan.detail.title')} icon={<Calendar size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="thang"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('khauHaoTaiSan.form.thang')}
                  options={thangSelectOptions}
                  value={String(field.value)}
                  onChange={(v) => field.onChange(Number(v))}
                  error={errors.thang?.message}
                  icon={<Calendar size={14} />}
                />
              )}
            />
            <Input
              type="number"
              min={2000}
              max={2100}
              label={t('khauHaoTaiSan.form.nam')}
              {...register('nam')}
              error={errors.nam?.message}
              icon={<Calendar size={14} />}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default KyKhauHaoForm;
