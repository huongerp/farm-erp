import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Hash, Type, ListOrdered, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { TienDoMuaHang } from '../core/types';
import { TienDoMuaHangFormValues, tienDoMuaHangSchema } from '../core/schema';
import { TRANG_THAI_MAU_DEFAULT, TRANG_THAI_MAU_PRESETS } from '../core/constants';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useCreateTienDoMuaHang, useUpdateTienDoMuaHang } from '../hooks/use-tien-do-mua-hang';

const DEFAULT_VALUES: TienDoMuaHangFormValues = {
  ma: '',
  ten: '',
  thu_tu: 0,
  mau: TRANG_THAI_MAU_DEFAULT,
  ghi_chu: '',
  trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
};

interface Props {
  initialData?: TienDoMuaHang | null;
  onClose: () => void;
}

const TienDoMuaHangForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateTienDoMuaHang(onClose);
  const updateMutation = useUpdateTienDoMuaHang(onClose);

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control } = useForm<TienDoMuaHangFormValues>({
    resolver: zodResolver(tienDoMuaHangSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        thu_tu: initialData.thu_tu,
        mau: initialData.mau ?? TRANG_THAI_MAU_DEFAULT,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<TienDoMuaHangFormValues> = (data) => {
    const sanitized: TienDoMuaHangFormValues = {
      ...data,
      ghi_chu: data.ghi_chu?.trim() || undefined,
      mau: data.mau?.trim() || undefined,
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
      title={isEdit ? t('thietLapDeXuatVatTu.tienDoMuaHang.form.editTitle') : t('thietLapDeXuatVatTu.tienDoMuaHang.form.createTitle')}
      icon={<Package size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="tien-do-mua-hang-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapDeXuatVatTu.tienDoMuaHang.form.save')}
          createLabel={t('thietLapDeXuatVatTu.tienDoMuaHang.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="tien-do-mua-hang-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapDeXuatVatTu.tienDoMuaHang.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.ma')}
              placeholder={t('thietLapDeXuatVatTu.tienDoMuaHang.form.maPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.ten')}
              placeholder={t('thietLapDeXuatVatTu.tienDoMuaHang.form.tenPlaceholder')}
              icon={<Type size={14} />}
              required
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Input
              type="number"
              min={0}
              label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.thuTu')}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <Controller
              name="mau"
              control={control}
              render={({ field }) => (
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('thietLapDeXuatVatTu.tienDoMuaHang.form.mau')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TRANG_THAI_MAU_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => field.onChange(hex)}
                        className={`w-8 h-8 rounded-md border-2 shrink-0 transition-all ${
                          (field.value || TRANG_THAI_MAU_DEFAULT) === hex
                            ? 'border-primary ring-2 ring-primary/30 scale-110'
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 items-end">
                    <Input
                      placeholder="VD: #6366f1"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={errors.mau?.message}
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={field.value || TRANG_THAI_MAU_DEFAULT}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent"
                      title={t('thietLapDeXuatVatTu.tienDoMuaHang.form.mau')}
                    />
                  </div>
                </div>
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.ghiChu')}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.status')}
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

export default TienDoMuaHangForm;
