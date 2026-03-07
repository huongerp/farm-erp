import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import { thietLapLoaiChienLuocFormSchema, type ThietLapLoaiChienLuocFormValues } from '../core/schema';
import type { LoaiChienLuoc } from '../core/types';
import type { NhomLoaiChienLuoc } from '../core/types';
import { NHOM_LOAI_CHIEN_LUOC_LABEL_KEYS } from '../core/constants';
import { useUpdateLoaiChienLuoc, useCreateLoaiChienLuoc } from '../hooks/use-thiet-lap-chien-luoc';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

const NHOM_OPTIONS: { value: NhomLoaiChienLuoc; labelKey: string }[] = [
  { value: 'tows', labelKey: 'chienLuoc.thietLap.nhomTows' },
  { value: 'ansoff', labelKey: 'chienLuoc.thietLap.nhomAnsoff' },
  { value: 'corporate', labelKey: 'chienLuoc.thietLap.nhomCorporate' },
  { value: 'integration', labelKey: 'chienLuoc.thietLap.nhomIntegration' },
];

interface Props {
  item: LoaiChienLuoc | null;
  onClose: () => void;
}

const ThietLapLoaiChienLuocDrawer: React.FC<Props> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!item;
  const updateMutation = useUpdateLoaiChienLuoc(onClose);
  const createMutation = useCreateLoaiChienLuoc(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<ThietLapLoaiChienLuocFormValues>({
    resolver: zodResolver(thietLapLoaiChienLuocFormSchema) as any,
    defaultValues: {
      nhom: 'tows',
      ma: '',
      ten: '',
      mo_ta: '',
      cau_chien_luoc_mau: '',
      thu_tu: 0,
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        nhom: item.nhom,
        ma: item.ma,
        ten: item.ten,
        mo_ta: item.mo_ta ?? '',
        cau_chien_luoc_mau: item.cau_chien_luoc_mau ?? '',
        thu_tu: item.thu_tu,
      });
    } else {
      reset({
        nhom: 'tows',
        ma: '',
        ten: '',
        mo_ta: '',
        cau_chien_luoc_mau: '',
        thu_tu: 0,
      });
    }
  }, [item, reset]);

  const onSubmit: SubmitHandler<ThietLapLoaiChienLuocFormValues> = async (data) => {
    if (isEdit && item) {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          ten: data.ten,
          mo_ta: data.mo_ta || null,
          cau_chien_luoc_mau: data.cau_chien_luoc_mau || null,
          thu_tu: data.thu_tu,
        },
      });
    } else {
      await createMutation.mutateAsync({
        nhom: data.nhom,
        ma: data.ma,
        ten: data.ten,
        mo_ta: data.mo_ta || null,
        cau_chien_luoc_mau: data.cau_chien_luoc_mau || null,
        thu_tu: data.thu_tu,
      });
    }
    onClose();
  };

  const isLoading = updateMutation.isPending || createMutation.isPending;
  const nhomSelectOptions = NHOM_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));

  return (
    <GenericDrawer
      title={isEdit ? t('chienLuoc.thietLap.drawerEditTitle') : t('chienLuoc.thietLap.drawerCreateTitle')}
      subtitle={item?.ten}
      icon={<Settings size={18} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="thiet-lap-loai-chien-luoc-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="thiet-lap-loai-chien-luoc-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FormSection title={t('chienLuoc.thietLap.sectionInfo')}>
          <div className="grid grid-cols-1 gap-4">
            <Controller
              name="nhom"
              control={control}
              render={({ field }) => (
                <Select
                  ref={field.ref}
                  label={t('chienLuoc.thietLap.nhom')}
                  options={nhomSelectOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value as NhomLoaiChienLuoc)}
                  disabled={isEdit}
                  className={isEdit ? 'bg-muted/50' : ''}
                />
              )}
            />
            <Input
              label={t('chienLuoc.thietLap.ma')}
              required
              readOnly={isEdit}
              disabled={isEdit}
              {...register('ma')}
              error={errors.ma?.message}
              className={isEdit ? 'bg-muted/50' : ''}
            />
            <Input
              label={t('chienLuoc.thietLap.ten')}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Textarea
              label={t('chienLuoc.thietLap.moTa')}
              {...register('mo_ta')}
              error={errors.mo_ta?.message}
              rows={4}
            />
            <Textarea
              label={t('chienLuoc.thietLap.cauChienLuocMau')}
              placeholder={t('chienLuoc.thietLap.cauChienLuocMauPlaceholder')}
              {...register('cau_chien_luoc_mau')}
              error={errors.cau_chien_luoc_mau?.message}
              rows={4}
            />
            <Input
              label={t('chienLuoc.thietLap.thuTu')}
              type="number"
              {...register('thu_tu', { valueAsNumber: true })}
              error={errors.thu_tu?.message}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThietLapLoaiChienLuocDrawer;
