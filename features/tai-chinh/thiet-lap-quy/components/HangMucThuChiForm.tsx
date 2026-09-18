import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tags, Type, ListOrdered, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { LOAI_HANG_MUC, loaiHangMucToI18nKey } from '../core/constants';
import { hangMucThuChiSchema, type HangMucThuChiFormValues } from '../core/schema';
import type { HangMucThuChi } from '../core/types';
import { useCreateHangMucThuChi, useUpdateHangMucThuChi } from '../hooks/use-hang-muc-thu-chi';

const DEFAULT_VALUES: HangMucThuChiFormValues = {
  ten: '',
  loai: 'chi',
  thu_tu: 0,
  ghi_chu: '',
  trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
};

interface Props {
  initialData?: HangMucThuChi | null;
  onClose: () => void;
}

const HangMucThuChiForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateHangMucThuChi(onClose);
  const updateMutation = useUpdateHangMucThuChi(onClose);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
  } = useForm<HangMucThuChiFormValues>({
    resolver: zodResolver(hangMucThuChiSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ten: initialData.ten,
        loai: initialData.loai,
        thu_tu: initialData.thu_tu,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const loaiOptions = useMemo(
    () => LOAI_HANG_MUC.map((loai) => ({ value: loai, label: t(loaiHangMucToI18nKey(loai)) })),
    [t]
  );

  const onSubmit: SubmitHandler<HangMucThuChiFormValues> = (data) => {
    const sanitized: HangMucThuChiFormValues = {
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
      title={isEdit ? t('thietLapQuy.hangMuc.form.editTitle') : t('thietLapQuy.hangMuc.form.createTitle')}
      icon={<Tags size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="hang-muc-thu-chi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapQuy.hangMuc.form.save')}
          createLabel={t('thietLapQuy.hangMuc.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="hang-muc-thu-chi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={t('thietLapQuy.hangMuc.form.basicInfo')}
          icon={<ListOrdered size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Input
              label={t('thietLapQuy.hangMuc.form.ten')}
              placeholder={t('thietLapQuy.hangMuc.form.tenPlaceholder')}
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
                  label={t('thietLapQuy.hangMuc.form.loai')}
                  icon={<Tags size={14} />}
                  required
                  searchable={false}
                  options={loaiOptions}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  error={errors.loai?.message}
                />
              )}
            />
            <Input
              type="number"
              min={0}
              label={t('thietLapQuy.hangMuc.form.thuTu')}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapQuy.hangMuc.form.ghiChu')}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapQuy.hangMuc.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  activeValue={TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG}
                  inactiveValue={TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG}
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

export default HangMucThuChiForm;
