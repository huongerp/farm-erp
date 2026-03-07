import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_FORM } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import {
  thietLapCachTinhDiemFormSchema,
  type ThietLapCachTinhDiemFormValues,
} from '../core/schema';
import type { CachTinhDiem } from '../core/types';
import { useCreateCachTinhDiem, useUpdateCachTinhDiem } from '../hooks/use-cach-tinh-diem';

interface Props {
  item: CachTinhDiem | null;
  onClose: () => void;
}

const ThietLapCachTinhDiemDrawer: React.FC<Props> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!item;
  const updateMutation = useUpdateCachTinhDiem(onClose);
  const createMutation = useCreateCachTinhDiem(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<
    ThietLapCachTinhDiemFormValues
  >({
    resolver: zodResolver(thietLapCachTinhDiemFormSchema) as any,
    defaultValues: {
      ma: '',
      ten: '',
      mo_ta: '',
      thu_tu: 0,
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        ma: item.ma,
        ten: item.ten,
        mo_ta: item.mo_ta ?? '',
        thu_tu: item.thu_tu,
      });
    } else {
      reset({
        ma: '',
        ten: '',
        mo_ta: '',
        thu_tu: 0,
      });
    }
  }, [item, reset]);

  const onSubmit: SubmitHandler<ThietLapCachTinhDiemFormValues> = async (data) => {
    if (isEdit && item) {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          ten: data.ten,
          mo_ta: data.mo_ta || null,
          thu_tu: data.thu_tu,
        },
      });
    } else {
      await createMutation.mutateAsync({
        ma: data.ma,
        ten: data.ten,
        mo_ta: data.mo_ta || null,
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
          ? t('tieuChiKpi.thietLapCtd.drawerEditTitle')
          : t('tieuChiKpi.thietLapCtd.drawerCreateTitle')
      }
      subtitle={item?.ten}
      icon={<Calculator size={18} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="thiet-lap-cach-tinh-diem-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="thiet-lap-cach-tinh-diem-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 p-4"
      >
        <FormSection title={t('tieuChiKpi.thietLapCtd.colTen')}>
          <div className="grid grid-cols-1 gap-4">
            {!isEdit && (
              <Input
                label={t('tieuChiKpi.thietLapCtd.colMa')}
                required
                {...register('ma')}
                error={errors.ma?.message}
              />
            )}
            <Input
              label={t('tieuChiKpi.thietLapCtd.colTen')}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Textarea
              label={t('tieuChiKpi.thietLapCtd.colMoTa')}
              {...register('mo_ta')}
              error={errors.mo_ta?.message}
              rows={3}
            />
            <Controller
              name="thu_tu"
              control={control}
              render={({ field }) => (
                <Input
                  label={t('tieuChiKpi.thietLapCtd.colThuTu')}
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

export default ThietLapCachTinhDiemDrawer;
