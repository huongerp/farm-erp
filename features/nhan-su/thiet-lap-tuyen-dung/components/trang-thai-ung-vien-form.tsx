import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag, Hash, Type, ListOrdered, FileText, Power, UserCheck } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { TrangThaiUngVien } from '../core/types';
import { TrangThaiUngVienFormValues, trangThaiUngVienSchema } from '../core/schema';
import { useCreateTrangThaiUngVien, useUpdateTrangThaiUngVien } from '../hooks/use-trang-thai-ung-vien';

const DEFAULT_VALUES: TrangThaiUngVienFormValues = {
  ma: '',
  ten: '',
  thu_tu: 0,
  ghi_chu: '',
  loai_ket_qua: '',
  trang_thai: 1,
};

interface Props {
  initialData?: TrangThaiUngVien | null;
  onClose: () => void;
}

const TrangThaiUngVienForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateTrangThaiUngVien(onClose);
  const updateMutation = useUpdateTrangThaiUngVien(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<TrangThaiUngVienFormValues>({
    resolver: zodResolver(trangThaiUngVienSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        thu_tu: initialData.thu_tu,
        ghi_chu: initialData.ghi_chu ?? '',
        loai_ket_qua: initialData.loai_ket_qua ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<TrangThaiUngVienFormValues> = (data) => {
    const sanitized = {
      ...data,
      ghi_chu: data.ghi_chu?.trim() || undefined,
      loai_ket_qua: data.loai_ket_qua ?? '',
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
      title={isEdit ? t('thietLapTuyenDung.trangThaiUngVien.form.editTitle') : t('thietLapTuyenDung.trangThaiUngVien.form.createTitle')}
      icon={<Tag size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="trang-thai-ung-vien-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapTuyenDung.trangThaiUngVien.form.save')}
          createLabel={t('thietLapTuyenDung.trangThaiUngVien.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="trang-thai-ung-vien-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapTuyenDung.trangThaiUngVien.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thietLapTuyenDung.trangThaiUngVien.form.ma')}
              placeholder={t('thietLapTuyenDung.trangThaiUngVien.form.maPlaceholder')}
              icon={<Hash size={14} />}
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('thietLapTuyenDung.trangThaiUngVien.form.ten')}
              placeholder={t('thietLapTuyenDung.trangThaiUngVien.form.tenPlaceholder')}
              icon={<Type size={14} />}
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Input
              type="number"
              min={0}
              label={t('thietLapTuyenDung.trangThaiUngVien.form.thuTu')}
              placeholder={t('thietLapTuyenDung.trangThaiUngVien.form.thuTuPlaceholder')}
              icon={<Hash size={14} />}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <Controller
              name="loai_ket_qua"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('thietLapTuyenDung.trangThaiUngVien.form.loaiKetQua')}
                  options={[
                    { value: '', label: t('thietLapTuyenDung.trangThaiUngVien.form.loaiKetQuaNone') },
                    { value: 'onboard', label: t('thietLapTuyenDung.trangThaiUngVien.form.loaiKetQuaOnboard') },
                    { value: 'nghi', label: t('thietLapTuyenDung.trangThaiUngVien.form.loaiKetQuaNghi') },
                  ]}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  icon={<UserCheck size={14} />}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapTuyenDung.trangThaiUngVien.form.note')}
                placeholder={t('thietLapTuyenDung.trangThaiUngVien.form.notePlaceholder')}
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
                  label={t('thietLapTuyenDung.trangThaiUngVien.form.status')}
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

export default TrangThaiUngVienForm;
