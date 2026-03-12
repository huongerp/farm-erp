import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, Warehouse, User, Package, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { PhieuKiemKeFormValues, phieuKiemKeSchema } from '../core/schema';
import type { PhieuKiemKe } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { Employee } from '../../../he-thong/nhan-vien/core/types';
import { TRANG_THAI_KIEM_KE } from '../core/constants';
import { useAuthStore } from '../../../../store/useStore';
import { useCreatePhieuKiemKe, useUpdatePhieuKiemKe, useNextSoPhieuPhieuKiemKe } from '../hooks/use-phieu-kiem-ke';
import { useHangHoaList } from '../../danh-sach-hang-hoa/hooks/use-hang-hoa';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

function formatSoPhieuKiemKe(seq: number): string {
  const y = new Date().getFullYear();
  return `KK-${y}-${String(seq).padStart(4, '0')}`;
}

interface Props {
  khoList: Kho[];
  employees: Employee[];
  initialData?: PhieuKiemKe | null;
  onClose: () => void;
}

const PhieuKiemKeForm: React.FC<Props> = ({ khoList, employees, initialData, onClose }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData;
  const createMutation = useCreatePhieuKiemKe(onClose);
  const updateMutation = useUpdatePhieuKiemKe(onClose);
  const nextSoPhieu = useNextSoPhieuPhieuKiemKe();
  const { data: hangHoaList = [] } = useHangHoaList();

  const khoOptions = useMemo(() => khoList.map((k) => ({ value: k.id, label: k.ten_kho })), [khoList]);
  const performerOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}`,
        subLabel: e.ho_ten,
      })),
    [employees]
  );
  const hangHoaOptions = useMemo(
    () =>
      hangHoaList.map((h) => ({
        value: h.id,
        label: `${h.ma_hang ?? h.ma_hang_hoa ?? ''} - ${h.ten_hang_hoa ?? h.ten_hang ?? ''}`,
        subLabel: h.don_vi_tinh ? `${t('phieuKiemKe.form.unit')}: ${h.don_vi_tinh}` : undefined,
      })),
    [hangHoaList, t]
  );

  const defaultValues: Partial<PhieuKiemKeFormValues> = {
    so_phieu: '',
    ngay: new Date().toISOString().slice(0, 10),
    id_kho: '',
    id_nguoi_thuc_hien: '',
    id_nguoi_duyet: null,
    ghi_chu: '',
    trang_thai: 'Nháp',
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors }, reset, control, setValue } = useForm<PhieuKiemKeFormValues>({
    resolver: zodResolver(phieuKiemKeSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });

  useEffect(() => {
    if (initialData) {
      reset({
        so_phieu: initialData.so_phieu,
        ngay: initialData.ngay,
        id_kho: initialData.id_kho,
        id_nguoi_thuc_hien: initialData.id_nguoi_thuc_hien,
        id_nguoi_duyet: initialData.id_nguoi_duyet ?? null,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai as PhieuKiemKeFormValues['trang_thai'],
        chi_tiet: (initialData.chi_tiet ?? []).map((ct) => ({
          id_hang_hoa: ct.id_hang_hoa,
          so_luong_so: ct.so_luong_so,
          so_luong_thuc_te: ct.so_luong_thuc_te ?? null,
          don_vi_tinh: ct.don_vi_tinh ?? '',
          ghi_chu: ct.ghi_chu ?? '',
        })),
      });
    } else {
      reset({ ...defaultValues });
      if (user?.id) setValue('id_nguoi_thuc_hien', user.id);
      nextSoPhieu.mutate(undefined, {
        onSuccess: (seq) => setValue('so_phieu', formatSoPhieuKiemKe(seq)),
      });
    }
  }, [initialData, reset, user?.id, setValue]);

  const onSubmit: SubmitHandler<PhieuKiemKeFormValues> = async (data) => {
    const validChiTiet = (data.chi_tiet ?? []).filter((c) => c.id_hang_hoa?.trim());
    if (validChiTiet.length === 0) return;
    let soPhieu = data.so_phieu?.trim() ?? '';
    if (!isEdit && !soPhieu) {
      try {
        const seq = await nextSoPhieu.mutateAsync();
        soPhieu = formatSoPhieuKiemKe(seq);
      } catch {
        return;
      }
    }
    const sanitized: PhieuKiemKeFormValues = {
      ...data,
      so_phieu: soPhieu || (data.so_phieu?.trim() ?? ''),
      id_nguoi_duyet: isEdit && initialData?.id_nguoi_duyet ? initialData.id_nguoi_duyet : null,
      ghi_chu: data.ghi_chu?.trim() || undefined,
      chi_tiet: validChiTiet.map((c) => ({
        id_hang_hoa: c.id_hang_hoa.trim(),
        so_luong_so: Number(c.so_luong_so) || 0,
        so_luong_thuc_te: c.so_luong_thuc_te != null && !Number.isNaN(Number(c.so_luong_thuc_te)) ? Number(c.so_luong_thuc_te) : null,
        don_vi_tinh: c.don_vi_tinh?.trim() || undefined,
        ghi_chu: c.ghi_chu?.trim() || undefined,
      })),
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_KIEM_KE.map((s) => ({
        value: s,
        label:
          s === 'Nháp'
            ? t('phieuKiemKe.status.nhap')
            : s === 'Đang kiểm'
              ? t('phieuKiemKe.status.dangKiem')
              : s === 'Chờ duyệt'
                ? t('phieuKiemKe.status.choDuyet')
                : s === 'Hoàn thành'
                  ? t('phieuKiemKe.status.hoanThanh')
                  : s === 'Đã duyệt'
                    ? t('phieuKiemKe.status.daDuyet')
                    : s === 'Không duyệt'
                      ? t('phieuKiemKe.status.khongDuyet')
                      : s,
      })),
    [t]
  );

  return (
    <GenericDrawer
      title={isEdit ? t('phieuKiemKe.form.editTitle') : t('phieuKiemKe.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="phieu-kiem-ke-form"
          onCancel={onClose}
          isLoading={isLoading || nextSoPhieu.isPending}
          isEdit={isEdit}
          saveLabel={t('phieuKiemKe.form.save')}
          createLabel={t('phieuKiemKe.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="phieu-kiem-ke-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('phieuKiemKe.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('phieuKiemKe.form.code')}
              placeholder={t('phieuKiemKe.form.codePlaceholder')}
              icon={<FileText size={12} />}
              required
              {...register('so_phieu')}
              error={errors.so_phieu?.message}
            />
            <Input
              label={t('phieuKiemKe.form.date')}
              type="date"
              icon={<Calendar size={12} />}
              required
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <Controller
              name="id_kho"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('phieuKiemKe.form.warehouse')}
                  options={khoOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('phieuKiemKe.form.warehousePlaceholder')}
                  searchPlaceholder={t('phieuKiemKe.form.itemSearchPlaceholder')}
                  icon={<Warehouse size={12} />}
                  required
                  error={errors.id_kho?.message}
                  searchable
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="id_nguoi_thuc_hien"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('phieuKiemKe.form.performer')}
                  options={performerOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('phieuKiemKe.form.performerPlaceholder')}
                  searchPlaceholder={t('phieuKiemKe.form.itemSearchPlaceholder')}
                  icon={<User size={12} />}
                  required
                  error={errors.id_nguoi_thuc_hien?.message}
                  searchable
                  dropdownInPortal
                />
              )}
            />
            {isEdit && (
              <Controller
                name="trang_thai"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('phieuKiemKe.form.status')}
                    options={statusOptions}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v ?? 'Nháp')}
                    placeholder={t('phieuKiemKe.form.status')}
                    searchable
                    dropdownInPortal
                  />
                )}
              />
            )}
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('phieuKiemKe.form.notes')}
                placeholder={t('phieuKiemKe.form.notesPlaceholder')}
                disabled={false}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
                rows={2}
              />
            </div>
          </FormGrid>
        </FormSection>

        <GenericSubTableSection
          title={t('phieuKiemKe.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('phieuKiemKe.form.addRow')}
          onAdd={() => append({ id_hang_hoa: '', so_luong_so: 0, so_luong_thuc_te: null, don_vi_tinh: '', ghi_chu: '' })}
          emptyTitle={t('phieuKiemKe.form.noItems')}
          emptyDescription={t('phieuKiemKe.form.noItemsHint')}
          maxTableHeight="320px"
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-8">#</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[180px]">{t('phieuKiemKe.form.item')}</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground w-28">{t('phieuKiemKe.form.soLuongSo')}</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground w-28">{t('phieuKiemKe.form.soLuongThucTe')}</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">{t('phieuKiemKe.form.unit')}</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-24"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => (
                <tr key={field.id} className="border-b border-border/60">
                  <td className="py-1.5 px-2 text-muted-foreground">{idx + 1}</td>
                  <td className="py-1.5 px-2">
                    <Controller
                      name={`chi_tiet.${idx}.id_hang_hoa`}
                      control={control}
                      render={({ field: f }) => (
                        <Combobox
                          options={hangHoaOptions}
                          value={f.value || null}
                          onChange={(v) => {
                            f.onChange(v ?? '');
                            const h = hangHoaList.find((x) => x.id === v);
                            if (h) setValue(`chi_tiet.${idx}.don_vi_tinh`, h.don_vi_tinh ?? '');
                          }}
                          placeholder={t('phieuKiemKe.form.itemPlaceholder')}
                          searchable
                          dropdownInPortal
                          className="min-w-[160px]"
                        />
                      )}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <Input type="number" step="any" min={0} className="text-right" {...register(`chi_tiet.${idx}.so_luong_so`)} />
                  </td>
                  <td className="py-1.5 px-2">
                    <Input type="number" step="any" min={0} className="text-right" placeholder="—" {...register(`chi_tiet.${idx}.so_luong_thuc_te`)} />
                  </td>
                  <td className="py-1.5 px-2">
                    <Input className="text-sm" {...register(`chi_tiet.${idx}.don_vi_tinh`)} />
                  </td>
                  <td className="py-1.5 px-2">
                    <button type="button" onClick={() => remove(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GenericSubTableSection>
      </form>
    </GenericDrawer>
  );
};

export default PhieuKiemKeForm;
