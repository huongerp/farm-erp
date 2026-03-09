import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, Warehouse, ArrowRightLeft, Package, Trash2, AlertTriangle, Truck } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Combobox from '../../../../components/ui/Combobox';
import { PhieuKhoFormValues, phieuKhoSchema } from '../core/schema';
import type { PhieuKho, LoaiPhieuKho } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useCreatePhieuKho, useUpdatePhieuKho, useTonKhoTheoKho } from '../hooks/use-phieu-kho';
import { useHangHoaList } from '../../danh-sach-hang-hoa/hooks/use-hang-hoa';
import { useDoiTacList } from '../../danh-sach-doi-tac/hooks/use-doi-tac';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

interface Props {
  loai: LoaiPhieuKho;
  khoList: Kho[];
  initialData?: PhieuKho | null;
  onClose: () => void;
}

const PhieuKhoForm: React.FC<Props> = ({ loai, khoList, initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreatePhieuKho(loai, onClose);
  const updateMutation = useUpdatePhieuKho(onClose);
  const { data: hangHoaList = [] } = useHangHoaList();
  const { data: nhaCungCapList = [] } = useDoiTacList('nha_cung_cap');
  const { data: khachHangList = [] } = useDoiTacList('khach_hang');

  const khoOptions = useMemo(
    () => [
      { value: '', label: t('phieuKho.form.warehousePlaceholder') },
      ...khoList.map((k) => ({ value: k.id, label: k.ten_kho })),
    ],
    [khoList, t]
  );

  const hangHoaComboboxOptions = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((h) => ({
          value: h.id,
          label: `${h.ma_hang} - ${h.ten_hang}`,
          subLabel: h.don_vi_tinh ? `${t('phieuKho.form.unit')}: ${h.don_vi_tinh}` : undefined,
        })),
    [hangHoaList, t]
  );

  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoa> = {};
    hangHoaList.forEach((h) => { m[h.id] = h; });
    return m;
  }, [hangHoaList]);

  const nhaCungCapOptions = useMemo(
    () => [
      { value: '', label: t('phieuKho.form.supplierPlaceholder') },
      ...nhaCungCapList.filter((n) => n.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).map((n) => ({ value: n.id, label: `${n.ma_ncc} - ${n.ten_ncc}` })),
    ],
    [nhaCungCapList, t]
  );

  const khachHangOptions = useMemo(
    () => [
      { value: '', label: t('phieuKho.form.customerPlaceholder') },
      ...khachHangList.filter((n) => n.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).map((n) => ({ value: n.id, label: `${n.ma_ncc} - ${n.ten_ncc}` })),
    ],
    [khachHangList, t]
  );

  const defaultValues: Partial<PhieuKhoFormValues> = {
    so_phieu: '',
    ngay: '',
    id_kho: '',
    id_kho_den: null,
    id_nha_cung_cap: null,
    id_khach_hang: null,
    mo_ta: '',
    trang_thai: 0,
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<PhieuKhoFormValues>({
    resolver: zodResolver(phieuKhoSchema) as any,
    defaultValues,
  });

  const idKhoWatch = watch('id_kho');
  const { data: tonKhoList = [] } = useTonKhoTheoKho(idKhoWatch || undefined);

  const tonKhoMap = useMemo(() => {
    const m: Record<string, number> = {};
    (tonKhoList ?? []).forEach((r) => { m[r.id_hang_hoa] = r.so_luong; });
    return m;
  }, [tonKhoList]);

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });
  const khoDenOptions = useMemo(() => {
    if (!idKhoWatch) return khoOptions;
    return khoOptions.filter((o) => !o.value || o.value !== idKhoWatch);
  }, [khoOptions, idKhoWatch]);

  useEffect(() => {
    if (initialData) {
      reset({
        so_phieu: initialData.so_phieu,
        ngay: initialData.ngay,
        id_kho: initialData.id_kho,
        id_kho_den: initialData.id_kho_den ?? null,
        id_nha_cung_cap: initialData.id_nha_cung_cap ?? null,
        id_khach_hang: initialData.id_khach_hang ?? null,
        mo_ta: initialData.mo_ta ?? '',
        trang_thai: initialData.trang_thai,
        chi_tiet: (initialData.chi_tiet ?? []).map((ct) => ({
          id_hang_hoa: ct.id_hang_hoa,
          so_luong: ct.so_luong,
          ghi_chu: ct.ghi_chu ?? '',
        })),
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<PhieuKhoFormValues> = (data) => {
    if (loai === 'chuyen' && !data.id_kho_den) {
      toast.error(t('phieuKho.validation.warehouseToRequired'));
      return;
    }
    const validChiTiet = (data.chi_tiet ?? []).filter((c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0);
    if (!isEdit && validChiTiet.length === 0) {
      toast.error(t('phieuKho.validation.atLeastOneItem'));
      return;
    }
    const sanitized: PhieuKhoFormValues = {
      ...data,
      id_kho_den: data.id_kho_den === '' || data.id_kho_den === undefined ? null : data.id_kho_den,
      id_nha_cung_cap: data.id_nha_cung_cap === '' || data.id_nha_cung_cap === undefined ? null : data.id_nha_cung_cap,
      id_khach_hang: data.id_khach_hang === '' || data.id_khach_hang === undefined ? null : data.id_khach_hang,
      mo_ta: data.mo_ta?.trim() || undefined,
      chi_tiet: validChiTiet.map((c) => ({
        id_hang_hoa: c.id_hang_hoa.trim(),
        so_luong: Number(c.so_luong),
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
  const isChuyen = loai === 'chuyen';
  const isNhap = loai === 'nhap';
  const isXuat = loai === 'xuat';
  const showTonKhoWarning = loai === 'xuat' || loai === 'chuyen';
  const showSupplier = isNhap;
  const showCustomer = isXuat;
  const labelKho = isNhap ? t('phieuKho.form.warehouseTo') : t('phieuKho.form.warehouseFrom');

  const chiTietValues = watch('chi_tiet') ?? [];

  return (
    <GenericDrawer
      title={isEdit ? t('phieuKho.form.editTitle') : t('phieuKho.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="phieu-kho-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('phieuKho.form.save')}
          createLabel={t('phieuKho.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="phieu-kho-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('phieuKho.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('phieuKho.form.code')}
              placeholder={t('phieuKho.form.codePlaceholder')}
              icon={<FileText size={12} />}
              required
              {...register('so_phieu')}
              error={errors.so_phieu?.message}
            />
            <Input
              label={t('phieuKho.form.date')}
              type="date"
              icon={<Calendar size={12} />}
              required
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <div className={isChuyen ? '' : 'col-span-1 sm:col-span-2'}>
              <Controller
                name="id_kho"
                control={control}
                render={({ field }) => (
                  <Select
                    label={labelKho}
                    options={khoOptions}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    icon={<Warehouse size={12} />}
                    required
                    error={errors.id_kho?.message}
                  />
                )}
              />
            </div>
            {isChuyen && (
              <Controller
                name="id_kho_den"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('phieuKho.form.warehouseTo')}
                    options={khoDenOptions}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                    onBlur={field.onBlur}
                    icon={<ArrowRightLeft size={12} />}
                    required
                    error={errors.id_kho_den?.message}
                  />
                )}
              />
            )}
            {showSupplier && (
              <Controller
                name="id_nha_cung_cap"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('phieuKho.form.supplier')}
                    options={nhaCungCapOptions}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                    onBlur={field.onBlur}
                    icon={<Truck size={12} />}
                    error={errors.id_nha_cung_cap?.message}
                  />
                )}
              />
            )}
            {showCustomer && (
              <Controller
                name="id_khach_hang"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('phieuKho.form.customer')}
                    options={khachHangOptions}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                    onBlur={field.onBlur}
                    icon={<Truck size={12} />}
                    error={errors.id_khach_hang?.message}
                  />
                )}
              />
            )}
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('phieuKho.form.description')}
                placeholder={t('phieuKho.form.descriptionPlaceholder')}
                icon={<FileText size={12} />}
                {...register('mo_ta')}
                error={errors.mo_ta?.message}
                rows={2}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="trang_thai"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('phieuKho.form.status')}
                    options={[
                      { value: '0', label: t('phieuKho.status.pending') },
                      { value: '1', label: t('phieuKho.status.approved') },
                      { value: '2', label: t('phieuKho.status.rejected') },
                    ]}
                    value={String(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        <GenericSubTableSection
          title={t('phieuKho.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('phieuKho.form.addRow')}
          onAdd={() => append({ id_hang_hoa: '', so_luong: 0, ghi_chu: '' })}
          emptyTitle={t('phieuKho.form.noItems')}
          emptyDescription={t('phieuKho.form.noItemsHint')}
          maxTableHeight="320px"
        >
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">{t('phieuKho.form.item')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[110px]">{t('phieuKho.form.quantity')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[64px]">{t('phieuKho.form.unit')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">{t('phieuKho.form.stockAtWarehouse')}</th>
              {showTonKhoWarning && (
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.warning')}</th>
              )}
              <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-16 bg-muted border-l border-border">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={showTonKhoWarning ? 7 : 6} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  {t('phieuKho.form.noItems')}
                </td>
              </tr>
            ) : (
              fields.map((field, index) => {
                const idHangHoa = chiTietValues[index]?.id_hang_hoa ?? '';
                const soLuong = Number(chiTietValues[index]?.so_luong) || 0;
                const ton = idHangHoa ? (tonKhoMap[idHangHoa] ?? 0) : 0;
                const isOverStock = showTonKhoWarning && idHangHoa && soLuong > ton;
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
                            placeholder={t('phieuKho.form.itemPlaceholder')}
                            searchPlaceholder={t('phieuKho.form.itemSearchPlaceholder')}
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
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {idHangHoa ? `${ton} ${donVi !== '—' ? donVi : ''}` : '—'}
                    </td>
                    {showTonKhoWarning && (
                      <td className="px-4 py-2.5">
                        {isOverStock && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                            <AlertTriangle size={12} />
                            {t('phieuKho.form.overStock')}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
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

export default PhieuKhoForm;
