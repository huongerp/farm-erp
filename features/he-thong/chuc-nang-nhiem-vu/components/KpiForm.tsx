import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Target, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import StatusToggle from '../../../../components/ui/StatusToggle';
import Select from '../../../../components/ui/Select';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { kpiIndicatorSchema, type KpiIndicatorFormValues } from '../core/schema';
import type { KpiIndicator } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useCreateKpiIndicator, useUpdateKpiIndicator } from '../hooks/use-kpi';
import Combobox from '../../../../components/ui/Combobox';
import { useTasks } from '../hooks/use-chuc-nang-nhiem-vu';

const DEFAULT_VALUES: KpiIndicatorFormValues = {
  id_nhiem_vu: '',
  ten_chi_so: '',
  don_vi: '',
  chi_tieu_nguong: '',
  chu_ky_danh_gia: 'month',
  thu_tu: 0,
  trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
};

interface Props {
  initialData?: KpiIndicator | null;
  defaultIdNhiemVu?: string | null;
  onClose: () => void;
}

const KpiForm: React.FC<Props> = ({ initialData, defaultIdNhiemVu, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateKpiIndicator(onClose);
  const updateMutation = useUpdateKpiIndicator(onClose);
  const { data: tasks = [] } = useTasks();

  const taskOptions = tasks.map((task) => ({
    label: `${task.ten_nhiem_vu} (${task.ten_chuc_nang || ''})`,
    value: task.id,
    subLabel: task.ma_nhiem_vu,
  }));

  const cycleOptions = [
    { value: 'month', label: t('chucNangNhiemVu.form.cycleMonth') },
    { value: 'quarter', label: t('chucNangNhiemVu.form.cycleQuarter') },
    { value: 'year', label: t('chucNangNhiemVu.form.cycleYear') },
  ];

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<KpiIndicatorFormValues>({
    resolver: zodResolver(kpiIndicatorSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id_nhiem_vu: initialData.id_nhiem_vu,
        ten_chi_so: initialData.ten_chi_so,
        don_vi: initialData.don_vi,
        chi_tieu_nguong: initialData.chi_tieu_nguong,
        chu_ky_danh_gia: initialData.chu_ky_danh_gia,
        thu_tu: initialData.thu_tu,
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        id_nhiem_vu: defaultIdNhiemVu || (taskOptions[0]?.value as string) || '',
      });
    }
  }, [initialData, defaultIdNhiemVu, reset, taskOptions.length]);

  const onSubmit: SubmitHandler<KpiIndicatorFormValues> = (data) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('chucNangNhiemVu.editKpi') : t('chucNangNhiemVu.addKpi')}
      icon={<Target size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="kpi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('chucNangNhiemVu.form.save')}
          createLabel={t('chucNangNhiemVu.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="kpi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('chucNangNhiemVu.kpiList')} icon={<Target size={14} />} variant="primary">
          <div className="space-y-4">
            <Controller
              name="id_nhiem_vu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('chucNangNhiemVu.form.task')}
                  options={taskOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('chucNangNhiemVu.form.taskPlaceholder')}
                  error={errors.id_nhiem_vu?.message}
                  disabled={isEdit}
                />
              )}
            />
            <Input
              label={t('chucNangNhiemVu.form.kpiName')}
              placeholder="VD: Tỷ lệ hoàn thành đúng hạn"
              {...register('ten_chi_so')}
              error={errors.ten_chi_so?.message}
            />
            <Input
              label={t('chucNangNhiemVu.form.unit')}
              placeholder={t('chucNangNhiemVu.form.unitPlaceholder')}
              {...register('don_vi')}
              error={errors.don_vi?.message}
            />
            <Input
              label={t('chucNangNhiemVu.form.target')}
              placeholder={t('chucNangNhiemVu.form.targetPlaceholder')}
              {...register('chi_tieu_nguong')}
              error={errors.chi_tieu_nguong?.message}
            />
            <Controller
              name="chu_ky_danh_gia"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('chucNangNhiemVu.form.cycle')}
                  options={cycleOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value as 'month' | 'quarter' | 'year')}
                  error={errors.chu_ky_danh_gia?.message}
                />
              )}
            />
            <Input
              label={t('chucNangNhiemVu.form.order')}
              type="number"
              min={0}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('chucNangNhiemVu.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<Power size={12} />}
                />
              )}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default KpiForm;
