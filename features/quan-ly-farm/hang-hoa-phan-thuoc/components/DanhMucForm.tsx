import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { List, FileText, ArrowUpFromLine, Folder } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import ParentSelect from '../../../../components/ui/ParentSelect';
import { farmDanhMucSchema, type FarmDanhMucFormValues } from '../core/schema';
import type { FarmDanhMuc } from '../core/types';
import { useCreateFarmDanhMuc, useUpdateFarmDanhMuc } from '../hooks/use-farm-danh-muc';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

function getLevel(item: FarmDanhMuc): number {
  return item.id_cha ? 2 : 1;
}

interface Props {
  initialData?: FarmDanhMuc | null;
  allDanhMuc: FarmDanhMuc[];
  defaultThuTu?: number;
  onClose: () => void;
  defaultParentId?: string | null;
}

const DanhMucForm: React.FC<Props> = ({
  initialData,
  allDanhMuc,
  defaultThuTu,
  onClose,
  defaultParentId,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateFarmDanhMuc(onClose);
  const updateMutation = useUpdateFarmDanhMuc(onClose);

  const defaultValues: Partial<FarmDanhMucFormValues> = {
    ma_danh_muc: '',
    ten_danh_muc: '',
    id_cha: '',
    thu_tu: defaultThuTu ?? 1,
    mo_ta: '',
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<FarmDanhMucFormValues>({
    resolver: zodResolver(farmDanhMucSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_danh_muc: initialData.ma_danh_muc,
        ten_danh_muc: initialData.ten_danh_muc,
        id_cha: initialData.id_cha || '',
        thu_tu: initialData.thu_tu,
        mo_ta: initialData.mo_ta ?? '',
      });
    } else {
      reset({
        ...defaultValues,
        id_cha: defaultParentId ?? '',
        thu_tu: defaultThuTu ?? 1,
      });
    }
  }, [initialData, defaultParentId, defaultThuTu, allDanhMuc, reset]);

  const onSubmit: SubmitHandler<FarmDanhMucFormValues> = (data) => {
    const sanitizedData = {
      ...data,
      id_cha: data.id_cha && data.id_cha.trim() ? data.id_cha : null,
      mo_ta: data.mo_ta?.trim() || undefined,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitizedData });
    } else {
      createMutation.mutate(sanitizedData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('farmHangHoaPhanThuoc.danhMuc.form.editTitle') : t('farmHangHoaPhanThuoc.danhMuc.form.createTitle')}
      icon={<List size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="farm-dm-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('farmHangHoaPhanThuoc.danhMuc.form.save')}
          createLabel={t('farmHangHoaPhanThuoc.danhMuc.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="farm-dm-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('farmHangHoaPhanThuoc.danhMuc.detail.basicInfo')} icon={<List size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('farmHangHoaPhanThuoc.danhMuc.form.code')}
              placeholder={t('farmHangHoaPhanThuoc.danhMuc.form.codePlaceholder')}
              icon={<List size={12} />}
              required
              {...register('ma_danh_muc')}
              error={errors.ma_danh_muc?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_danh_muc').onChange(e);
              }}
            />
            <Input
              label={t('farmHangHoaPhanThuoc.danhMuc.form.name')}
              placeholder={t('farmHangHoaPhanThuoc.danhMuc.form.namePlaceholder')}
              icon={<List size={12} />}
              required
              {...register('ten_danh_muc')}
              error={errors.ten_danh_muc?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_cha"
                control={control}
                render={({ field }) => (
                  <ParentSelect<FarmDanhMuc>
                    items={allDanhMuc}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    excludeId={initialData?.id}
                    getId={(d) => d.id}
                    getParentId={(d) => d.id_cha}
                    getLevel={getLevel}
                    getOptionLabel={(d) => d.ten_danh_muc}
                    label={t('farmHangHoaPhanThuoc.danhMuc.form.parent')}
                    icon={<Folder size={12} />}
                    placeholder={t('farmHangHoaPhanThuoc.danhMuc.form.parentNone')}
                    hint={t('farmHangHoaPhanThuoc.danhMuc.form.parentHint')}
                  />
                )}
              />
            </div>
            <Input
              type="number"
              label={t('farmHangHoaPhanThuoc.danhMuc.detail.order')}
              icon={<ArrowUpFromLine size={12} />}
              required
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('mo_ta')}
                label={t('farmHangHoaPhanThuoc.danhMuc.detail.description')}
                placeholder={t('farmHangHoaPhanThuoc.danhMuc.form.descriptionPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                error={errors.mo_ta?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DanhMucForm;
