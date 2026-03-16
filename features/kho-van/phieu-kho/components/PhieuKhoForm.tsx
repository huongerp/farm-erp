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
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import { formatNumberVN } from '../../../../lib/utils';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useCreatePhieuKho, useUpdatePhieuKho, useTonKhoTheoKho, useNextSoPhieu } from '../hooks/use-phieu-kho';
import { useHangHoaList } from '../../danh-sach-hang-hoa/hooks/use-hang-hoa';
import { useDoiTacList } from '../../danh-sach-doi-tac/hooks/use-doi-tac';
import { useAuthStore } from '../../../../store/useStore';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

const ADD_KHO = '__add_kho__';
const ADD_KHO_DEN = '__add_kho_den__';
const ADD_NCC = '__add_ncc__';
const ADD_KH = '__add_kh__';
const ADD_HANG_HOA = '__add_hang_hoa__';

interface Props {
  loai: LoaiPhieuKhoTab;
  khoList: Kho[];
  initialData?: PhieuKho | null;
  onClose: () => void;
  onRequestAddKho?: () => Promise<Kho | null>;
  onRequestAddHangHoa?: () => Promise<HangHoa | null>;
  onRequestAddNcc?: () => Promise<import('../../danh-sach-doi-tac/core/types').DoiTac | null>;
  onRequestAddKh?: () => Promise<import('../../danh-sach-doi-tac/core/types').DoiTac | null>;
}

const today = () => new Date().toISOString().slice(0, 10);

const PhieuKhoForm: React.FC<Props> = ({ loai, khoList, initialData, onClose, onRequestAddKho, onRequestAddHangHoa, onRequestAddNcc, onRequestAddKh }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData?.id;
  const createMutation = useCreatePhieuKho(loai, onClose);
  const updateMutation = useUpdatePhieuKho(onClose);
  const { data: nextSoPhieu, isLoading: loadingSoPhieu } = useNextSoPhieu(loai, !isEdit);
  const { data: hangHoaList = [], isLoading: isLoadingHangHoa, isError: isErrorHangHoa } = useHangHoaList();
  const { data: nhaCungCapList = [] } = useDoiTacList('nha_cung_cap');
  const { data: khachHangList = [] } = useDoiTacList('khach_hang');

  const defaultValues: Partial<PhieuKhoFormValues> = {
    so_phieu: '',
    ngay: today(),
    kho_id: '',
    kho_den_id: null,
    id_nha_cung_cap: null,
    id_khach_hang: null,
    mo_ta: '',
    trang_thai: 'Chờ duyệt',
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<PhieuKhoFormValues>({
    resolver: zodResolver(phieuKhoSchema) as any,
    defaultValues,
  });

  const khoIdWatch = watch('kho_id');

  const khoOptions = useMemo(
    () => [
      ...(onRequestAddKho ? [{ value: ADD_KHO, label: `➕ ${t('phieuKho.form.addWarehouse')}` }] : []),
      { value: '', label: t('phieuKho.form.warehousePlaceholder') },
      ...khoList.map((k) => ({ value: k.id, label: k.ten_kho })),
    ],
    [khoList, t, onRequestAddKho]
  );

  const khoDenOptionsWithAdd = useMemo(() => {
    const base = !khoIdWatch ? khoOptions : khoOptions.filter((o) => !o.value || o.value !== khoIdWatch);
    if (!onRequestAddKho) return base;
    const addOpt = { value: ADD_KHO_DEN, label: `➕ ${t('phieuKho.form.addWarehouse')}` };
    return [addOpt, ...base.filter((o) => o.value !== ADD_KHO)];
  }, [khoOptions, khoIdWatch, t, onRequestAddKho]);

  const nccOptionsWithAdd = useMemo(
    () => [
      ...(onRequestAddNcc ? [{ value: ADD_NCC, label: `➕ ${t('phieuKho.form.addSupplier')}` }] : []),
      { value: '', label: t('phieuKho.form.supplierPlaceholder') },
      ...nhaCungCapList.filter((n) => n.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).map((n) => ({ value: n.id, label: `${n.ma_ncc} - ${n.ten_ncc}` })),
    ],
    [nhaCungCapList, t, onRequestAddNcc]
  );

  const khOptionsWithAdd = useMemo(
    () => [
      ...(onRequestAddKh ? [{ value: ADD_KH, label: `➕ ${t('phieuKho.form.addCustomer')}` }] : []),
      { value: '', label: t('phieuKho.form.customerPlaceholder') },
      ...khachHangList.filter((n) => n.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).map((n) => ({ value: n.id, label: `${n.ma_ncc} - ${n.ten_ncc}` })),
    ],
    [khachHangList, t, onRequestAddKh]
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
  const hangHoaComboboxOptionsWithAdd = useMemo(
    () => [
      ...(onRequestAddHangHoa ? [{ value: ADD_HANG_HOA, label: `➕ ${t('phieuKho.form.addProduct')}`, subLabel: undefined }] : []),
      ...hangHoaComboboxOptions,
    ],
    [hangHoaComboboxOptions, onRequestAddHangHoa, t]
  );

  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoa> = {};
    hangHoaList.forEach((h) => { m[h.id] = h; });
    return m;
  }, [hangHoaList]);

  const { data: tonKhoList = [] } = useTonKhoTheoKho(khoIdWatch || undefined);

  const tonKhoMap = useMemo(() => {
    const m: Record<string, number> = {};
    (tonKhoList ?? []).forEach((r) => { m[r.id_hang_hoa] = r.so_luong; });
    return m;
  }, [tonKhoList]);

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });

  const renderAddOption = (opt: { value: string | number; label: string }) =>
    (opt.value === ADD_KHO || opt.value === ADD_KHO_DEN || opt.value === ADD_NCC || opt.value === ADD_KH || opt.value === ADD_HANG_HOA)
      ? <span className="text-primary font-medium">{opt.label}</span>
      : undefined;

  useEffect(() => {
    if (initialData) {
      reset({
        so_phieu: initialData.so_phieu,
        ngay: initialData.ngay,
        kho_id: initialData.kho_id,
        kho_den_id: initialData.kho_den_id ?? null,
        id_nha_cung_cap: initialData.id_nha_cung_cap ?? null,
        id_khach_hang: initialData.id_khach_hang ?? null,
        mo_ta: initialData.mo_ta ?? '',
        trang_thai: initialData.trang_thai,
        nguoi_tao_id: initialData.nguoi_tao_id ?? null,
        chi_tiet: (initialData.chi_tiet ?? []).map((ct) => ({
          id_hang_hoa: ct.id_hang_hoa,
          so_luong: ct.so_luong,
          don_gia: ct.don_gia,
          so_lot: ct.so_lot ?? '',
          ghi_chu: ct.ghi_chu ?? '',
        })),
      });
      if (!initialData.id && user?.id) {
        setValue('nguoi_tao_id', Number(user.id));
      }
    } else {
      reset({ ...defaultValues, ngay: today() });
      if (user?.id) setValue('nguoi_tao_id', Number(user.id));
    }
  }, [initialData, reset, user?.id, setValue]);

  useEffect(() => {
    if (!isEdit && nextSoPhieu) {
      setValue('so_phieu', nextSoPhieu);
    }
  }, [isEdit, nextSoPhieu, setValue]);

  const onSubmit: SubmitHandler<PhieuKhoFormValues> = (data) => {
    if (loai === 'chuyen' && !data.kho_den_id) {
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
      kho_den_id: data.kho_den_id === '' || data.kho_den_id === undefined ? null : data.kho_den_id,
      id_nha_cung_cap: data.id_nha_cung_cap === '' || data.id_nha_cung_cap === undefined ? null : data.id_nha_cung_cap,
      id_khach_hang: data.id_khach_hang === '' || data.id_khach_hang === undefined ? null : data.id_khach_hang,
      mo_ta: data.mo_ta?.trim() || undefined,
      chi_tiet: validChiTiet.map((c) => ({
        id_hang_hoa: c.id_hang_hoa.trim(),
        so_luong: Number(c.so_luong),
        don_gia: c.don_gia != null ? Number(c.don_gia) : undefined,
        so_lot: c.so_lot?.trim() || undefined,
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

  const chiTietValues: { id_hang_hoa?: string; so_luong?: number; don_gia?: number; so_lot?: string; ghi_chu?: string }[] = Array.isArray(watch('chi_tiet')) ? watch('chi_tiet') : [];

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
              readOnly={!isEdit}
              disabled={!isEdit && loadingSoPhieu}
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
                name="kho_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={labelKho}
                    options={khoOptions}
                    value={field.value ?? ''}
                    onChange={(v) => {
                      if (v === ADD_KHO) {
                        onRequestAddKho?.().then((k) => { if (k) setValue('kho_id', k.id); });
                        return;
                      }
                      field.onChange(v ?? '');
                    }}
                    placeholder={t('phieuKho.form.warehousePlaceholder')}
                    searchPlaceholder={t('phieuKho.form.itemSearchPlaceholder')}
                    searchable
                    dropdownInPortal
                    icon={<Warehouse size={12} />}
                    required
                    error={errors.kho_id?.message}
                    renderOption={renderAddOption}
                  />
                )}
              />
            </div>
            {isChuyen && (
              <Controller
                name="kho_den_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('phieuKho.form.warehouseTo')}
                    options={khoDenOptionsWithAdd}
                    value={field.value ?? ''}
                    onChange={(v) => {
                      if (v === ADD_KHO_DEN) {
                        onRequestAddKho?.().then((k) => { if (k) setValue('kho_den_id', k.id); });
                        return;
                      }
                      field.onChange(v === '' || v === null ? null : v);
                    }}
                    placeholder={t('phieuKho.form.warehousePlaceholder')}
                    searchable
                    dropdownInPortal
                    icon={<ArrowRightLeft size={12} />}
                    required
                    error={errors.kho_den_id?.message}
                    renderOption={renderAddOption}
                  />
                )}
              />
            )}
            {showSupplier && (
              <Controller
                name="id_nha_cung_cap"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('phieuKho.form.supplier')}
                    options={nccOptionsWithAdd}
                    value={field.value ?? ''}
                    onChange={(v) => {
                      if (v === ADD_NCC) {
                        onRequestAddNcc?.().then((d) => { if (d) setValue('id_nha_cung_cap', d.id); });
                        return;
                      }
                      field.onChange(v === '' || v === null ? null : v);
                    }}
                    placeholder={t('phieuKho.form.supplierPlaceholder')}
                    searchable
                    dropdownInPortal
                    icon={<Truck size={12} />}
                    error={errors.id_nha_cung_cap?.message}
                    renderOption={renderAddOption}
                  />
                )}
              />
            )}
            {showCustomer && (
              <Controller
                name="id_khach_hang"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('phieuKho.form.customer')}
                    options={khOptionsWithAdd}
                    value={field.value ?? ''}
                    onChange={(v) => {
                      if (v === ADD_KH) {
                        onRequestAddKh?.().then((d) => { if (d) setValue('id_khach_hang', d.id); });
                        return;
                      }
                      field.onChange(v === '' || v === null ? null : v);
                    }}
                    placeholder={t('phieuKho.form.customerPlaceholder')}
                    searchable
                    dropdownInPortal
                    icon={<Truck size={12} />}
                    error={errors.id_khach_hang?.message}
                    renderOption={renderAddOption}
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
          </FormGrid>
        </FormSection>

        {isErrorHangHoa && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {t('phieuKho.form.productLoadError', 'Không tải được danh sách hàng hoá. Vui lòng tải lại trang.')}
          </div>
        )}

        <GenericSubTableSection
          title={t('phieuKho.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('phieuKho.form.addRow')}
          onAdd={() => append({ id_hang_hoa: '', so_luong: 0, don_gia: 0, so_lot: '', ghi_chu: '' })}
          emptyTitle={t('phieuKho.form.noItems')}
          emptyDescription={t('phieuKho.form.noItemsHint')}
          maxTableHeight="320px"
        >
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">{t('phieuKho.form.item')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[110px]">{t('phieuKho.form.quantity')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.unitPrice')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[110px]">{t('phieuKho.form.amount')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[64px]">{t('phieuKho.form.unit')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">{t('phieuKho.form.stockAtWarehouse')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">{t('phieuKho.preview.soLot')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">{t('phieuKho.form.note')}</th>
              {showTonKhoWarning && (
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.warning')}</th>
              )}
              <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-16 bg-muted border-l border-border">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={showTonKhoWarning ? 11 : 10} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  {t('phieuKho.form.noItems')}
                </td>
              </tr>
            ) : (
              fields.map((field, index) => {
                const idHangHoa = chiTietValues[index]?.id_hang_hoa ?? '';
                const soLuong = Number(chiTietValues[index]?.so_luong) || 0;
                const donGia = Number(chiTietValues[index]?.don_gia) || 0;
                const thanhTien = soLuong * donGia;
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
                            options={hangHoaComboboxOptionsWithAdd}
                            value={f.value || null}
                            onChange={(v) => {
                              if (v === ADD_HANG_HOA) {
                                onRequestAddHangHoa?.().then((h) => {
                                  if (h) {
                                    setValue(`chi_tiet.${index}.id_hang_hoa`, h.id);
                                    setValue(`chi_tiet.${index}.don_gia`, hangHoaMap[h.id]?.don_gia ?? 0);
                                  }
                                });
                                return;
                              }
                              f.onChange(v ?? '');
                              setValue(`chi_tiet.${index}.don_gia`, v ? (hangHoaMap[String(v)]?.don_gia ?? 0) : 0);
                            }}
                            placeholder={isLoadingHangHoa ? 'Đang tải...' : t('phieuKho.form.itemPlaceholder')}
                            searchPlaceholder={t('phieuKho.form.itemSearchPlaceholder')}
                            searchable
                            disabled={isLoadingHangHoa}
                            triggerClassName="h-9 text-sm border-border rounded-md"
                            dropdownInPortal
                            renderOption={renderAddOption}
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
                    <td className="px-4 py-2.5 min-w-[100px] align-top">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        className="h-9 text-sm border-border w-full min-w-[6rem] max-w-[10rem] tabular-nums"
                        {...register(`chi_tiet.${index}.don_gia`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {formatNumberVN(thanhTien)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{donVi}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {idHangHoa ? `${ton} ${donVi !== '—' ? donVi : ''}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 min-w-[90px] align-top">
                      <Input
                        placeholder={t('phieuKho.preview.soLot')}
                        className="h-9 text-sm border-border w-full"
                        {...register(`chi_tiet.${index}.so_lot`)}
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[200px] align-top">
                      <Textarea
                        placeholder={t('phieuKho.form.note')}
                        className="min-h-[52px] text-sm border-border w-full resize-y rounded-md"
                        rows={2}
                        {...register(`chi_tiet.${index}.ghi_chu`)}
                      />
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
            {fields.length > 0 && (() => {
              const tongSoLuong = chiTietValues.reduce((s, r) => s + (Number(r?.so_luong) || 0), 0);
              const tongTien = chiTietValues.reduce((s, r) => {
                const sl = Number(r?.so_luong) || 0;
                const dg = Number(r?.don_gia) || 0;
                return s + sl * dg;
              }, 0);
              return (
                <tr key="totals" className="bg-muted/50 border-t-2 border-border font-medium">
                  <td colSpan={2} className="px-4 py-2.5 text-muted-foreground text-xs" />
                  <td className="px-4 py-2.5 text-xs tabular-nums">{formatNumberVN(tongSoLuong)}</td>
                  <td className="px-4 py-2.5 text-xs" />
                  <td className="px-4 py-2.5 text-xs tabular-nums">{formatNumberVN(tongTien)}</td>
                  <td colSpan={showTonKhoWarning ? 7 : 6} className="px-4 py-2.5 text-xs" />
                </tr>
              );
            })()}
          </tbody>
        </GenericSubTableSection>
      </form>
    </GenericDrawer>
  );
};

export default PhieuKhoForm;
