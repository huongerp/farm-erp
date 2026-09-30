import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, MessageSquare, Clock, AlertTriangle, CalendarRange } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import RadioGroup from '../../../../components/ui/RadioGroup';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { formatDate } from '../../../../lib/utils';
import { useDebouncedValue } from '../../../../lib/hooks/use-debounced-value';
import { AdminFormRequest } from '../core/types';
import { AdminFormValues, adminFormSchema } from '../core/schema';
import { getAdminFormTypeLabel, getAdminFormTypeOptions } from '../../thiet-lap-cong-luong/core/constants';
import { ADMIN_FORM_SHIFTS, getAdminFormShiftLabel } from '../core/constants';
import {
  ADMIN_FORM_SESSIONS,
  chinhDenNgay,
  demChuNhat,
  kiemTraKhoang,
  khoangTuForm,
  laLoaiTheoKhoang,
  tinhSoNgay,
  type AdminFormSession,
} from '../core/khoang-nghi';
import { useCreateAdminForm, useUpdateAdminForm, usePhieuTrung } from '../hooks/use-admin-form';
import { moTaKhoangNhieuNgay } from '../utils/hien-thi-khoang';
import { useAuthStore } from '../../../../store/useStore';

/** Ngày hôm nay theo giờ máy (không dùng toISOString — lệch ngày trước 7h sáng giờ VN). */
function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const thuCua = (ngay: string) => THU[new Date(`${ngay}T00:00:00`).getDay()] ?? '';

const makeDefaults = (): AdminFormValues => {
  const today = getTodayDateString();
  return {
    ngay: today,
    den_ngay: today,
    tu_buoi: 'morning',
    den_buoi: 'afternoon',
    loai_phieu: 'leave_paid',
    ca: 'full',
    ly_do: '',
  };
};

interface Props {
  initialData?: AdminFormRequest | null;
  onClose: () => void;
}

const AdminFormForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const user = useAuthStore((s) => s.user);
  const createMutation = useCreateAdminForm(onClose);
  const updateMutation = useUpdateAdminForm(onClose);

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control, setValue, getValues } =
    useForm<AdminFormValues>({
      resolver: zodResolver(adminFormSchema),
      defaultValues: makeDefaults(),
    });

  useEffect(() => {
    if (initialData) {
      reset({
        ngay: initialData.ngay,
        den_ngay: initialData.den_ngay || initialData.ngay,
        tu_buoi: initialData.tu_buoi,
        den_buoi: initialData.den_buoi,
        loai_phieu: initialData.loai_phieu,
        ca: initialData.ca,
        ly_do: initialData.ly_do,
      });
    } else {
      reset(makeDefaults());
    }
  }, [initialData, reset]);

  const values = useWatch({ control }) as AdminFormValues;
  const theoKhoang = laLoaiTheoKhoang(values.loai_phieu);

  const typeOptions = useMemo(() => getAdminFormTypeOptions(t), [t]);
  const shiftOptions = useMemo(
    () => ADMIN_FORM_SHIFTS.map((s) => ({ value: s, label: getAdminFormShiftLabel(s, t) })),
    [t]
  );
  const sessionOptions = useMemo(
    () => ADMIN_FORM_SESSIONS.map((s) => ({ value: s, label: t(`adminForm.session.${s}`) })),
    [t]
  );

  // Khoảng sẽ lưu + số ngày — cùng hàm với lúc lưu và lúc tính định mức.
  const khoang = useMemo(() => khoangTuForm(values), [values]);
  const khoangHopLe = !!values.loai_phieu && kiemTraKhoang(khoang, theoKhoang) == null;
  const soNgay = khoangHopLe ? tinhSoNgay(khoang, theoKhoang) : 0;
  const soChuNhat = khoangHopLe && theoKhoang ? demChuNhat(khoang) : 0;

  // Cảnh báo trùng: chỉ nhắc, không chặn lưu.
  const khoangDebounced = useDebouncedValue(khoangHopLe ? khoang : null, 400);
  const nguoiTaoId = initialData?.nguoi_tao_id ?? user?.id ?? '';
  const { data: phieuTrung = [] } = usePhieuTrung(nguoiTaoId, khoangDebounced, initialData?.id ?? null);

  const onTuNgayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tuNgay = e.target.value;
    const denMoi = chinhDenNgay(tuNgay, getValues('den_ngay'));
    if (denMoi !== getValues('den_ngay')) setValue('den_ngay', denMoi, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit: SubmitHandler<AdminFormValues> = (data) => {
    if (!data.loai_phieu) return;
    const sanitized: AdminFormValues = {
      ...data,
      loai_phieu: data.loai_phieu as AdminFormValues['loai_phieu'],
      ly_do: data.ly_do.trim(),
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate({
        data: sanitized,
        creator: { id: user?.id ?? 'emp-000', name: user?.full_name ?? 'Lê Minh Công' },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const ngayReg = register('ngay');

  const renderSession = (name: 'tu_buoi' | 'den_buoi', label: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <RadioGroup
          label={label}
          options={sessionOptions}
          value={field.value}
          onChange={(v) => field.onChange(v as AdminFormSession)}
          layout="horizontal"
          size="sm"
        />
      )}
    />
  );

  return (
    <GenericDrawer
      isDirty={isDirty}
      title={isEdit ? t('adminForm.form.editTitle') : t('adminForm.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="admin-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('adminForm.form.save')}
          createLabel={t('adminForm.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="admin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('adminForm.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="loai_phieu"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('adminForm.form.type')}
                    options={typeOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('adminForm.form.typePlaceholder')}
                    icon={<FileText size={16} className="text-muted-foreground" />}
                    required
                  />
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('adminForm.form.timeSection')} icon={<CalendarRange size={14} />} variant="primary">
          {theoKhoang ? (
            <div className="space-y-4">
              <FormGrid cols={2}>
                <Input
                  type="date"
                  label={t('adminForm.form.fromDate')}
                  required
                  icon={<Calendar size={14} />}
                  {...ngayReg}
                  onChange={(e) => {
                    void ngayReg.onChange(e);
                    onTuNgayChange(e);
                  }}
                  error={errors.ngay?.message}
                />
                {renderSession('tu_buoi', t('adminForm.form.fromSession'))}
                <Input
                  type="date"
                  label={t('adminForm.form.toDate')}
                  required
                  min={values.ngay || undefined}
                  icon={<Calendar size={14} />}
                  {...register('den_ngay')}
                  error={errors.den_ngay?.message}
                />
                {renderSession('den_buoi', t('adminForm.form.toSession'))}
              </FormGrid>
            </div>
          ) : (
            <FormGrid cols={2}>
              <Input
                type="date"
                label={t('adminForm.form.date')}
                required
                icon={<Calendar size={14} />}
                {...register('ngay')}
                error={errors.ngay?.message}
              />
              <Controller
                name="ca"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('adminForm.form.shift')}
                    options={shiftOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('adminForm.form.shiftPlaceholder')}
                    icon={<Clock size={16} className="text-muted-foreground" />}
                    searchable={false}
                    required
                  />
                )}
              />
            </FormGrid>
          )}

          {khoangHopLe && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
              <span className="font-semibold">{t('adminForm.form.summary', { soNgay: soNgay.toLocaleString('vi-VN') })}</span>
              {theoKhoang && (
                <span className="text-muted-foreground">
                  {' · '}
                  {thuCua(khoang.tu_ngay)} {formatDate(khoang.tu_ngay)} ({t(`adminForm.session.${khoang.tu_buoi}`).toLocaleLowerCase('vi')})
                  {' → '}
                  {thuCua(khoang.den_ngay)} {formatDate(khoang.den_ngay)} ({t(`adminForm.session.${khoang.den_buoi}`).toLocaleLowerCase('vi')})
                  {soChuNhat > 0 && ` · ${t('adminForm.form.summarySundays', { count: soChuNhat })}`}
                </span>
              )}
            </div>
          )}

          {phieuTrung.length > 0 && khoangHopLe && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={14} /> {t('adminForm.form.overlapTitle')}
              </div>
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                {phieuTrung.map((p) => (
                  <li key={p.id}>
                    {getAdminFormTypeLabel(p.loai_phieu, t)}:{' '}
                    {moTaKhoangNhieuNgay(p, t) ?? `${formatDate(p.ngay)} (${getAdminFormShiftLabel(p.ca, t)})`}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs opacity-80">{t('adminForm.form.overlapHint')}</p>
            </div>
          )}
        </FormSection>

        <FormSection title={t('adminForm.form.reason')} icon={<MessageSquare size={14} />} variant="primary">
          <Textarea
            label={t('adminForm.form.reason')}
            placeholder={t('adminForm.form.reasonPlaceholder')}
            {...register('ly_do')}
            error={errors.ly_do?.message}
            icon={<MessageSquare size={14} />}
            required
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default AdminFormForm;
