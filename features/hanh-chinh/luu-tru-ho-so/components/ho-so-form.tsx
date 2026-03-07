import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderOpen, Hash, Type, Calendar, Power, Building2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { HoSo } from '../core/types';
import { HoSoFormValues, hoSoSchema } from '../core/schema';
import { useCreateHoSo, useUpdateHoSo } from '../hooks/use-ho-so';
import { useTaiLieuList } from '../../tai-lieu/hooks/use-tai-lieu';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { formatDateForInput } from '../../../../lib/utils';

const DEFAULT_VALUES: HoSoFormValues = {
  id_tai_lieu: '',
  ma_ho_so: '',
  ten_ho_so: '',
  id_phong_ban: '',
  thoi_han_luu_tru: '',
  mo_ta: '',
  trang_thai: 1,
};

interface Props {
  initialData?: HoSo | null;
  onClose: () => void;
}

const HoSoForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateHoSo(onClose);
  const updateMutation = useUpdateHoSo(onClose);
  const { data: taiLieuList = [] } = useTaiLieuList();
  const { data: departments = [] } = useDepartments();
  const phongBanOptions = departments.map((d) => ({ label: d.ten_phong_ban, value: d.id }));
  const taiLieuOptions = taiLieuList.map((t) => ({ label: t.trich_yeu || t.id, value: t.id }));

  const { register, handleSubmit, formState: { errors }, reset, setValue, control, watch } = useForm<HoSoFormValues>({
    resolver: zodResolver(hoSoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const trangThai = watch('trang_thai');

  useEffect(() => {
    if (initialData) {
      reset({
        id_tai_lieu: initialData.id_tai_lieu,
        ma_ho_so: initialData.ma_ho_so,
        ten_ho_so: initialData.ten_ho_so,
        id_phong_ban: initialData.id_phong_ban ?? '',
        thoi_han_luu_tru: initialData.thoi_han_luu_tru ?? '',
        mo_ta: initialData.mo_ta ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<HoSoFormValues> = (data) => {
    const sanitized: HoSoFormValues = {
      ...data,
      mo_ta: data.mo_ta?.trim() || '',
      thoi_han_luu_tru: data.thoi_han_luu_tru?.trim() || undefined,
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
      title={isEdit ? t('hoSo.form.editTitle') : t('hoSo.form.createTitle')}
      icon={<FolderOpen size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="ho-so-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('hoSo.form.save')}
          createLabel={t('hoSo.form.create')}
          createIcon={<FolderOpen className="mr-2 h-4 w-4" />}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="ho-so-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('hoSo.form.basicInfo')} icon={<FolderOpen size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="id_tai_lieu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('hoSo.form.taiLieuCha')}
                  options={taiLieuOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('hoSo.form.taiLieuChaPlaceholder')}
                  icon={<FolderOpen size={14} />}
                  required
                />
              )}
            />
            {errors.id_tai_lieu?.message && (
              <p className="text-sm text-destructive col-span-2">{errors.id_tai_lieu.message}</p>
            )}
            <Input
              label={t('hoSo.form.maHoSo')}
              placeholder={t('hoSo.form.maHoSoPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma_ho_so')}
              error={errors.ma_ho_so?.message}
            />
            <Input
              label={t('hoSo.form.tenHoSo')}
              placeholder={t('hoSo.form.tenHoSoPlaceholder')}
              icon={<Type size={14} />}
              required
              {...register('ten_ho_so')}
              error={errors.ten_ho_so?.message}
            />
            <Controller
              name="id_phong_ban"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('hoSo.form.phongQuanLy')}
                  placeholder={t('hoSo.form.phongQuanLyPlaceholder')}
                  options={phongBanOptions}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<Building2 size={14} />}
                />
              )}
            />
            <Input
              label={t('hoSo.form.thoiHanLuuTru')}
              type="date"
              icon={<Calendar size={14} />}
              {...register('thoi_han_luu_tru')}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t('hoSo.form.status')}</label>
              <StatusToggle
                value={trangThai}
                onChange={(v) => setValue('trang_thai', v, { shouldValidate: true })}
                activeLabel={t('common.activeStatus')}
                inactiveLabel={t('common.inactiveStatus')}
                icon={<Power size={14} />}
              />
            </div>
          </FormGrid>
          <Textarea
            label={t('hoSo.form.moTa')}
            placeholder={t('hoSo.form.moTaPlaceholder')}
            rows={3}
            {...register('mo_ta')}
            error={errors.mo_ta?.message}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default HoSoForm;
