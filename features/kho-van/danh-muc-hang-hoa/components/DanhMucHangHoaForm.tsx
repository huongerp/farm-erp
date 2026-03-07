import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { List, FileText, ArrowUpFromLine, Power, Folder } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import ParentSelect from '../../../../components/ui/ParentSelect';
import { danhMucHangHoaSchema, type DanhMucHangHoaFormValues } from '../core/schema';
import type { DanhMucHangHoa } from '../core/types';
import { useCreateDanhMucHangHoa, useUpdateDanhMucHangHoa } from '../hooks/use-danh-muc-hang-hoa';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

function getLevel(item: DanhMucHangHoa): number {
  return item.id_cha ? 2 : 1;
}

interface Props {
  initialData?: DanhMucHangHoa | null;
  allDanhMuc: DanhMucHangHoa[];
  onClose: () => void;
  defaultParentId?: string | null;
}

const DanhMucHangHoaForm: React.FC<Props> = ({
  initialData,
  allDanhMuc,
  onClose,
  defaultParentId,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDanhMucHangHoa(onClose);
  const updateMutation = useUpdateDanhMucHangHoa(onClose);

  const defaultValues: Partial<DanhMucHangHoaFormValues> = {
    ma_danh_muc: '',
    ten_danh_muc: '',
    id_cha: '',
    thu_tu: 0,
    mo_ta: '',
    trang_thai: 1,
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<
    DanhMucHangHoaFormValues
  >({
    resolver: zodResolver(danhMucHangHoaSchema) as any,
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
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset({
        ...defaultValues,
        id_cha: defaultParentId ?? '',
      });
    }
  }, [initialData, defaultParentId, allDanhMuc, reset]);

  const onSubmit: SubmitHandler<DanhMucHangHoaFormValues> = (data) => {
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
      title={isEdit ? t('danhMucHangHoa.form.editTitle') : t('danhMucHangHoa.form.createTitle')}
      icon={<List size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="dmhh-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('danhMucHangHoa.form.save')}
          createLabel={t('danhMucHangHoa.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="dmhh-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('danhMucHangHoa.detail.basicInfo')} icon={<List size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('danhMucHangHoa.form.code')}
              placeholder={t('danhMucHangHoa.form.codePlaceholder')}
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
              label={t('danhMucHangHoa.form.name')}
              placeholder={t('danhMucHangHoa.form.namePlaceholder')}
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
                  <ParentSelect<DanhMucHangHoa>
                    items={allDanhMuc}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    excludeId={initialData?.id}
                    getId={(d) => d.id}
                    getParentId={(d) => d.id_cha}
                    getLevel={getLevel}
                    getOptionLabel={(d) => d.ten_danh_muc}
                    label={t('danhMucHangHoa.form.parent')}
                    icon={<Folder size={12} />}
                    placeholder={t('danhMucHangHoa.form.parentNone')}
                    hint={t('danhMucHangHoa.form.parentHint')}
                  />
                )}
              />
            </div>
            <Input
              type="number"
              label={t('danhMucHangHoa.detail.order')}
              icon={<ArrowUpFromLine size={12} />}
              required
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('mo_ta')}
                label={t('danhMucHangHoa.detail.description')}
                placeholder={t('danhMucHangHoa.form.descriptionPlaceholder')}
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

export default DanhMucHangHoaForm;
