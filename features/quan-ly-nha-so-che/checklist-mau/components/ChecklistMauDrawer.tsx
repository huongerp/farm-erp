import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck, Hash, ListOrdered, Printer } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import { cn } from '../../../../lib/utils';
import type { Position } from '../../../he-thong/chuc-vu/core/types';
import type { Department } from '../../../he-thong/phong-ban/core/types';
import { usePositions } from '../../../he-thong/chuc-vu/hooks/use-chuc-vu';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { LOAI_MAU_CL, type MauChecklist } from '../core/types';
import { checklistMauFormSchema, type ChecklistMauFormValues } from '../core/schema';
import { useCreateMau, useUpdateMau } from '../hooks/use-checklist-mau';
import MucHangMucEditor from './MucHangMucEditor';

interface Props {
  initialData?: MauChecklist | null;
  onClose: () => void;
}

function toForm(d: MauChecklist): ChecklistMauFormValues {
  return {
    ma: d.ma ?? '',
    ten: d.ten,
    mo_ta: d.mo_ta ?? '',
    loai: d.loai,
    ten_ben_thuc_hien: d.ten_ben_thuc_hien ?? '',
    ten_ben_kiem_tra: d.ten_ben_kiem_tra ?? '',
    chuc_vu_thuc_hien_ids: d.chuc_vu_thuc_hien_ids,
    chuc_vu_kiem_tra_ids: d.chuc_vu_kiem_tra_ids,
    co_ket_luan_van_hanh: d.co_ket_luan_van_hanh,
    ghi_chu_cuoi: d.ghi_chu_cuoi ?? '',
    dang_dung: d.dang_dung,
    thu_tu: d.thu_tu,
  };
}

const DEFAULT: ChecklistMauFormValues = {
  ma: '',
  ten: '',
  mo_ta: '',
  loai: 'ban_giao',
  ten_ben_thuc_hien: '',
  ten_ben_kiem_tra: '',
  chuc_vu_thuc_hien_ids: [],
  chuc_vu_kiem_tra_ids: [],
  co_ket_luan_van_hanh: false,
  ghi_chu_cuoi: '',
  dang_dung: true,
  thu_tu: 0,
};

/** Chọn nhiều chức vụ, nhóm theo phòng ban (kèm nút chọn tất cả theo nhóm). */
const ChucVuMultiSelect: React.FC<{
  value: string[];
  onChange: (v: string[]) => void;
  positions: Position[];
  departments: Department[];
}> = ({ value, onChange, positions, departments }) => {
  const { t } = useTranslation();

  const groups = useMemo(() => {
    const byDept = new Map<string | null, Position[]>();
    for (const p of positions) {
      const key = p.phong_ban_id ?? null;
      const arr = byDept.get(key) ?? [];
      arr.push(p);
      byDept.set(key, arr);
    }
    const result: { key: string | null; label: string; items: Position[] }[] = [];
    for (const d of departments) {
      const items = byDept.get(d.id);
      if (items && items.length > 0) result.push({ key: d.id, label: d.ten_phong_ban, items });
      byDept.delete(d.id);
    }
    const khac = byDept.get(null);
    if (khac && khac.length > 0) result.push({ key: null, label: t('checklistMau.form.khac'), items: khac });
    return result;
  }, [positions, departments, t]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  const toggleAll = (ids: string[]) => {
    const allChecked = ids.every((id) => value.includes(id));
    const next = allChecked ? value.filter((x) => !ids.includes(x)) : Array.from(new Set([...value, ...ids]));
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
      {groups.map((g) => {
        const ids = g.items.map((p) => p.id);
        const allChecked = ids.length > 0 && ids.every((id) => value.includes(id));
        return (
          <div key={g.key ?? 'khac'} className="bg-card">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
              <span className="text-xs font-semibold text-muted-foreground">{g.label}</span>
              <button
                type="button"
                onClick={() => toggleAll(ids)}
                className="text-xs text-primary hover:underline"
              >
                {allChecked ? t('common.deselectAll') : t('common.selectAll')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-3 py-2">
              {g.items.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 text-sm py-1 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 accent-primary shrink-0"
                  />
                  <span className="truncate">{p.ten_chuc_vu}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ChecklistMauDrawer: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateMau(() => onClose());
  const updateMutation = useUpdateMau(onClose);
  const { data: positions = [] } = usePositions();
  const { data: departments = [] } = useDepartments();

  const defaultValues = useMemo<ChecklistMauFormValues>(
    () => (initialData ? toForm(initialData) : DEFAULT),
    [initialData]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ChecklistMauFormValues>({
    resolver: zodResolver(checklistMauFormSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (isDirty) return;
    reset(defaultValues);
  }, [defaultValues, reset, isDirty]);

  const onSubmit: SubmitHandler<ChecklistMauFormValues> = (values) => {
    if (isEdit && initialData) updateMutation.mutate({ id: initialData.id, data: values });
    else createMutation.mutate(values);
  };

  const pending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  const loaiOptions = LOAI_MAU_CL.map((v) => ({ value: v, label: t(`checklistMau.loai.${v}`) }));

  return (
    <GenericDrawer
      title={t(isEdit ? 'checklistMau.drawer.titleEdit' : 'checklistMau.drawer.titleCreate')}
      subtitle={isEdit ? initialData?.ma ?? initialData?.ten : t('checklistMau.drawer.subtitle')}
      icon={<ClipboardCheck className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="checklist-mau-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="checklist-mau-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection
          title={t('checklistMau.form.thongTin')}
          action={
            isEdit && initialData ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `/quan-ly-nha-so-che/checklist-mau/preview/${initialData.id}`,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
              >
                <Printer size={14} className="mr-1.5" />
                {t('checklistMau.hanhDong.inMauTrang')}
              </Button>
            ) : undefined
          }
        >
          <FormGrid cols={2}>
            <Controller
              name="ma"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  label={t('checklistMau.form.ma')}
                  placeholder="BM-"
                  icon={<Hash size={12} />}
                  autoCapitalize="characters"
                  error={errors.ma?.message}
                />
              )}
            />
            <Controller
              name="thu_tu"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  label={t('checklistMau.form.thuTu')}
                  icon={<ListOrdered size={12} />}
                  error={errors.thu_tu?.message}
                />
              )}
            />
            <div className="sm:col-span-2">
              <Controller
                name="ten"
                control={control}
                render={({ field }) => (
                  <Input {...field} label={t('checklistMau.form.ten')} required error={errors.ten?.message} />
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <Controller
                name="mo_ta"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    label={t('checklistMau.form.moTa')}
                    rows={2}
                    error={errors.mo_ta?.message}
                  />
                )}
              />
            </div>
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('checklistMau.form.loai')}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={loaiOptions}
                  error={errors.loai?.message}
                />
              )}
            />
            <Controller
              name="ten_ben_thuc_hien"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  label={t('checklistMau.form.tenBenThucHien')}
                  error={errors.ten_ben_thuc_hien?.message}
                />
              )}
            />
            <Controller
              name="ten_ben_kiem_tra"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  label={t('checklistMau.form.tenBenKiemTra')}
                  error={errors.ten_ben_kiem_tra?.message}
                />
              )}
            />
          </FormGrid>
          <p className="text-xs text-muted-foreground mt-2">{t('checklistMau.form.tenBenThucHienHint')}</p>
        </FormSection>

        <FormSection title={t('checklistMau.form.chucVuThucHien')}>
          <Controller
            name="chuc_vu_thuc_hien_ids"
            control={control}
            render={({ field }) => (
              <ChucVuMultiSelect
                value={field.value}
                onChange={field.onChange}
                positions={positions}
                departments={departments}
              />
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">{t('checklistMau.form.chucVuHint')}</p>
        </FormSection>

        <FormSection title={t('checklistMau.form.chucVuKiemTra')}>
          <Controller
            name="chuc_vu_kiem_tra_ids"
            control={control}
            render={({ field }) => (
              <ChucVuMultiSelect
                value={field.value}
                onChange={field.onChange}
                positions={positions}
                departments={departments}
              />
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">{t('checklistMau.form.chucVuHint')}</p>
        </FormSection>

        <FormSection title={t('checklistMau.form.tuyChon')}>
          <div className={cn('grid gap-3', isEdit ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
            <Controller
              name="co_ket_luan_van_hanh"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  checked={field.value}
                  onChange={field.onChange}
                  label={t('checklistMau.form.coKetLuanVanHanh')}
                  description={t('checklistMau.form.coKetLuanVanHanhDesc')}
                />
              )}
            />
            <Controller
              name="dang_dung"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  checked={field.value}
                  onChange={field.onChange}
                  label={t('checklistMau.form.dangDung')}
                  description={t('checklistMau.form.dangDungDesc')}
                />
              )}
            />
          </div>
          <div className="mt-3">
            <Controller
              name="ghi_chu_cuoi"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  label={t('checklistMau.form.ghiChuCuoi')}
                  rows={2}
                  error={errors.ghi_chu_cuoi?.message}
                />
              )}
            />
          </div>
        </FormSection>

        {isEdit && initialData && (
          <div className="space-y-2">
            <MucHangMucEditor idMau={initialData.id} canEdit />
          </div>
        )}
      </form>
    </GenericDrawer>
  );
};

export default ChecklistMauDrawer;
