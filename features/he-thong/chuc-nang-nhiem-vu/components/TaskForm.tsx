import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { taskSchema, type TaskFormValues } from '../core/schema';
import type { Task } from '../core/types';
import { TASK_RESPONSIBLE_GROUP_CODES } from '../core/types';
import Select from '../../../../components/ui/Select';
import { useCreateTask, useUpdateTask } from '../hooks/use-chuc-nang-nhiem-vu';
import Combobox from '../../../../components/ui/Combobox';
import { useFunctionsByDepartment } from '../hooks/use-chuc-nang-nhiem-vu';

const DEFAULT_VALUES: TaskFormValues = {
  id_chuc_nang: '',
  ma_nhiem_vu: '',
  ten_nhiem_vu: '',
  mo_ta: '',
  nhom_chiu_trach_nhiem: null,
  thu_tu: 0,
  trang_thai: 1,
};

interface Props {
  initialData?: Task | null;
  idPhongBan: string | null;
  /** Khi thêm mới từ trong 1 chức năng: preset chức năng */
  defaultIdChucNang?: string | null;
  onClose: () => void;
}

const TaskForm: React.FC<Props> = ({ initialData, idPhongBan, defaultIdChucNang, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateTask(onClose);
  const updateMutation = useUpdateTask(onClose);
  const { data: functions = [] } = useFunctionsByDepartment(idPhongBan);

  const functionOptions = functions.map((f) => ({
    label: f.ten_chuc_nang,
    value: f.id,
    subLabel: f.ma_chuc_nang,
  }));

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id_chuc_nang: initialData.id_chuc_nang,
        ma_nhiem_vu: initialData.ma_nhiem_vu,
        ten_nhiem_vu: initialData.ten_nhiem_vu,
        mo_ta: initialData.mo_ta ?? '',
        nhom_chiu_trach_nhiem: initialData.nhom_chiu_trach_nhiem ?? null,
        thu_tu: initialData.thu_tu,
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        id_chuc_nang: (defaultIdChucNang || functionOptions[0]?.value) ?? '',
      });
    }
  }, [initialData, defaultIdChucNang, reset, functionOptions.length]);

  const onSubmit: SubmitHandler<TaskFormValues> = (data) => {
    const payload = { ...data, mo_ta: data.mo_ta || null };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('chucNangNhiemVu.editTask') : t('chucNangNhiemVu.addTask')}
      icon={<ClipboardList size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="task-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('chucNangNhiemVu.form.save')}
          createLabel={t('chucNangNhiemVu.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('chucNangNhiemVu.tasks')} icon={<ClipboardList size={14} />} variant="primary">
          <div className="space-y-4">
            <Controller
              name="id_chuc_nang"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('chucNangNhiemVu.form.function')}
                  options={functionOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('chucNangNhiemVu.form.functionPlaceholder')}
                  error={errors.id_chuc_nang?.message}
                  disabled={isEdit}
                  required
                />
              )}
            />
            <Input
              label={t('chucNangNhiemVu.form.taskCode')}
              placeholder="VD: NV_CODE"
              {...register('ma_nhiem_vu')}
              error={errors.ma_nhiem_vu?.message}
              required
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_nhiem_vu').onChange(e);
              }}
            />
            <Input
              label={t('chucNangNhiemVu.form.taskName')}
              placeholder="VD: Viết mã và code review"
              {...register('ten_nhiem_vu')}
              error={errors.ten_nhiem_vu?.message}
              required
            />
            <Controller
              name="nhom_chiu_trach_nhiem"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('chucNangNhiemVu.form.responsibleGroup')}
                  options={TASK_RESPONSIBLE_GROUP_CODES.map((code) => ({
                    value: code,
                    label: t(`chucNangNhiemVu.responsibleGroup.${code}`),
                  }))}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder={t('chucNangNhiemVu.form.responsibleGroupPlaceholder')}
                  error={errors.nhom_chiu_trach_nhiem?.message}
                />
              )}
            />
            <Textarea
              label={t('chucNangNhiemVu.form.description')}
              {...register('mo_ta')}
              error={errors.mo_ta?.message}
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

export default TaskForm;
