import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ruler } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_FORM } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import {
  thietLapDonViTinhFormSchema,
  type ThietLapDonViTinhFormValues,
} from '../core/schema';
import type { DonViTinh } from '../core/types';
import { useCreateDonViTinh, useUpdateDonViTinh } from '../hooks/use-don-vi-tinh';

interface Props {
  item: DonViTinh | null;
  onClose: () => void;
}

const ThietLapDonViTinhDrawer: React.FC<Props> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!item;
  const updateMutation = useUpdateDonViTinh(onClose);
  const createMutation = useCreateDonViTinh(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<
    ThietLapDonViTinhFormValues
  >({
    resolver: zodResolver(thietLapDonViTinhFormSchema) as any,
    defaultValues: {
      ma: '',
      ten: '',
      ky_hieu: '',
      thu_tu: 0,
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        ma: item.ma,
        ten: item.ten,
        ky_hieu: item.ky_hieu ?? '',
        thu_tu: item.thu_tu,
      });
    } else {
      reset({
        ma: '',
        ten: '',
        ky_hieu: '',
        thu_tu: 0,
      });
    }
  }, [item, reset]);

  const onSubmit: SubmitHandler<ThietLapDonViTinhFormValues> = async (data) => {
    if (isEdit && item) {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          ten: data.ten,
          ky_hieu: data.ky_hieu || null,
          thu_tu: data.thu_tu,
        },
      });
    } else {
      await createMutation.mutateAsync({
        ma: data.ma,
        ten: data.ten,
        ky_hieu: data.ky_hieu || null,
        thu_tu: data.thu_tu,
      });
    }
    onClose();
  };

  const isLoading = updateMutation.isPending || createMutation.isPending;

  return (
    <GenericDrawer
      title={
        isEdit
          ? t('tieuChiKpi.thietLapDvt.drawerEditTitle')
          : t('tieuChiKpi.thietLapDvt.drawerCreateTitle')
      }
      subtitle={item?.ten}
      icon={<Ruler size={18} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="thiet-lap-don-vi-tinh-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="thiet-lap-don-vi-tinh-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 p-4"
      >
        <FormSection title={t('tieuChiKpi.thietLapDvt.colTen')}>
          <div className="grid grid-cols-1 gap-4">
            {!isEdit && (
              <Input
                label={t('tieuChiKpi.thietLapDvt.colMa')}
                required
                {...register('ma')}
                error={errors.ma?.message}
              />
            )}
            <Input
              label={t('tieuChiKpi.thietLapDvt.colTen')}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Input
              label={t('tieuChiKpi.thietLapDvt.colKyHieu')}
              {...register('ky_hieu')}
              error={errors.ky_hieu?.message}
            />
            <Controller
              name="thu_tu"
              control={control}
              render={({ field }) => (
                <Input
                  label={t('tieuChiKpi.thietLapDvt.colThuTu')}
                  type="number"
                  min={0}
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  error={errors.thu_tu?.message}
                />
              )}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThietLapDonViTinhDrawer;
