import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, User, Hash, Calendar, ListOrdered } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { DiemCongTruRecord } from '../core/types';
import { DiemCongTruFormValues, diemCongTruSchema } from '../core/schema';
import { getDiemCongTruLoaiOptions } from '../core/constants';
import { useCreateDiemCongTruRecord, useUpdateDiemCongTruRecord } from '../hooks/use-diem-cong-tru';
import { usePayrollPointGroupsForDiemCongTru, useEmployeesForDiemCongTru } from '../hooks/use-diem-cong-tru';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const DEFAULT_VALUES: DiemCongTruFormValues = {
  id_nhan_vien: '',
  nam: currentYear,
  thang: currentMonth,
  loai: 'cong',
  id_hang_muc: '',
  diem: 1,
  mo_ta: '',
};

interface Props {
  initialData?: DiemCongTruRecord | null;
  onClose: () => void;
}

const DiemCongTruForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDiemCongTruRecord(onClose);
  const updateMutation = useUpdateDiemCongTruRecord(onClose);
  const { data: pointGroups = [] } = usePayrollPointGroupsForDiemCongTru();
  const { data: employees = [] } = useEmployeesForDiemCongTru();

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<DiemCongTruFormValues>({
    resolver: zodResolver(diemCongTruSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const selectedLoai = useWatch({ control, name: 'loai', defaultValue: 'cong' });

  useEffect(() => {
    if (initialData) {
      reset({
        id_nhan_vien: initialData.id_nhan_vien,
        nam: initialData.nam,
        thang: initialData.thang,
        loai: initialData.loai,
        id_hang_muc: initialData.id_hang_muc,
        diem: initialData.diem,
        mo_ta: initialData.mo_ta ?? '',
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.trang_thai === 1)
        .map((e) => ({ value: e.id, label: `${e.ho_ten}${e.ma_nhan_vien ? ` (${e.ma_nhan_vien})` : ''}` })),
    [employees]
  );

  const categoryOptionsByLoai = useMemo(() => {
    const filtered = pointGroups.filter((g) => g.trang_thai === 1 && g.loai === selectedLoai);
    return filtered.map((g) => ({ value: g.id, label: `${g.ten} (${g.ma})` }));
  }, [pointGroups, selectedLoai]);

  const loaiOptions = useMemo(() => getDiemCongTruLoaiOptions(t), [t]);

  const onSubmit: SubmitHandler<DiemCongTruFormValues> = (data) => {
    const sanitized: DiemCongTruFormValues = {
      ...data,
      mo_ta: data.mo_ta?.trim() || undefined,
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
      title={isEdit ? t('diemCongTru.form.editTitle') : t('diemCongTru.form.createTitle')}
      icon={<Scale size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="diem-cong-tru-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('diemCongTru.form.save')}
          createLabel={t('diemCongTru.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="diem-cong-tru-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('diemCongTru.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="id_nhan_vien"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('diemCongTru.form.employee')}
                  options={employeeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('diemCongTru.form.employeePlaceholder')}
                  icon={<User size={16} className="text-muted-foreground" />}
                />
              )}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                min={2000}
                max={2100}
                label={t('diemCongTru.form.year')}
                placeholder={t('diemCongTru.form.yearPlaceholder')}
                icon={<Calendar size={14} />}
                {...register('nam')}
                error={errors.nam?.message}
              />
              <Input
                type="number"
                min={1}
                max={12}
                label={t('diemCongTru.form.month')}
                placeholder={t('diemCongTru.form.monthPlaceholder')}
                icon={<Hash size={14} />}
                {...register('thang')}
                error={errors.thang?.message}
              />
            </div>
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('diemCongTru.form.loai')}
                  options={loaiOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('diemCongTru.form.loaiPlaceholder')}
                  icon={<Scale size={16} className="text-muted-foreground" />}
                />
              )}
            />
            <Controller
              name="id_hang_muc"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('diemCongTru.form.category')}
                  options={categoryOptionsByLoai}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('diemCongTru.form.categoryPlaceholder')}
                  icon={<ListOrdered size={16} className="text-muted-foreground" />}
                />
              )}
            />
            <Input
              type="number"
              min={0}
              label={t('diemCongTru.form.diem')}
              placeholder={t('diemCongTru.form.diemPlaceholder')}
              icon={<Hash size={14} />}
              {...register('diem')}
              error={errors.diem?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('diemCongTru.form.moTa')}
                placeholder={t('diemCongTru.form.moTaPlaceholder')}
                {...register('mo_ta')}
                error={errors.mo_ta?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DiemCongTruForm;
