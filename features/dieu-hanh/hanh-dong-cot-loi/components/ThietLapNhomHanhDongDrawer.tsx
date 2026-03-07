import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import {
  thietLapNhomHanhDongFormSchema,
  type ThietLapNhomHanhDongFormValues,
} from '../core/schema';
import type { NhomHanhDong } from '../core/types';
import { useCreateNhomHanhDong, useUpdateNhomHanhDong } from '../hooks/use-nhom-hanh-dong';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_FORM } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  item: NhomHanhDong | null;
  onClose: () => void;
}

const ThietLapNhomHanhDongDrawer: React.FC<Props> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!item;
  const updateMutation = useUpdateNhomHanhDong(onClose);
  const createMutation = useCreateNhomHanhDong(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<
    ThietLapNhomHanhDongFormValues
  >({
    resolver: zodResolver(thietLapNhomHanhDongFormSchema) as any,
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

  const onSubmit: SubmitHandler<ThietLapNhomHanhDongFormValues> = async (data) => {
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
          ? t('hanhDongCotLoi.thietLap.drawerEditTitle')
          : t('hanhDongCotLoi.thietLap.drawerCreateTitle')
      }
      subtitle={item?.ten}
      icon={<Settings size={18} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="thiet-lap-nhom-hanh-dong-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="thiet-lap-nhom-hanh-dong-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 p-4"
      >
        <FormSection title={t('hanhDongCotLoi.thietLap.colTen')}>
          <div className="grid grid-cols-1 gap-4">
            {!isEdit && (
              <Input
                label={t('hanhDongCotLoi.thietLap.colMa')}
                required
                {...register('ma')}
                error={errors.ma?.message}
              />
            )}
            <Input
              label={t('hanhDongCotLoi.thietLap.colTen')}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Textarea
              label={t('hanhDongCotLoi.thietLap.colMoTa')}
              {...register('mo_ta')}
              error={errors.mo_ta?.message}
              rows={3}
            />
            <Controller
              name="thu_tu"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {t('hanhDongCotLoi.thietLap.colThuTu')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              )}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThietLapNhomHanhDongDrawer;
