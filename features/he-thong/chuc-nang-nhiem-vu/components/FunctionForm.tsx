import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { functionSchema, type FunctionFormValues } from '../core/schema';
import type { DeptFunction } from '../core/types';
import { useCreateFunction, useUpdateFunction } from '../hooks/use-chuc-nang-nhiem-vu';
import Combobox from '../../../../components/ui/Combobox';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';

const DEFAULT_VALUES: FunctionFormValues = {
  id_phong_ban: '',
  ma_chuc_nang: '',
  ten_chuc_nang: '',
  mo_ta: '',
  thu_tu: 0,
  trang_thai: 1,
};

interface Props {
  initialData?: DeptFunction | null;
  defaultIdPhongBan?: string | null;
  onClose: () => void;
}

const FunctionForm: React.FC<Props> = ({ initialData, defaultIdPhongBan, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateFunction(onClose);
  const updateMutation = useUpdateFunction(onClose);
  const { data: departments = [] } = useDepartments();

  const departmentOptions = departments.map((d) => ({
    label: d.ten_phong_ban,
    value: d.id,
    subLabel: d.ma_phong_ban,
  }));

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<FunctionFormValues>({
    resolver: zodResolver(functionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id_phong_ban: initialData.id_phong_ban,
        ma_chuc_nang: initialData.ma_chuc_nang,
        ten_chuc_nang: initialData.ten_chuc_nang,
        mo_ta: initialData.mo_ta ?? '',
        thu_tu: initialData.thu_tu,
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        id_phong_ban: defaultIdPhongBan || '',
      });
    }
  }, [initialData, defaultIdPhongBan, reset]);

  const onSubmit: SubmitHandler<FunctionFormValues> = (data) => {
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
      title={isEdit ? t('chucNangNhiemVu.editFunction') : t('chucNangNhiemVu.addFunction')}
      icon={<Layers size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="function-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('chucNangNhiemVu.form.save')}
          createLabel={t('chucNangNhiemVu.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="function-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('chucNangNhiemVu.functions')} icon={<Layers size={14} />} variant="primary">
          <div className="space-y-4">
            <Controller
              name="id_phong_ban"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('chucNangNhiemVu.selectDepartment')}
                  options={departmentOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('chucNangNhiemVu.selectDepartmentPlaceholder')}
                  error={errors.id_phong_ban?.message}
                  disabled={isEdit}
                  required
                />
              )}
            />
            <Input
              label={t('chucNangNhiemVu.form.functionCode')}
              placeholder="VD: CN_DEV"
              {...register('ma_chuc_nang')}
              error={errors.ma_chuc_nang?.message}
              required
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_chuc_nang').onChange(e);
              }}
            />
            <Input
              label={t('chucNangNhiemVu.form.functionName')}
              placeholder="VD: Phát triển phần mềm"
              {...register('ten_chuc_nang')}
              error={errors.ten_chuc_nang?.message}
              required
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

export default FunctionForm;
