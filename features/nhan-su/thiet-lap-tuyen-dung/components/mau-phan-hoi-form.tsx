import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Hash, Type, ListOrdered, FileText, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import TemplateRichTextEditor from './TemplateRichTextEditor';
import { MauPhanHoi } from '../core/types';
import { MauPhanHoiFormValues, mauPhanHoiSchema } from '../core/schema';
import { useCreateMauPhanHoi, useUpdateMauPhanHoi } from '../hooks/use-mau-phan-hoi';

const DEFAULT_VALUES: MauPhanHoiFormValues = {
  ma: '',
  ten_loai: '',
  tieu_de: '',
  noi_dung_mau: '',
  trang_thai: 1,
};

interface Props {
  initialData?: MauPhanHoi | null;
  onClose: () => void;
}

const MauPhanHoiForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateMauPhanHoi(onClose);
  const updateMutation = useUpdateMauPhanHoi(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<MauPhanHoiFormValues>({
    resolver: zodResolver(mauPhanHoiSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten_loai: initialData.ten_loai,
        tieu_de: initialData.tieu_de,
        noi_dung_mau: initialData.noi_dung_mau ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<MauPhanHoiFormValues> = (data) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('thietLapTuyenDung.mauPhanHoi.form.editTitle') : t('thietLapTuyenDung.mauPhanHoi.form.createTitle')}
      icon={<Mail size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="mau-phan-hoi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapTuyenDung.mauPhanHoi.form.save')}
          createLabel={t('thietLapTuyenDung.mauPhanHoi.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="mau-phan-hoi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapTuyenDung.mauPhanHoi.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thietLapTuyenDung.mauPhanHoi.form.ma')}
              placeholder={t('thietLapTuyenDung.mauPhanHoi.form.maPlaceholder')}
              icon={<Hash size={14} />}
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('thietLapTuyenDung.mauPhanHoi.form.tenLoai')}
              placeholder={t('thietLapTuyenDung.mauPhanHoi.form.tenLoaiPlaceholder')}
              icon={<Type size={14} />}
              {...register('ten_loai')}
              error={errors.ten_loai?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('thietLapTuyenDung.mauPhanHoi.form.tieuDe')}
                placeholder={t('thietLapTuyenDung.mauPhanHoi.form.tieuDePlaceholder')}
                icon={<FileText size={14} />}
                {...register('tieu_de')}
                error={errors.tieu_de?.message}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="noi_dung_mau"
                control={control}
                render={({ field }) => (
                  <TemplateRichTextEditor
                    label={t('thietLapTuyenDung.mauPhanHoi.form.noiDungMau')}
                    placeholder={t('thietLapTuyenDung.mauPhanHoi.form.noiDungMauPlaceholder')}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.noi_dung_mau?.message}
                    minHeight="220px"
                  />
                )}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapTuyenDung.mauPhanHoi.form.status')}
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

export default MauPhanHoiForm;
