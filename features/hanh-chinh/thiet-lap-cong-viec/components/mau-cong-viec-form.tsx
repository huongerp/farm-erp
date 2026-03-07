import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Type, Hash, ListOrdered, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { MauCongViec } from '../core/types';
import { MauCongViecFormValues, mauCongViecSchema } from '../core/schema';
import { getUuTienOptions } from '../core/constants';
import { useCreateMauCongViec, useUpdateMauCongViec } from '../hooks/use-mau-cong-viec';

const DEFAULT_VALUES: MauCongViecFormValues = {
  ten_mau: '',
  tieu_de_mac_dinh: '',
  mo_ta_mac_dinh: '',
  uu_tien_mac_dinh: 'trung_binh',
  trang_thai_mac_dinh: 1,
};

interface Props {
  initialData?: MauCongViec | null;
  onClose: () => void;
}

const MauCongViecForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateMauCongViec(onClose);
  const updateMutation = useUpdateMauCongViec(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<MauCongViecFormValues>({
    resolver: zodResolver(mauCongViecSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ten_mau: initialData.ten_mau,
        tieu_de_mac_dinh: initialData.tieu_de_mac_dinh,
        mo_ta_mac_dinh: initialData.mo_ta_mac_dinh ?? '',
        uu_tien_mac_dinh: initialData.uu_tien_mac_dinh,
        trang_thai_mac_dinh: initialData.trang_thai_mac_dinh,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const uuTienOptions = useMemo(() => getUuTienOptions(t), [t]);

  const onSubmit: SubmitHandler<MauCongViecFormValues> = (data) => {
    const sanitized: MauCongViecFormValues = {
      ...data,
      mo_ta_mac_dinh: data.mo_ta_mac_dinh?.trim() || '',
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
      title={isEdit ? t('thietLapCongViec.mau.form.editTitle') : t('thietLapCongViec.mau.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="mau-cong-viec-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapCongViec.mau.form.save')}
          createLabel={t('thietLapCongViec.mau.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="mau-cong-viec-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapCongViec.mau.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={1}>
            <Input
              label={t('thietLapCongViec.mau.form.tenMau')}
              placeholder={t('thietLapCongViec.mau.form.tenMauPlaceholder')}
              icon={<Hash size={14} />}
              {...register('ten_mau')}
              error={errors.ten_mau?.message}
            />
            <Input
              label={t('thietLapCongViec.mau.form.tieuDeMacDinh')}
              placeholder={t('thietLapCongViec.mau.form.tieuDePlaceholder')}
              icon={<Type size={14} />}
              {...register('tieu_de_mac_dinh')}
              error={errors.tieu_de_mac_dinh?.message}
            />
            <Textarea
              label={t('thietLapCongViec.mau.form.moTaMacDinh')}
              placeholder={t('thietLapCongViec.mau.form.moTaPlaceholder')}
              {...register('mo_ta_mac_dinh')}
              error={errors.mo_ta_mac_dinh?.message}
            />
            <Controller
              name="uu_tien_mac_dinh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thietLapCongViec.mau.form.uuTienMacDinh')}
                  options={uuTienOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('thietLapCongViec.mau.form.uuTienPlaceholder')}
                  icon={<FileText size={16} className="text-muted-foreground" />}
                />
              )}
            />
            <Controller
              name="trang_thai_mac_dinh"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapCongViec.mau.form.status')}
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

export default MauCongViecForm;
