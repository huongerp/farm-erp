import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Target, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import { Controller } from 'react-hook-form';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { missionSchema, type MissionFormValues } from '../core/schema';
import type { DeptMission } from '../core/types';
import { useCreateMission, useUpdateMission } from '../hooks/use-chuc-nang-nhiem-vu';
import Combobox from '../../../../components/ui/Combobox';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';

const DEFAULT_VALUES: MissionFormValues = {
  id_phong_ban: '',
  noi_dung: '',
  thu_tu: 0,
  trang_thai: 1,
};

interface Props {
  initialData?: DeptMission | null;
  defaultIdPhongBan?: string | null;
  onClose: () => void;
}

const MissionForm: React.FC<Props> = ({ initialData, defaultIdPhongBan, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateMission(onClose);
  const updateMutation = useUpdateMission(onClose);
  const { data: departments = [] } = useDepartments();

  const departmentOptions = departments.map((d) => ({
    label: d.ten_phong_ban,
    value: d.id,
    subLabel: d.ma_phong_ban,
  }));

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id_phong_ban: initialData.id_phong_ban,
        noi_dung: initialData.noi_dung,
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

  const onSubmit: SubmitHandler<MissionFormValues> = (data) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('chucNangNhiemVu.editMission') : t('chucNangNhiemVu.addMission')}
      icon={<Target size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="mission-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('chucNangNhiemVu.form.save')}
          createLabel={t('chucNangNhiemVu.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="mission-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('chucNangNhiemVu.mission')} icon={<Target size={14} />} variant="primary">
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
                />
              )}
            />
            <Textarea
              label={t('chucNangNhiemVu.form.missionContent')}
              placeholder={t('chucNangNhiemVu.missionPlaceholder')}
              {...register('noi_dung')}
              error={errors.noi_dung?.message}
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

export default MissionForm;
