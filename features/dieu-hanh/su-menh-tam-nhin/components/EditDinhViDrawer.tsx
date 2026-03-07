import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react';
import Textarea from '../../../../components/ui/Textarea';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { dinhViFormSchema, type DinhViFormValues } from '../core/schema';
import type { DinhVi } from '../core/types';
import { useUpdateDinhVi } from '../hooks/use-su-menh-tam-nhin';

interface Props {
  data: DinhVi | null | undefined;
  onClose: () => void;
}

const EditDinhViDrawer: React.FC<Props> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateDinhVi();
  const d = data ?? {};

  const defaultValues: DinhViFormValues = {
    phan_khuc_hien_tai: d.phan_khuc_hien_tai ?? '',
    phan_khuc_tuong_lai: d.phan_khuc_tuong_lai ?? '',
    khach_hang_hien_tai: d.khach_hang_hien_tai ?? '',
    khach_hang_tuong_lai: d.khach_hang_tuong_lai ?? '',
    san_pham_hien_tai: d.san_pham_hien_tai ?? '',
    san_pham_tuong_lai: d.san_pham_tuong_lai ?? '',
  };

  const { register, handleSubmit, reset } = useForm<DinhViFormValues>({
    resolver: zodResolver(dinhViFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset({
      phan_khuc_hien_tai: d.phan_khuc_hien_tai ?? '',
      phan_khuc_tuong_lai: d.phan_khuc_tuong_lai ?? '',
      khach_hang_hien_tai: d.khach_hang_hien_tai ?? '',
      khach_hang_tuong_lai: d.khach_hang_tuong_lai ?? '',
      san_pham_hien_tai: d.san_pham_hien_tai ?? '',
      san_pham_tuong_lai: d.san_pham_tuong_lai ?? '',
    });
  }, [data, reset]);

  const onSubmit: SubmitHandler<DinhViFormValues> = async (formData) => {
    await updateMutation.mutateAsync(formData);
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <GenericDrawer
      title={t('suMenhTamNhin.editDinhVi')}
      icon={<MapPin size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="dinh-vi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="dinh-vi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.dinhVi')} icon={<MapPin size={14} />} variant="primary">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                {t('suMenhTamNhin.dinhViPhanKhuc')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Textarea
                  label={t('suMenhTamNhin.hienTai')}
                  placeholder={t('suMenhTamNhin.dinhViPlaceholder')}
                  rows={3}
                  {...register('phan_khuc_hien_tai')}
                />
                <Textarea
                  label={t('suMenhTamNhin.tuongLai')}
                  placeholder={t('suMenhTamNhin.dinhViPlaceholder')}
                  rows={3}
                  {...register('phan_khuc_tuong_lai')}
                />
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                {t('suMenhTamNhin.khachHang')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Textarea
                  label={t('suMenhTamNhin.hienTai')}
                  placeholder={t('suMenhTamNhin.dinhViPlaceholder')}
                  rows={3}
                  {...register('khach_hang_hien_tai')}
                />
                <Textarea
                  label={t('suMenhTamNhin.tuongLai')}
                  placeholder={t('suMenhTamNhin.dinhViPlaceholder')}
                  rows={3}
                  {...register('khach_hang_tuong_lai')}
                />
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                {t('suMenhTamNhin.sanPham')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Textarea
                  label={t('suMenhTamNhin.hienTai')}
                  placeholder={t('suMenhTamNhin.dinhViPlaceholder')}
                  rows={3}
                  {...register('san_pham_hien_tai')}
                />
                <Textarea
                  label={t('suMenhTamNhin.tuongLai')}
                  placeholder={t('suMenhTamNhin.dinhViPlaceholder')}
                  rows={3}
                  {...register('san_pham_tuong_lai')}
                />
              </div>
            </div>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default EditDinhViDrawer;
