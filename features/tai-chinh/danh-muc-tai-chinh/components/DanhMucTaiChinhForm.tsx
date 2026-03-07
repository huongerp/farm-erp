import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { List, ListTree, FileText, ArrowUpFromLine, Power, Tag } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import ParentSelect from '../../../../components/ui/ParentSelect';
import { hangMucTaiChinhSchema, type HangMucTaiChinhFormValues } from '../core/schema';
import type { HangMucTaiChinh } from '../../../core/types';
import { useCreateDanhMucTaiChinh, useUpdateDanhMucTaiChinh } from '../hooks/use-danh-muc-tai-chinh';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

function getLevel(item: HangMucTaiChinh): number {
  return item.id_cha ? 2 : 1;
}

interface Props {
  initialData?: HangMucTaiChinh | null;
  allDanhMuc: HangMucTaiChinh[];
  onClose: () => void;
  defaultParentId?: string | null;
  /** Khi thêm mới từ tab Thu/Chi, mặc định chọn loại theo tab */
  defaultLoai?: 'thu' | 'chi';
}

const DanhMucTaiChinhForm: React.FC<Props> = ({
  initialData,
  allDanhMuc,
  onClose,
  defaultParentId,
  defaultLoai,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDanhMucTaiChinh(onClose);
  const updateMutation = useUpdateDanhMucTaiChinh(onClose);

  const defaultValues: Partial<HangMucTaiChinhFormValues> = {
    ma_danh_muc: '',
    ten_danh_muc: '',
    loai: 'thu',
    id_cha: '',
    thu_tu: 0,
    mo_ta: '',
    trang_thai: 1,
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<
    HangMucTaiChinhFormValues
  >({
    resolver: zodResolver(hangMucTaiChinhSchema) as any,
    defaultValues,
  });

  const selectedLoai = watch('loai');

  const parentOptions = useMemo(() => {
    return allDanhMuc.filter((d) => !d.id_cha && d.loai === selectedLoai);
  }, [allDanhMuc, selectedLoai]);

  useEffect(() => {
    if (initialData) {
      reset({
        ma_danh_muc: initialData.ma_danh_muc,
        ten_danh_muc: initialData.ten_danh_muc,
        loai: initialData.loai,
        id_cha: initialData.id_cha || '',
        thu_tu: initialData.thu_tu,
        mo_ta: initialData.mo_ta ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      const loaiFromParent = defaultParentId
        ? allDanhMuc.find((d) => d.id === defaultParentId)?.loai
        : undefined;
      reset({
        ...defaultValues,
        loai: defaultLoai ?? loaiFromParent ?? 'thu',
        id_cha: defaultParentId ?? '',
      });
    }
  }, [initialData, defaultParentId, defaultLoai, allDanhMuc, reset]);

  const onSubmit: SubmitHandler<HangMucTaiChinhFormValues> = (data) => {
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
      title={isEdit ? t('danhMucTaiChinh.form.editTitle') : t('danhMucTaiChinh.form.createTitle')}
      icon={<List size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="danh-muc-tai-chinh-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('danhMucTaiChinh.form.save')}
          createLabel={t('danhMucTaiChinh.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="danh-muc-tai-chinh-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection
          title={t('danhMucTaiChinh.form.basicInfo')}
          icon={<ListTree size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Input
              label={t('danhMucTaiChinh.form.tenDanhMuc')}
              placeholder={t('danhMucTaiChinh.form.tenDanhMucPlaceholder')}
              icon={<ListTree size={12} />}
              required
              {...register('ten_danh_muc')}
              error={errors.ten_danh_muc?.message}
            />
            <Input
              label={t('danhMucTaiChinh.form.maDanhMuc')}
              placeholder={t('danhMucTaiChinh.form.maDanhMucPlaceholder')}
              icon={<Tag size={12} />}
              required
              {...register('ma_danh_muc')}
              error={errors.ma_danh_muc?.message}
            />
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                    <Tag size={12} className="text-muted-foreground" />
                    {t('danhMucTaiChinh.form.loai')}
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="thu"
                        checked={field.value === 'thu'}
                        onChange={() => field.onChange('thu')}
                        className="rounded border-border text-primary accent-primary"
                      />
                      <span className="text-sm">{t('danhMucTaiChinh.loaiThu')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="chi"
                        checked={field.value === 'chi'}
                        onChange={() => field.onChange('chi')}
                        className="rounded border-border text-primary accent-primary"
                      />
                      <span className="text-sm">{t('danhMucTaiChinh.loaiChi')}</span>
                    </label>
                  </div>
                </div>
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_cha"
                control={control}
                render={({ field }) => (
                  <ParentSelect<HangMucTaiChinh>
                    items={parentOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    excludeId={initialData?.id}
                    getId={(d) => d.id}
                    getParentId={(d) => d.id_cha}
                    getLevel={getLevel}
                    getOptionLabel={(d) => d.ten_danh_muc}
                    label={t('danhMucTaiChinh.form.parent')}
                    icon={<ListTree size={12} />}
                    placeholder={t('danhMucTaiChinh.form.parentNone')}
                    hint={t('danhMucTaiChinh.form.parentHint')}
                  />
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('mo_ta')}
                label={t('danhMucTaiChinh.form.moTa')}
                placeholder={t('danhMucTaiChinh.form.moTaPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                error={errors.mo_ta?.message}
              />
            </div>
            <Input
              type="number"
              label={t('danhMucTaiChinh.form.thuTu')}
              icon={<ArrowUpFromLine size={12} />}
              min={0}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
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

export default DanhMucTaiChinhForm;
