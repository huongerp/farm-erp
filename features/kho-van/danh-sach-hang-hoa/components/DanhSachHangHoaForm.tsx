import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, FileText, ArrowUpFromLine, Power, Folder, Camera } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import SingleImageInput from '../../../../components/ui/SingleImageInput';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import Select from '../../../../components/ui/Select';
import { HangHoaFormValues, hangHoaSchema } from '../core/schema';
import type { HangHoa } from '../core/types';
import type { DanhMucHangHoa } from '../../danh-muc-hang-hoa/core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useCreateHangHoa, useUpdateHangHoa } from '../hooks/use-hang-hoa';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  initialData?: HangHoa | null;
  danhMucList: DanhMucHangHoa[];
  onClose: () => void;
}

const DanhSachHangHoaForm: React.FC<Props> = ({ initialData, danhMucList, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateHangHoa(onClose);
  const updateMutation = useUpdateHangHoa(onClose);

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('hangHoa.form.categoryNone') },
      ...danhMucList.map((d) => ({ value: d.id, label: d.ten_danh_muc })),
    ],
    [danhMucList, t]
  );

  const defaultValues: Partial<HangHoaFormValues> = {
    ma_hang: '',
    ten_hang: '',
    id_danh_muc: null,
    don_vi_tinh: '',
    ton_toi_thieu: undefined,
    mo_ta: '',
    hinh_anh: null,
    trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
    thu_tu: 0,
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<HangHoaFormValues>({
    resolver: zodResolver(hangHoaSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_hang: initialData.ma_hang,
        ten_hang: initialData.ten_hang,
        id_danh_muc: initialData.id_danh_muc ?? null,
        don_vi_tinh: initialData.don_vi_tinh ?? '',
        mo_ta: initialData.mo_ta ?? '',
        hinh_anh: initialData.hinh_anh ?? null,
        trang_thai: initialData.trang_thai,
        thu_tu: initialData.thu_tu,
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<HangHoaFormValues> = (data) => {
    const sanitized = {
      ...data,
      id_danh_muc: data.id_danh_muc === '' || data.id_danh_muc === undefined ? null : data.id_danh_muc,
      don_vi_tinh: data.don_vi_tinh?.trim() || undefined,
      mo_ta: data.mo_ta?.trim() || undefined,
      hinh_anh: data.hinh_anh || null,
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
      title={isEdit ? t('hangHoa.form.editTitle') : t('hangHoa.form.createTitle')}
      icon={<Package size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="hang-hoa-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('hangHoa.form.save')}
          createLabel={t('hangHoa.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="hang-hoa-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('hangHoa.detail.basicInfo')} icon={<Package size={14} />} variant="primary">
          <div className="flex justify-center mb-4">
            <Controller
              name="hinh_anh"
              control={control}
              render={({ field }) => (
                <SingleImageInput
                  label={t('hangHoa.form.image')}
                  icon={<Camera className="w-4 h-4" />}
                  value={field.value}
                  onChange={field.onChange}
                  shape="rounded"
                  maxSizeMB={2}
                  placeholder={t('hangHoa.form.imagePlaceholder')}
                  hint={t('hangHoa.form.imageHint')}
                  className="w-[180px]"
                />
              )}
            />
          </div>
          <FormGrid cols={2}>
            <Input
              label={t('hangHoa.form.code')}
              placeholder={t('hangHoa.form.codePlaceholder')}
              icon={<Package size={12} />}
              required
              {...register('ma_hang')}
              error={errors.ma_hang?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_hang').onChange(e);
              }}
            />
            <Input
              label={t('hangHoa.form.name')}
              placeholder={t('hangHoa.form.namePlaceholder')}
              icon={<Package size={12} />}
              required
              {...register('ten_hang')}
              error={errors.ten_hang?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_danh_muc"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('hangHoa.form.category')}
                    icon={<Folder size={12} />}
                    options={categoryOptions}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  />
                )}
              />
            </div>
            <Input
              label={t('hangHoa.form.unit')}
              placeholder={t('hangHoa.form.unitPlaceholder')}
              icon={<Package size={12} />}
              {...register('don_vi_tinh')}
              error={errors.don_vi_tinh?.message}
            />
            <Input
              type="number"
              min={0}
              label={t('hangHoa.form.minStock')}
              placeholder={t('hangHoa.form.minStockPlaceholder')}
              icon={<Package size={12} />}
              {...register('ton_toi_thieu')}
              error={errors.ton_toi_thieu?.message}
            />
            <Input
              type="number"
              label={t('hangHoa.detail.order')}
              icon={<ArrowUpFromLine size={12} />}
              required
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('mo_ta')}
                label={t('hangHoa.detail.description')}
                placeholder={t('hangHoa.form.descriptionPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                error={errors.mo_ta?.message}
              />
            </div>
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

export default DanhSachHangHoaForm;
