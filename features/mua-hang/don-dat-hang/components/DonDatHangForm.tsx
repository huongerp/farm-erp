import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, Building2, Warehouse, User, UserCheck, Package, CreditCard, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Combobox from '../../../../components/ui/Combobox';
import { DonDatHangFormValues, donDatHangSchema } from '../core/schema';
import type { DonDatHang } from '../core/types';
import type { DoiTac } from '../../../kho-van/danh-sach-doi-tac/core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { HangHoa } from '../../../kho-van/danh-sach-hang-hoa/core/types';
import type { Employee } from '../../../he-thong/nhan-vien/core/types';
import type { PhieuDeXuatVatTu } from '../../../kho-van/phieu-de-xuat-vat-tu/core/types';
import { useCreateDonDatHang, useUpdateDonDatHang } from '../hooks/use-don-dat-hang';
import { useHangHoaList } from '../../../kho-van/danh-sach-hang-hoa/hooks/use-hang-hoa';
import { TRANG_THAI_KEY } from '../core/constants';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

interface Props {
  supplierList: DoiTac[];
  khoList: Kho[];
  employees: Employee[];
  phieuDeXuatList?: PhieuDeXuatVatTu[];
  initialData?: DonDatHang | null;
  onClose: () => void;
}

const DonDatHangForm: React.FC<Props> = ({
  supplierList,
  khoList,
  employees,
  phieuDeXuatList = [],
  initialData,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDonDatHang(onClose);
  const updateMutation = useUpdateDonDatHang(onClose);
  const { data: hangHoaList = [] } = useHangHoaList();

  const supplierOptions = useMemo(
    () => [
      { value: '', label: t('donDatHang.form.supplierPlaceholder') },
      ...supplierList.filter((d) => d.trang_thai === 1).map((d) => ({ value: d.id, label: `${d.ma_ncc} - ${d.ten_ncc}` })),
    ],
    [supplierList, t]
  );

  const khoOptions = useMemo(
    () => [
      { value: '', label: t('donDatHang.form.warehousePlaceholder') },
      ...khoList.map((k) => ({ value: k.id, label: k.ten_kho })),
    ],
    [khoList, t]
  );

  const phieuDeXuatOptions = useMemo(
    () => [
      { value: '', label: t('donDatHang.form.linkRequestPlaceholder') },
      ...phieuDeXuatList
        .filter((p) => p.trang_thai === 1)
        .map((p) => ({ value: p.id, label: `${p.so_phieu} - ${p.ngay}` })),
    ],
    [phieuDeXuatList, t]
  );

  const buyerOptions = useMemo(
    () => [
      { value: '', label: t('donDatHang.form.buyerPlaceholder') },
      ...employees.map((e) => ({ value: e.id, label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}` })),
    ],
    [employees, t]
  );

  const approverOptions = useMemo(
    () => [
      { value: '', label: t('donDatHang.form.approverPlaceholder') },
      ...employees.map((e) => ({ value: e.id, label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}` })),
    ],
    [employees, t]
  );

  const statusOptions = useMemo(
    () =>
      ([0, 1, 2, 3, 4, 5, 6, 7] as const).map((s) => ({
        value: String(s),
        label: t(`donDatHang.status.${TRANG_THAI_KEY[s]}`),
      })),
    [t]
  );

  const hangHoaComboboxOptions = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.trang_thai === 1)
        .map((h) => ({
          value: h.id,
          label: `${h.ma_hang} - ${h.ten_hang}`,
          subLabel: h.don_vi_tinh ? `${t('donDatHang.form.unit')}: ${h.don_vi_tinh}` : undefined,
        })),
    [hangHoaList, t]
  );

  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoa> = {};
    hangHoaList.forEach((h) => { m[h.id] = h; });
    return m;
  }, [hangHoaList]);

  const defaultValues: Partial<DonDatHangFormValues> = {
    so_po: '',
    ngay_dat: '',
    ngay_giao_dk: '',
    id_nha_cung_cap: '',
    id_kho_nhan: null,
    id_phieu_de_xuat_vat_tu: null,
    id_nguoi_dat: '',
    id_nguoi_duyet: null,
    dieu_khoan_thanh_toan: '',
    ghi_chu: '',
    trang_thai: 0,
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<DonDatHangFormValues>({
    resolver: zodResolver(donDatHangSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });
  const chiTietValues = watch('chi_tiet') ?? [];

  useEffect(() => {
    if (initialData) {
      reset({
        so_po: initialData.so_po,
        ngay_dat: initialData.ngay_dat,
        ngay_giao_dk: initialData.ngay_giao_dk,
        id_nha_cung_cap: initialData.id_nha_cung_cap,
        id_kho_nhan: initialData.id_kho_nhan ?? null,
        id_phieu_de_xuat_vat_tu: initialData.id_phieu_de_xuat_vat_tu ?? null,
        id_nguoi_dat: initialData.id_nguoi_dat,
        id_nguoi_duyet: initialData.id_nguoi_duyet ?? null,
        dieu_khoan_thanh_toan: initialData.dieu_khoan_thanh_toan ?? '',
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
        chi_tiet: (initialData.chi_tiet ?? []).map((ct) => ({
          id_hang_hoa: ct.id_hang_hoa,
          so_luong: ct.so_luong,
          don_gia: ct.don_gia,
          ghi_chu: ct.ghi_chu ?? '',
        })),
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<DonDatHangFormValues> = (data) => {
    const validChiTiet = (data.chi_tiet ?? []).filter(
      (c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0
    );
    if (validChiTiet.length === 0) return;
    const sanitized: DonDatHangFormValues = {
      ...data,
      id_kho_nhan: data.id_kho_nhan === '' || data.id_kho_nhan === undefined ? null : data.id_kho_nhan,
      id_phieu_de_xuat_vat_tu: data.id_phieu_de_xuat_vat_tu === '' || data.id_phieu_de_xuat_vat_tu === undefined ? null : data.id_phieu_de_xuat_vat_tu,
      id_nguoi_duyet: data.id_nguoi_duyet === '' || data.id_nguoi_duyet === undefined ? null : data.id_nguoi_duyet,
      dieu_khoan_thanh_toan: data.dieu_khoan_thanh_toan?.trim() || undefined,
      ghi_chu: data.ghi_chu?.trim() || undefined,
      chi_tiet: validChiTiet.map((c) => ({
        id_hang_hoa: c.id_hang_hoa.trim(),
        so_luong: Number(c.so_luong),
        don_gia: c.don_gia,
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
      title={isEdit ? t('donDatHang.form.editTitle') : t('donDatHang.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="don-dat-hang-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('donDatHang.form.save')}
          createLabel={t('donDatHang.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="don-dat-hang-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('donDatHang.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('donDatHang.form.code')}
              placeholder={t('donDatHang.form.codePlaceholder')}
              icon={<FileText size={12} />}
              required
              {...register('so_po')}
              error={errors.so_po?.message}
            />
            <Input
              label={t('donDatHang.form.orderDate')}
              type="date"
              icon={<Calendar size={12} />}
              required
              {...register('ngay_dat')}
              error={errors.ngay_dat?.message}
            />
            <Input
              label={t('donDatHang.form.deliveryDate')}
              type="date"
              icon={<Calendar size={12} />}
              required
              {...register('ngay_giao_dk')}
              error={errors.ngay_giao_dk?.message}
            />
            <Controller
              name="id_nha_cung_cap"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('donDatHang.form.supplier')}
                  options={supplierOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  icon={<Building2 size={12} />}
                  required
                  error={errors.id_nha_cung_cap?.message}
                />
              )}
            />
            <Controller
              name="id_kho_nhan"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('donDatHang.form.warehouse')}
                  options={khoOptions}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  onBlur={field.onBlur}
                  icon={<Warehouse size={12} />}
                  error={errors.id_kho_nhan?.message}
                />
              )}
            />
            <Controller
              name="id_phieu_de_xuat_vat_tu"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('donDatHang.form.linkRequest')}
                  options={phieuDeXuatOptions}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  onBlur={field.onBlur}
                  icon={<FileText size={12} />}
                />
              )}
            />
            <Controller
              name="id_nguoi_dat"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('donDatHang.form.buyer')}
                  options={buyerOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  icon={<User size={12} />}
                  required
                  error={errors.id_nguoi_dat?.message}
                />
              )}
            />
            <Controller
              name="id_nguoi_duyet"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('donDatHang.form.approver')}
                  options={approverOptions}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  onBlur={field.onBlur}
                  icon={<UserCheck size={12} />}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('donDatHang.form.paymentTerms')}
                placeholder={t('donDatHang.form.paymentTermsPlaceholder')}
                icon={<CreditCard size={12} />}
                {...register('dieu_khoan_thanh_toan')}
                error={errors.dieu_khoan_thanh_toan?.message}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('donDatHang.form.notes')}
                placeholder={t('donDatHang.form.notesPlaceholder')}
                icon={<FileText size={12} />}
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
                    label={t('donDatHang.form.status')}
                    options={statusOptions}
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
          title={t('donDatHang.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('donDatHang.form.addRow')}
          onAdd={() => append({ id_hang_hoa: '', so_luong: 0, don_gia: undefined, ghi_chu: '' })}
          emptyTitle={t('donDatHang.form.noItems')}
          emptyDescription={t('donDatHang.form.noItemsHint')}
          maxTableHeight="320px"
        >
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">{t('donDatHang.form.item')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">{t('donDatHang.form.quantity')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('donDatHang.form.unitPrice')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[64px]">{t('donDatHang.form.unit')}</th>
              <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-16 bg-muted border-l border-border">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  {t('donDatHang.form.noItems')}
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
                            placeholder={t('donDatHang.form.itemPlaceholder')}
                            searchPlaceholder={t('donDatHang.form.itemSearchPlaceholder')}
                            searchable
                            triggerClassName="h-9 text-sm border-border rounded-md"
                            dropdownInPortal
                          />
                        )}
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[90px] align-top">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        className="h-9 text-sm border-border w-full min-w-[5rem] max-w-[8rem] tabular-nums"
                        {...register(`chi_tiet.${index}.so_luong`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px] align-top">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        className="h-9 text-sm border-border w-full min-w-[5rem] max-w-[10rem] tabular-nums"
                        {...register(`chi_tiet.${index}.don_gia`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{donVi}</td>
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

export default DonDatHangForm;
