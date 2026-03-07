import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FileText, Calendar, Warehouse, User, UserCheck, Package, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Combobox from '../../../../components/ui/Combobox';
import { PhieuDeXuatVatTuFormValues, phieuDeXuatVatTuSchema } from '../core/schema';
import type { PhieuDeXuatVatTu } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import type { Employee } from '../../../he-thong/nhan-vien/core/types';
import { useCreatePhieuDeXuatVatTu, useUpdatePhieuDeXuatVatTu } from '../hooks/use-phieu-de-xuat-vat-tu';
import { useHangHoaList } from '../../danh-sach-hang-hoa/hooks/use-hang-hoa';
import { useCauHinhDeXuatVatTu, useGetNextSoPhieuAndIncrement } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/hooks/use-cau-hinh-de-xuat-vat-tu';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface Props {
  khoList: Kho[];
  employees: Employee[];
  initialData?: PhieuDeXuatVatTu | null;
  onClose: () => void;
  /** When false (e.g. approved and config disallows edit), form is read-only */
  canEdit?: boolean;
}

const PhieuDeXuatVatTuForm: React.FC<Props> = ({ khoList, employees, initialData, onClose, canEdit = true }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreatePhieuDeXuatVatTu(onClose);
  const updateMutation = useUpdatePhieuDeXuatVatTu(onClose);
  const { data: hangHoaList = [] } = useHangHoaList();
  const { data: config } = useCauHinhDeXuatVatTu();
  const getNextSoPhieu = useGetNextSoPhieuAndIncrement();
  const readOnly = isEdit && !canEdit;

  const khoOptions = useMemo(
    () => [
      { value: '', label: t('phieuDeXuatVatTu.form.placePlaceholder') },
      ...khoList.map((k) => ({ value: k.id, label: k.ten_kho })),
    ],
    [khoList, t]
  );

  const requesterOptions = useMemo(
    () => [
      { value: '', label: t('phieuDeXuatVatTu.form.requesterPlaceholder') },
      ...employees.map((e) => ({ value: e.id, label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}` })),
    ],
    [employees, t]
  );

  const approverOptions = useMemo(
    () => [
      { value: '', label: t('phieuDeXuatVatTu.form.approverPlaceholder') },
      ...employees.map((e) => ({ value: e.id, label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}` })),
    ],
    [employees, t]
  );

  const hangHoaComboboxOptions = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.trang_thai === 1)
        .map((h) => ({
          value: h.id,
          label: `${h.ma_hang} - ${h.ten_hang}`,
          subLabel: h.don_vi_tinh ? `${t('phieuDeXuatVatTu.form.unit')}: ${h.don_vi_tinh}` : undefined,
        })),
    [hangHoaList, t]
  );

  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoa> = {};
    hangHoaList.forEach((h) => {
      m[h.id] = h;
    });
    return m;
  }, [hangHoaList]);

  const defaultValues: Partial<PhieuDeXuatVatTuFormValues> = {
    so_phieu: '',
    ngay: '',
    ngay_can: '',
    id_noi_de_xuat: '',
    id_nguoi_de_xuat: '',
    id_nguoi_duyet: null,
    ghi_chu: '',
    trang_thai: 0,
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<PhieuDeXuatVatTuFormValues>({
    resolver: zodResolver(phieuDeXuatVatTuSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });
  const chiTietValues = watch('chi_tiet') ?? [];

  useEffect(() => {
    if (initialData) {
      reset({
        so_phieu: initialData.so_phieu,
        ngay: initialData.ngay,
        ngay_can: initialData.ngay_can,
        id_noi_de_xuat: initialData.id_noi_de_xuat,
        id_nguoi_de_xuat: initialData.id_nguoi_de_xuat,
        id_nguoi_duyet: initialData.id_nguoi_duyet ?? null,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
        chi_tiet: (initialData.chi_tiet ?? []).map((ct) => ({
          id_hang_hoa: ct.id_hang_hoa,
          so_luong: ct.so_luong,
          thong_so: ct.thong_so ?? '',
          ghi_chu: ct.ghi_chu ?? '',
        })),
      });
    } else if (config) {
      const today = new Date().toISOString().slice(0, 10);
      reset({
        ...defaultValues,
        so_phieu: config.tu_sinh_so_phieu ? '…' : '',
        ngay: today,
        ngay_can: addDays(today, config.so_ngay_mac_dinh_ngay_can ?? 0),
        trang_thai: config.trang_thai_mac_dinh ?? 0,
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, config, reset]);

  const onSubmit: SubmitHandler<PhieuDeXuatVatTuFormValues> = async (data) => {
    const validChiTiet = (data.chi_tiet ?? []).filter(
      (c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0
    );
    if (validChiTiet.length === 0) return;
    if (config?.ghi_chu_bat_buoc && !data.ghi_chu?.trim()) {
      toast.error(t('phieuDeXuatVatTu.form.notesRequired'));
      return;
    }
    const maxLines = config?.so_dong_toi_da ?? 0;
    if (maxLines > 0 && validChiTiet.length > maxLines) {
      toast.error(t('phieuDeXuatVatTu.form.maxLinesExceeded', { max: maxLines }));
      return;
    }
    let soPhieu = data.so_phieu?.trim() ?? '';
    if (!isEdit && config?.tu_sinh_so_phieu) {
      try {
        soPhieu = await getNextSoPhieu.mutateAsync();
        if (!soPhieu) soPhieu = data.so_phieu?.trim() ?? '';
      } catch {
        toast.error(t('phieuDeXuatVatTu.service.duplicateCode'));
        return;
      }
    }
    const sanitized: PhieuDeXuatVatTuFormValues = {
      ...data,
      so_phieu: soPhieu || (data.so_phieu?.trim() ?? ''),
      id_nguoi_duyet: data.id_nguoi_duyet === '' || data.id_nguoi_duyet === undefined ? null : data.id_nguoi_duyet,
      ghi_chu: data.ghi_chu?.trim() || undefined,
      chi_tiet: validChiTiet.map((c) => ({
        id_hang_hoa: c.id_hang_hoa.trim(),
        so_luong: Number(c.so_luong),
        thong_so: c.thong_so?.trim() || undefined,
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

  return (
    <GenericDrawer
      title={isEdit ? t('phieuDeXuatVatTu.form.editTitle') : t('phieuDeXuatVatTu.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        readOnly ? null : (
          <FormDrawerFooter
            formId="phieu-de-xuat-vat-tu-form"
            onCancel={onClose}
            isLoading={isLoading || getNextSoPhieu.isPending}
            isEdit={isEdit}
            saveLabel={t('phieuDeXuatVatTu.form.save')}
            createLabel={t('phieuDeXuatVatTu.form.create')}
          />
        )
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="phieu-de-xuat-vat-tu-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection title={t('phieuDeXuatVatTu.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('phieuDeXuatVatTu.form.code')}
              placeholder={
                !isEdit && config?.tu_sinh_so_phieu
                  ? t('phieuDeXuatVatTu.form.autoCodePlaceholder')
                  : t('phieuDeXuatVatTu.form.codePlaceholder')
              }
              icon={<FileText size={12} />}
              required={!config?.tu_sinh_so_phieu}
              disabled={(!isEdit && config?.tu_sinh_so_phieu) || readOnly}
              {...register('so_phieu')}
              error={errors.so_phieu?.message}
            />
            <Input
              label={t('phieuDeXuatVatTu.form.date')}
              type="date"
              icon={<Calendar size={12} />}
              required
              disabled={readOnly}
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <Input
              label={t('phieuDeXuatVatTu.form.requiredDate')}
              type="date"
              icon={<Calendar size={12} />}
              required
              disabled={readOnly}
              {...register('ngay_can')}
              error={errors.ngay_can?.message}
            />
            <Controller
              name="id_noi_de_xuat"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('phieuDeXuatVatTu.form.place')}
                  options={khoOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  icon={<Warehouse size={12} />}
                  required
                  disabled={readOnly}
                  error={errors.id_noi_de_xuat?.message}
                />
              )}
            />
            <Controller
              name="id_nguoi_de_xuat"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('phieuDeXuatVatTu.form.requester')}
                  options={requesterOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  icon={<User size={12} />}
                  required
                  disabled={readOnly}
                  error={errors.id_nguoi_de_xuat?.message}
                />
              )}
            />
            <Controller
              name="id_nguoi_duyet"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('phieuDeXuatVatTu.form.approver')}
                  options={approverOptions}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  onBlur={field.onBlur}
                  icon={<UserCheck size={12} />}
                  disabled={readOnly}
                  error={errors.id_nguoi_duyet?.message}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('phieuDeXuatVatTu.form.notes')}
                placeholder={t('phieuDeXuatVatTu.form.notesPlaceholder')}
                icon={<FileText size={12} />}
                disabled={readOnly}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
                rows={2}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="trang_thai"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('phieuDeXuatVatTu.form.status')}
                    options={[
                      { value: '0', label: t('phieuDeXuatVatTu.status.pending') },
                      { value: '1', label: t('phieuDeXuatVatTu.status.approved') },
                      { value: '2', label: t('phieuDeXuatVatTu.status.rejected') },
                    ]}
                    value={String(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    disabled={readOnly}
                  />
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        <GenericSubTableSection
          title={t('phieuDeXuatVatTu.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('phieuDeXuatVatTu.form.addRow')}
          onAdd={readOnly ? undefined : () => {
            const maxLines = config?.so_dong_toi_da ?? 0;
            if (maxLines > 0 && fields.length >= maxLines) return;
            append({ id_hang_hoa: '', so_luong: 0, thong_so: '', ghi_chu: '' });
          }}
          emptyTitle={t('phieuDeXuatVatTu.form.noItems')}
          emptyDescription={t('phieuDeXuatVatTu.form.noItemsHint')}
          maxTableHeight="320px"
        >
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">
                {t('phieuDeXuatVatTu.form.item')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[110px]">
                {t('phieuDeXuatVatTu.form.quantity')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[64px]">
                {t('phieuDeXuatVatTu.form.unit')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">
                {t('phieuDeXuatVatTu.form.specs')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">
                {t('phieuDeXuatVatTu.form.note')}
              </th>
              <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-16 bg-muted border-l border-border">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  {t('phieuDeXuatVatTu.form.noItems')}
                </td>
              </tr>
            ) : (
              fields.map((field, index) => {
                const idHangHoa = chiTietValues[index]?.id_hang_hoa ?? '';
                const donVi = idHangHoa ? (hangHoaMap[idHangHoa]?.don_vi_tinh ?? '—') : '—';
                return (
                  <tr key={field.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                    <td className="px-4 py-2.5 min-w-0 align-top">
                      <Controller
                        name={`chi_tiet.${index}.id_hang_hoa`}
                        control={control}
                        render={({ field: f }) => (
                          <Combobox
                            options={hangHoaComboboxOptions}
                            value={f.value || null}
                            onChange={(v) => f.onChange(v ?? '')}
                            placeholder={t('phieuDeXuatVatTu.form.itemPlaceholder')}
                            searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
                            searchable
                            triggerClassName="h-9 text-sm border-border rounded-md"
                            dropdownInPortal
                          />
                        )}
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px] align-top">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        className="h-9 text-sm border-border w-full min-w-[6rem] max-w-[10rem] tabular-nums"
                        {...register(`chi_tiet.${index}.so_luong`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{donVi}</td>
                    <td className="px-4 py-2.5 min-w-0 align-top">
                      <Input
                        placeholder={t('phieuDeXuatVatTu.form.specsPlaceholder')}
                        className="h-9 text-sm border-border w-full min-w-0"
                        disabled={readOnly}
                        {...register(`chi_tiet.${index}.thong_so`)}
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-0 align-top">
                      <Input
                        placeholder={t('phieuDeXuatVatTu.form.notePlaceholder')}
                        className="h-9 text-sm border-border w-full min-w-0"
                        disabled={readOnly}
                        {...register(`chi_tiet.${index}.ghi_chu`)}
                      />
                    </td>
                    <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50">
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </GenericSubTableSection>
      </form>
    </GenericDrawer>
  );
};

export default PhieuDeXuatVatTuForm;
