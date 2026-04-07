import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList } from 'lucide-react';
import Textarea from '../../../../components/ui/Textarea';
import NumberInput from '../../../../components/ui/NumberInput';
import { thuHoachThucTeFormSchema, type ThuHoachThucTeFormValues } from '../core/schema';
import type { FarmThuHoach } from '../core/types';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import { DAY_FORM_LABEL_KEY, farmThuHoachToThucTeForm } from '../core/form-mappers';
import { useUpdateThuHoachThucTe } from '../hooks/use-thu-hoach';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  data: FarmThuHoach;
  onClose: () => void;
}

const ThucTeDialog: React.FC<Props> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateThuHoachThucTe(onClose);

  const defaultValues = useMemo(() => farmThuHoachToThucTeForm(data), [data]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ThuHoachThucTeFormValues>({
    resolver: zodResolver(thuHoachThucTeFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit: SubmitHandler<ThuHoachThucTeFormValues> = (formData) => {
    updateMutation.mutate({ id: data.id, data: formData });
  };

  const pending = isSubmitting || updateMutation.isPending;

  return (
    <GenericDrawer
      title={t('thuHoach.thucTe.title')}
      subtitle={`${t('thuHoach.store.colNam')} ${data.nam} · ${t('thuHoach.store.colTuan')} ${data.tuan}`}
      icon={<ClipboardList className="text-primary" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      stackLevel={1}
      footer={
        <FormDrawerFooter
          formId="thu-hoach-thuc-te-form"
          onCancel={onClose}
          isEdit
          isLoading={pending}
          saveLabel={t('thuHoach.thucTe.submit')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="thu-hoach-thuc-te-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('thuHoach.detail.thucTe')}>
          <FormGrid cols={2}>
            {THU_HOACH_DAY_SUFFIXES.map((s) => (
              <Controller
                key={s}
                name={`thuc_te_${s}` as keyof ThuHoachThucTeFormValues}
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label={t(DAY_FORM_LABEL_KEY[s])}
                    value={field.value as number}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={0}
                    maxFractionDigits={2}
                    showZeroFormatted
                  />
                )}
              />
            ))}
          </FormGrid>
          <div className="mt-3">
            <Controller
              name="trao_doi"
              control={control}
              render={({ field }) => (
                <Textarea label={t('thuHoach.detail.traoDoi')} {...field} value={field.value ?? ''} rows={3} />
              )}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThucTeDialog;
