import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Type, ListOrdered, Tag, User } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import MultiSelect from '../../../../components/ui/MultiSelect';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import { getDrawerWidthClass } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { CongViec } from '../core/types';
import { CongViecFormValues, congViecSchema } from '../core/schema';
import { getTrangThaiOptions, getUuTienOptions } from '../core/constants';
import { useCreateCongViec, useUpdateCongViec } from '../hooks/use-cong-viec';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { TRANG_THAI_NV } from '../../../../lib/constants';
import { useAuthStore } from '../../../../store/useStore';

const DEFAULT_VALUES: CongViecFormValues = {
  tieu_de: '',
  mo_ta: '',
  id_cha: null,
  trach_nhiem: null,
  nguoi_ho_tro: [],
  uu_tien: 'trung_binh',
  trang_thai: 'draft',
};

interface Props {
  initialData?: CongViec | null;
  parentId?: number | string | null;
  onClose: () => void;
  stackLevel?: number;
}

/** Lấy id nhân viên (number) từ user đăng nhập: khớp theo user.id hoặc user.email. */
function getCurrentUserEmployeeId(
  employees: { id: string; email?: string | null }[],
  userId: string | undefined,
  userEmail: string | undefined
): number | null {
  if (!employees.length) return null;
  const byId = userId ? employees.find((e) => String(e.id) === String(userId) || e.id === userId) : null;
  const emp = byId ?? (userEmail ? employees.find((e) => e.email && e.email.toLowerCase() === userEmail.toLowerCase()) : null);
  if (!emp) return null;
  const raw = emp.id;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isNaN(n) || n <= 0 ? null : n;
}

const CongViecForm: React.FC<Props> = ({ initialData, parentId, onClose, stackLevel = 0 }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: employees = [] } = useEmployeesRefQuery();
  const isEdit = !!initialData;
  const createMutation = useCreateCongViec(onClose);
  const updateMutation = useUpdateCongViec(onClose);

  const currentUserEmployeeId = useMemo(
    () => getCurrentUserEmployeeId(employees, user?.id, user?.email),
    [employees, user?.id, user?.email]
  );

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<CongViecFormValues>({
    resolver: zodResolver(congViecSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        tieu_de: initialData.tieu_de,
        mo_ta: initialData.mo_ta ?? '',
        id_cha: initialData.id_cha,
        trach_nhiem: initialData.trach_nhiem ?? null,
        nguoi_ho_tro: initialData.nguoi_ho_tro ?? [],
        uu_tien: initialData.uu_tien,
        trang_thai: initialData.trang_thai,
      });
    } else if (parentId != null && parentId !== '') {
      reset({
        ...DEFAULT_VALUES,
        id_cha: typeof parentId === 'string' ? Number(parentId) : parentId,
        trach_nhiem: currentUserEmployeeId ?? null,
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        trach_nhiem: currentUserEmployeeId ?? null,
      });
    }
  }, [initialData, parentId, reset, currentUserEmployeeId]);

  const trangThaiOptions = useMemo(() => getTrangThaiOptions(t), [t]);
  const uuTienOptions = useMemo(() => getUuTienOptions(t), [t]);
  const employeeOptions = useMemo(() => {
    return employees
      .filter((e) => e.trang_thai === TRANG_THAI_NV.DANG_LAM_VIEC)
      .slice(0, 300)
      .map((e) => {
        const numId = typeof e.id === 'number' ? e.id : parseInt(String(e.id).replace(/\D/g, ''), 10) || 0;
        const label = e.ho_ten ? `${e.ho_ten}${e.ma_nhan_vien ? ` (${e.ma_nhan_vien})` : ''}` : e.ma_nhan_vien || String(e.id);
        return { label, value: numId };
      })
      .filter((o) => o.value > 0);
  }, [employees]);
  const employeeOptionsForSelect = useMemo(
    () => employeeOptions.map((o) => ({ label: o.label, value: String(o.value) })),
    [employeeOptions]
  );

  const onSubmit: SubmitHandler<CongViecFormValues> = (data) => {
    const sanitized: CongViecFormValues = {
      ...data,
      id_cha: data.id_cha ?? null,
      trach_nhiem: data.trach_nhiem ?? null,
      nguoi_ho_tro: Array.isArray(data.nguoi_ho_tro) ? data.nguoi_ho_tro : [],
      mo_ta: data.mo_ta?.trim() || '',
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const drawerWidthClass = stackLevel > 0 ? getDrawerWidthClass(stackLevel) : DRAWER_WIDTH_FORM;

  return (
    <GenericDrawer
      title={isEdit ? t('congViec.form.editTitle') : t('congViec.form.createTitle')}
      subtitle={isEdit && initialData ? initialData.tieu_de : t('congViec.form.createSubtitle')}
      icon={<ClipboardList size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="cong-viec-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('congViec.form.save')}
          createLabel={t('congViec.form.create')}
        />
      }
      maxWidthClass={drawerWidthClass}
      stackLevel={stackLevel}
    >
      <form id="cong-viec-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('congViec.form.basicInfo')} icon={<ClipboardList size={14} />}>
          <FormGrid cols={2}>
            <Input
              label={t('congViec.form.tieuDe')}
              placeholder={t('congViec.form.tieuDePlaceholder')}
              icon={<Type size={14} />}
              required
              {...register('tieu_de')}
              error={errors.tieu_de?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('congViec.form.moTa')}
                placeholder={t('congViec.form.moTaPlaceholder')}
                {...register('mo_ta')}
                error={errors.mo_ta?.message}
              />
            </div>
            <Controller
              name="trach_nhiem"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('congViec.form.trachNhiem')}
                  options={[{ label: '—', value: '' }, ...employeeOptions.map((o) => ({ label: o.label, value: o.value }))]}
                  value={field.value != null ? field.value : ''}
                  onChange={(v) => field.onChange(v === '' || v == null ? null : Number(v))}
                  placeholder={t('congViec.form.trachNhiemPlaceholder')}
                  icon={<User size={16} className="text-muted-foreground" />}
                  required
                  error={errors.trach_nhiem?.message}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="nguoi_ho_tro"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label={t('congViec.form.nguoiHoTro')}
                    options={employeeOptionsForSelect}
                    value={(field.value ?? []).map(String)}
                    onChange={(v) => field.onChange(v.map((x) => Number(x)).filter((n) => !Number.isNaN(n)))}
                    placeholder={t('congViec.form.nguoiHoTroPlaceholder')}
                    icon={User}
                  />
                )}
              />
            </div>
            <Controller
              name="uu_tien"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('congViec.form.uuTien')}
                  options={uuTienOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('congViec.form.uuTienPlaceholder')}
                  icon={<ListOrdered size={16} className="text-muted-foreground" />}
                  required
                />
              )}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('congViec.form.trangThai')}
                  options={trangThaiOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('congViec.form.trangThaiPlaceholder')}
                  icon={<Tag size={16} className="text-muted-foreground" />}
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

export default CongViecForm;
