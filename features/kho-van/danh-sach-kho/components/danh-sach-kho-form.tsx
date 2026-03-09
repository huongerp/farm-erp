import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Warehouse, MapPin, FileText, ArrowUpFromLine, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import { KhoFormValues, khoSchema } from '../core/schema';
import { Kho } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useCreateKho, useUpdateKho } from '../hooks/use-kho';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  initialData?: Kho | null;
  onClose: () => void;
}

const DanhSachKhoForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateKho(onClose);
  const updateMutation = useUpdateKho(onClose);

  const defaultValues: Partial<KhoFormValues> = {
    ma_kho: '',
    ten_kho: '',
    dia_chi: '',
    mo_ta: '',
    id_chi_nhanh: null,
    trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
    thu_tu: 0,
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<KhoFormValues>({
    resolver: zodResolver(khoSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_kho: initialData.ma_kho,
        ten_kho: initialData.ten_kho,
        dia_chi: initialData.dia_chi ?? '',
        mo_ta: initialData.mo_ta ?? '',
        id_chi_nhanh: initialData.id_chi_nhanh ?? null,
        trang_thai: initialData.trang_thai,
        thu_tu: initialData.thu_tu,
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<KhoFormValues> = (data) => {
    const sanitized = {
      ...data,
      dia_chi: data.dia_chi?.trim() || undefined,
      mo_ta: data.mo_ta?.trim() || undefined,
      id_chi_nhanh: data.id_chi_nhanh === '' || data.id_chi_nhanh === undefined ? null : data.id_chi_nhanh,
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
      title={isEdit ? t('kho.form.editTitle') : t('kho.form.createTitle')}
      icon={<Warehouse size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="kho-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('kho.form.save')}
          createLabel={t('kho.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="kho-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('kho.detail.basicInfo')} icon={<Warehouse size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('kho.form.code')}
              placeholder={t('kho.form.codePlaceholder')}
              icon={<Warehouse size={12} />}
              required
              {...register('ma_kho')}
              error={errors.ma_kho?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_kho').onChange(e);
              }}
            />
            <Input
              label={t('kho.form.name')}
              placeholder={t('kho.form.namePlaceholder')}
              icon={<Warehouse size={12} />}
              required
              {...register('ten_kho')}
              error={errors.ten_kho?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('kho.form.address')}
                placeholder={t('kho.form.addressPlaceholder')}
                icon={<MapPin size={12} />}
                {...register('dia_chi')}
                error={errors.dia_chi?.message}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('mo_ta')}
                label={t('kho.detail.description')}
                placeholder={t('kho.form.descriptionPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                error={errors.mo_ta?.message}
              />
            </div>
            <Input
              type="number"
              label={t('kho.detail.order')}
              icon={<ArrowUpFromLine size={12} />}
              required
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('common.status')}
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

export default DanhSachKhoForm;
