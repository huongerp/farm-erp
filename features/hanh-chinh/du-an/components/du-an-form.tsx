import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderOpen, Hash, Type, Building2, Calendar, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import MultiSelect from '../../../../components/ui/MultiSelect';
import type { Option } from '../../../../components/ui/MultiSelect';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { DuAn } from '../core/types';
import { DuAnFormValues, duAnSchema } from '../core/schema';
import { useCreateDuAn, useUpdateDuAn } from '../hooks/use-du-an';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { formatDateForInput } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';

const DEFAULT_VALUES: DuAnFormValues = {
  ma_du_an: '',
  ten_du_an: '',
  id_phong_ban: [],
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  muc_tieu: '',
  mo_ta: '',
  trang_thai: 'Đang hoạt động',
};

interface Props {
  initialData?: DuAn | null;
  onClose: () => void;
}

const DuAnForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const { data: departments = [] } = useDepartments();
  const isEdit = !!initialData;
  const createMutation = useCreateDuAn(onClose);
  const updateMutation = useUpdateDuAn(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<DuAnFormValues>({
    resolver: zodResolver(duAnSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      const ids = Array.isArray(initialData.id_phong_ban) ? initialData.id_phong_ban : (initialData.id_phong_ban ? [initialData.id_phong_ban] : []);
      reset({
        ma_du_an: initialData.ma_du_an,
        ten_du_an: initialData.ten_du_an,
        id_phong_ban: ids,
        ngay_bat_dau: formatDateForInput(initialData.ngay_bat_dau),
        ngay_ket_thuc: formatDateForInput(initialData.ngay_ket_thuc),
        muc_tieu: initialData.muc_tieu ?? '',
        mo_ta: initialData.mo_ta ?? '',
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const phongBanOptions = useMemo<Option[]>(
    () => departments.map((d) => ({ label: d.ten_phong_ban, value: d.id })),
    [departments]
  );

  const onSubmit: SubmitHandler<DuAnFormValues> = (data) => {
    const sanitized: DuAnFormValues = {
      ...data,
      muc_tieu: data.muc_tieu?.trim() || '',
      mo_ta: data.mo_ta?.trim() || '',
    };
    const tenPhongBan = departments
      .filter((d) => data.id_phong_ban.includes(d.id))
      .map((d) => d.ten_phong_ban)
      .join(', ');
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized, ten_phong_ban: tenPhongBan || undefined });
    } else {
      createMutation.mutate({ data: sanitized, ten_phong_ban: tenPhongBan || undefined });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('duAn.form.editTitle') : t('duAn.form.createTitle')}
      icon={<FolderOpen size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="du-an-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('duAn.form.save')}
          createLabel={t('duAn.form.create')}
          createIcon={<FolderOpen className="mr-2 h-4 w-4" />}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="du-an-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('duAn.form.basicInfo')} icon={<FolderOpen size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('duAn.form.maDuAn')}
              placeholder={t('duAn.form.maDuAnPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma_du_an')}
              error={errors.ma_du_an?.message}
            />
            <Input
              label={t('duAn.form.tenDuAn')}
              placeholder={t('duAn.form.tenDuAnPlaceholder')}
              icon={<Type size={14} />}
              required
              {...register('ten_du_an')}
              error={errors.ten_du_an?.message}
            />
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                {t('duAn.form.phongBan')}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Controller
                name="id_phong_ban"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label=""
                    options={phongBanOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('duAn.form.phongBanPlaceholder')}
                    icon={Building2}
                    size="md"
                    className="w-full min-w-0"
                  />
                )}
              />
              {errors.id_phong_ban?.message && (
                <p className={cn('text-xs text-destructive')}>{errors.id_phong_ban.message}</p>
              )}
            </div>
            <Input
              type="date"
              label={t('duAn.form.ngayBatDau')}
              icon={<Calendar size={14} />}
              required
              {...register('ngay_bat_dau')}
              error={errors.ngay_bat_dau?.message}
            />
            <Input
              type="date"
              label={t('duAn.form.ngayKetThuc')}
              icon={<Calendar size={14} />}
              required
              {...register('ngay_ket_thuc')}
              error={errors.ngay_ket_thuc?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('duAn.form.mucTieu')}
                placeholder={t('duAn.form.mucTieuPlaceholder')}
                {...register('muc_tieu')}
                error={errors.muc_tieu?.message}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('duAn.form.moTa')}
                placeholder={t('duAn.form.moTaPlaceholder')}
                {...register('mo_ta')}
                error={errors.mo_ta?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('duAn.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  activeValue="Đang hoạt động"
                  inactiveValue="Ngừng hoạt động"
                  activeLabel={t('common.activeStatus')}
                  inactiveLabel={t('common.inactiveStatus')}
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

export default DuAnForm;
