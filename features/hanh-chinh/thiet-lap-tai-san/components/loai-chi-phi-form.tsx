import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleDollarSign, Hash, Type, ListOrdered, FileText, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { LoaiChiPhi } from '../core/types';
import { LoaiChiPhiFormValues, loaiChiPhiSchema } from '../core/schema';
import { useCreateLoaiChiPhi, useUpdateLoaiChiPhi } from '../hooks/use-loai-chi-phi';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const DEFAULT_VALUES: LoaiChiPhiFormValues = {
  ma: '',
  ten: '',
  thu_tu: 0,
  ghi_chu: '',
  trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
};

interface Props {
  initialData?: LoaiChiPhi | null;
  onClose: () => void;
}

const LoaiChiPhiForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateLoaiChiPhi(onClose);
  const updateMutation = useUpdateLoaiChiPhi(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<LoaiChiPhiFormValues>({
    resolver: zodResolver(loaiChiPhiSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        thu_tu: initialData.thu_tu,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<LoaiChiPhiFormValues> = (data) => {
    const sanitized = {
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
      title={isEdit ? t('thietLapTaiSan.loaiChiPhi.form.editTitle') : t('thietLapTaiSan.loaiChiPhi.form.createTitle')}
      icon={<CircleDollarSign size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="loai-chi-phi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapTaiSan.loaiChiPhi.form.save')}
          createLabel={t('thietLapTaiSan.loaiChiPhi.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="loai-chi-phi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapTaiSan.loaiChiPhi.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thietLapTaiSan.loaiChiPhi.form.ma')}
              placeholder={t('thietLapTaiSan.loaiChiPhi.form.maPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('thietLapTaiSan.loaiChiPhi.form.ten')}
              placeholder={t('thietLapTaiSan.loaiChiPhi.form.tenPlaceholder')}
              icon={<Type size={14} />}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Input
              type="number"
              min={0}
              label={t('thietLapTaiSan.loaiChiPhi.form.thuTu')}
              placeholder={t('thietLapTaiSan.loaiChiPhi.form.thuTuPlaceholder')}
              icon={<Hash size={14} />}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapTaiSan.loaiChiPhi.form.note')}
                placeholder={t('thietLapTaiSan.loaiChiPhi.form.notePlaceholder')}
                icon={<FileText size={12} />}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapTaiSan.loaiChiPhi.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  activeValue={TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG}
                  inactiveValue={TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG}
                  activeLabel={TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG}
                  inactiveLabel={TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG}
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

export default LoaiChiPhiForm;
