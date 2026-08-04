import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, Warehouse, ArrowRightLeft, Package, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { phieuKhoPTSchema, type PhieuKhoPTFormValues } from '../core/schema';
import type { PhieuKhoPT, LoaiPhieuKhoPT } from '../core/types';
import { formatNumberVN } from '../../../../lib/utils';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { FarmHangHoa } from '../../hang-hoa-phan-thuoc/core/types';
import { useCreatePhieuKhoPT, useUpdatePhieuKhoPT } from '../hooks/use-phieu-kho-pt';
import { getNextSoPhieuFarmPt } from '../services/phieu-kho-pt-service';
import { useFarmHangHoaList } from '../../hang-hoa-phan-thuoc/hooks/use-farm-hang-hoa';
import { useAuthStore } from '../../../../store/useStore';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

const ADD_KHO = '__add_kho__';
const ADD_KHO_DEN = '__add_kho_den__';
const ADD_HANG_HOA = '__add_hang_hoa__';

interface Props {
  khoList: Kho[];
  initialData?: PhieuKhoPT | null;
  onClose: () => void;
  onRequestAddKho?: () => Promise<Kho | null>;
  onRequestAddHangHoa?: () => Promise<FarmHangHoa | null>;
}

const today = () => new Date().toISOString().slice(0, 10);

const LOAI_OPTIONS: { value: LoaiPhieuKhoPT; labelKey: string }[] = [
  { value: 'nhập', labelKey: 'phieuKhoPhanThuoc.tabs.nhap' },
  { value: 'xuất', labelKey: 'phieuKhoPhanThuoc.tabs.xuat' },
  { value: 'chuyển', labelKey: 'phieuKhoPhanThuoc.tabs.chuyen' },
];

const PhieuKhoPTForm: React.FC<Props> = ({ khoList, initialData, onClose, onRequestAddKho, onRequestAddHangHoa }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData?.id;
  const createMutation = useCreatePhieuKhoPT(onClose);
  const updateMutation = useUpdatePhieuKhoPT(onClose);
  const { data: hangHoaList = [], isLoading: isLoadingHangHoa, isError: isErrorHangHoa } = useFarmHangHoaList();

  const defaultValues: Partial<PhieuKhoPTFormValues> = {
    so_phieu: '',
    ngay: today(),
    loai: 'nhập',
    kho_id: '',
    kho_den_id: null,
    mo_ta: '',
    trang_thai: 'Chờ duyệt',
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control, watch, setValue } = useForm<PhieuKhoPTFormValues>({
    resolver: zodResolver(phieuKhoPTSchema) as any,
    defaultValues,
  });

  const khoIdWatch = watch('kho_id');
  const loaiWatch = watch('loai') as LoaiPhieuKhoPT;

  const khoOptions = useMemo(
    () => [
      ...(onRequestAddKho ? [{ value: ADD_KHO, label: `➕ ${t('phieuKhoPhanThuoc.form.addWarehouse')}` }] : []),
      { value: '', label: t('phieuKhoPhanThuoc.form.warehousePlaceholder') },
      ...khoList.map((k) => ({ value: k.id, label: k.ten_kho })),
    ],
    [khoList, t, onRequestAddKho]
  );

  const khoDenOptionsWithAdd = useMemo(() => {
    const base = !khoIdWatch ? khoOptions : khoOptions.filter((o) => !o.value || o.value !== khoIdWatch);
    if (!onRequestAddKho) return base;
    const addOpt = { value: ADD_KHO_DEN, label: `➕ ${t('phieuKhoPhanThuoc.form.addWarehouse')}` };
    return [addOpt, ...base.filter((o) => o.value !== ADD_KHO)];
  }, [khoOptions, khoIdWatch, t, onRequestAddKho]);

  const hangHoaComboboxOptions = useMemo(
    () =>
      hangHoaList.map((h) => ({
        value: h.id,
        label: `${h.ma_hang_hoa ?? h.ma_hang} — ${h.ten_hang_hoa ?? h.ten_hang}`,
        subLabel: h.dvt ? `${t('phieuKhoPhanThuoc.form.unit')}: ${h.dvt}` : undefined,
      })),
    [hangHoaList, t]
  );

  const hangHoaComboboxOptionsWithAdd = useMemo(
    () => [
      ...(onRequestAddHangHoa
        ? [{ value: ADD_HANG_HOA, label: `➕ ${t('phieuKhoPhanThuoc.form.addProduct')}`, subLabel: undefined }]
        : []),
      ...hangHoaComboboxOptions,
    ],
    [hangHoaComboboxOptions, onRequestAddHangHoa, t]
  );

  const hangHoaMap = useMemo(() => {
    const m: Record<string, { don_vi_tinh?: string; don_gia?: number }> = {};
    hangHoaList.forEach((h) => {
      m[h.id] = { don_vi_tinh: h.dvt ?? undefined, don_gia: h.don_gia != null ? Number(h.don_gia) : undefined };
    });
    return m;
  }, [hangHoaList]);

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });

  const renderAddOption = (opt: { value: string | number; label: string }) =>
    opt.value === ADD_KHO || opt.value === ADD_KHO_DEN || opt.value === ADD_HANG_HOA ? (
      <span className="text-primary font-medium">{opt.label}</span>
    ) : undefined;

  useEffect(() => {
    // Không reset nếu người dùng đã bắt đầu sửa — cùng lý do đã sửa ở PhieuKhoForm.
    if (isDirty) return;
    if (initialData) {
      reset({
        so_phieu: initialData.so_phieu,
        ngay: initialData.ngay,
        loai: initialData.loai,
        kho_id: initialData.kho_id,
        kho_den_id: initialData.kho_den_id ?? null,
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
      reset({ ...defaultValues, ngay: today(), loai: 'nhập' });
      if (user?.id) setValue('nguoi_tao_id', Number(user.id));
    }
  }, [initialData, reset, user?.id, setValue, isDirty]);

  useEffect(() => {
    if (loaiWatch !== 'chuyển') {
      setValue('kho_den_id', null);
    }
  }, [loaiWatch, setValue]);

  const labelKho =
    loaiWatch === 'nhập'
      ? t('phieuKhoPhanThuoc.form.warehouseTo')
      : loaiWatch === 'xuất'
        ? t('phieuKhoPhanThuoc.form.warehouseFrom')
        : t('phieuKhoPhanThuoc.form.warehouseFrom');

  const onSubmit: SubmitHandler<PhieuKhoPTFormValues> = async (data) => {
    if (data.loai === 'chuyển' && !data.kho_den_id) {
      toast.error(t('phieuKhoPhanThuoc.validation.warehouseDestRequired'));
      return;
    }
    const validChiTiet = (data.chi_tiet ?? []).filter((c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0);
    if (!isEdit && validChiTiet.length === 0) {
      toast.error(t('phieuKhoPhanThuoc.validation.atLeastOneItem'));
      return;
    }
    let soPhieu = data.so_phieu?.trim() ?? '';
    if (!isEdit) {
      try {
        soPhieu = await getNextSoPhieuFarmPt(data.loai as LoaiPhieuKhoPT);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('phieuKhoPhanThuoc.validation.codeRequired'));
        return;
      }
    }
    const sanitized: PhieuKhoPTFormValues = {
      ...data,
      so_phieu: soPhieu || data.so_phieu?.trim() || '',
      kho_den_id: data.kho_den_id === '' || data.kho_den_id === undefined ? null : data.kho_den_id,
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
  const isChuyen = loaiWatch === 'chuyển';

  const chiTietValues: { id_hang_hoa?: string; so_luong?: number; don_gia?: number; so_lot?: string; ghi_chu?: string }[] =
    Array.isArray(watch('chi_tiet')) ? watch('chi_tiet') : [];

  const loaiComboboxOptions = useMemo(
    () => LOAI_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );

  return (
    <GenericDrawer
      title={isEdit ? t('phieuKhoPhanThuoc.form.editTitle') : t('phieuKhoPhanThuoc.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      isDirty={isDirty}
      footer={
        <FormDrawerFooter
          formId="phieu-kho-pt-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('phieuKhoPhanThuoc.form.save')}
          createLabel={t('phieuKhoPhanThuoc.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="phieu-kho-pt-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('phieuKhoPhanThuoc.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('phieuKhoPhanThuoc.form.code')}
              placeholder={!isEdit ? t('phieuKhoPhanThuoc.form.autoCodePlaceholder') : t('phieuKhoPhanThuoc.form.codePlaceholder')}
              icon={<FileText size={12} />}
              required={isEdit}
              readOnly={!isEdit}
              disabled={!isEdit}
              {...register('so_phieu')}
              error={errors.so_phieu?.message}
            />
            <Input
              label={t('phieuKhoPhanThuoc.form.date')}
              type="date"
              icon={<Calendar size={12} />}
              required
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="loai"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('phieuKhoPhanThuoc.form.loai')}
                    icon={<ArrowRightLeft size={12} />}
                    options={loaiComboboxOptions}
                    value={field.value}
                    onChange={(v) => field.onChange((v ?? 'nhập') as LoaiPhieuKhoPT)}
                    placeholder={t('phieuKhoPhanThuoc.form.loaiPlaceholder')}
                    searchPlaceholder={t('phieuKhoPhanThuoc.form.itemSearchPlaceholder')}
                    searchable={false}
                    dropdownInPortal
                    required
                    error={errors.loai?.message as string | undefined}
                  />
                )}
              />
            </div>
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
                        onRequestAddKho?.().then((k) => {
                          if (k) setValue('kho_id', k.id);
                        });
                        return;
                      }
                      field.onChange(v ?? '');
                    }}
                    placeholder={t('phieuKhoPhanThuoc.form.warehousePlaceholder')}
                    searchPlaceholder={t('phieuKhoPhanThuoc.form.itemSearchPlaceholder')}
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
                    label={t('phieuKhoPhanThuoc.form.warehouseTo')}
                    options={khoDenOptionsWithAdd}
                    value={field.value ?? ''}
                    onChange={(v) => {
                      if (v === ADD_KHO_DEN) {
                        onRequestAddKho?.().then((k) => {
                          if (k) setValue('kho_den_id', k.id);
                        });
                        return;
                      }
                      field.onChange(v === '' || v === null ? null : v);
                    }}
                    placeholder={t('phieuKhoPhanThuoc.form.warehousePlaceholder')}
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
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('phieuKhoPhanThuoc.form.description')}
                placeholder={t('phieuKhoPhanThuoc.form.descriptionPlaceholder')}
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
            {t('phieuKhoPhanThuoc.form.productLoadError')}
          </div>
        )}

        <GenericSubTableSection
          title={t('phieuKhoPhanThuoc.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('phieuKhoPhanThuoc.form.addRow')}
          onAdd={() => append({ id_hang_hoa: '', so_luong: 0, don_gia: 0, so_lot: '', ghi_chu: '' })}
          emptyTitle={t('phieuKhoPhanThuoc.form.noItems')}
          emptyDescription={t('phieuKhoPhanThuoc.form.noItemsHint')}
          maxTableHeight="320px"
        >
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">
                {t('phieuKhoPhanThuoc.form.item')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[110px]">
                {t('phieuKhoPhanThuoc.form.quantity')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">
                {t('phieuKhoPhanThuoc.form.unitPrice')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[110px]">
                {t('phieuKhoPhanThuoc.form.amount')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[64px]">
                {t('phieuKhoPhanThuoc.form.unit')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">
                {t('phieuKhoPhanThuoc.preview.soLot')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">
                {t('phieuKhoPhanThuoc.form.note')}
              </th>
              <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-16 bg-muted border-l border-border">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  {t('phieuKhoPhanThuoc.form.noItems')}
                </td>
              </tr>
            ) : (
              fields.map((field, index) => {
                const idHangHoa = chiTietValues[index]?.id_hang_hoa ?? '';
                const soLuong = Number(chiTietValues[index]?.so_luong) || 0;
                const donGia = Number(chiTietValues[index]?.don_gia) || 0;
                const thanhTien = soLuong * donGia;
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
                                    const dg = hangHoaMap[h.id]?.don_gia;
                                    setValue(`chi_tiet.${index}.don_gia`, dg != null ? dg : 0);
                                  }
                                });
                                return;
                              }
                              f.onChange(v ?? '');
                              const dg = v ? hangHoaMap[String(v)]?.don_gia : undefined;
                              setValue(`chi_tiet.${index}.don_gia`, dg != null ? dg : 0);
                            }}
                            placeholder={isLoadingHangHoa ? t('common.loading') : t('phieuKhoPhanThuoc.form.itemPlaceholder')}
                            searchPlaceholder={t('phieuKhoPhanThuoc.form.itemSearchPlaceholder')}
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
                        {...register(`chi_tiet.${index}.so_luong`, { valueAsNumber: true })}
                        className="h-9"
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[90px] align-top">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        {...register(`chi_tiet.${index}.don_gia`, { valueAsNumber: true })}
                        className="h-9"
                      />
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-sm text-muted-foreground align-middle">{formatNumberVN(thanhTien)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground align-middle">{donVi}</td>
                    <td className="px-4 py-2.5 align-top">
                      <Input {...register(`chi_tiet.${index}.so_lot`)} className="h-9" />
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <Input {...register(`chi_tiet.${index}.ghi_chu`)} className="h-9" />
                    </td>
                    <td className="sticky right-0 z-[2] px-2 py-2 bg-card border-l border-border align-middle">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                        aria-label={t('common.delete')}
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

export default PhieuKhoPTForm;
