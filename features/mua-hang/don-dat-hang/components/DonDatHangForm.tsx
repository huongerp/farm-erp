import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, Building2, Warehouse, User, Package, CreditCard, Edit, Trash2, Tag } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import Button from '../../../../components/ui/Button';
import { DonDatHangFormValues, donDatHangSchema, type DonDatHangChiTietFormItem } from '../core/schema';
import { mapPhieuDeXuatChiTietToDonDatHangLines } from '../core/don-dat-hang-to-form-values';
import type { DonDatHang } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { DoiTacRefLite } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import type { HangHoaRefLite } from '../../../kho-van/danh-sach-hang-hoa/services/hang-hoa-service';
import type { PhieuDeXuatSoPhieuOption } from '../../../kho-van/phieu-de-xuat-vat-tu/services/phieu-de-xuat-vat-tu-supabase.service';
import { usePhieuDeXuatVatTuById } from '../../../kho-van/phieu-de-xuat-vat-tu/hooks/use-phieu-de-xuat-vat-tu';
import { useCreateDonDatHang, useUpdateDonDatHang, useNextSoPoDonDatHang, usePhanLoaiDonDatHangChiTiet } from '../hooks/use-don-dat-hang';
import { useDoiTacRefQuery, useHangHoaRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { getTodayISO, getEndOfMonthISO, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

interface ChiTietLineDrawerProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialData: DonDatHangChiTietFormItem;
  hangHoaOptions: Array<{ value: string; label: string; subLabel?: string }>;
  phanLoaiOptions: Array<{ value: string; label: string }>;
  hangHoaMap: Record<string, HangHoaRefLite>;
  onClose: () => void;
  onSave: (value: DonDatHangChiTietFormItem) => void;
}

const EMPTY_LINE: DonDatHangChiTietFormItem = {
  id_hang_hoa: '',
  phan_loai: null,
  muc_dich_su_dung: null,
  so_luong: 0,
  don_gia: undefined,
  ghi_chu: '',
};

const ChiTietLineDrawer: React.FC<ChiTietLineDrawerProps> = ({
  open,
  mode,
  initialData,
  hangHoaOptions,
  phanLoaiOptions,
  hangHoaMap,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [formValue, setFormValue] = useState<DonDatHangChiTietFormItem>(initialData);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormValue(initialData);
    setSubmitted(false);
  }, [initialData, open]);

  if (!open) return null;

  const selectedHangHoa = formValue.id_hang_hoa ? hangHoaMap[formValue.id_hang_hoa] : null;
  const soLuong = Number(formValue.so_luong) || 0;
  const donGia = Number(formValue.don_gia) || 0;
  const thanhTien = soLuong * donGia;
  const itemInvalid = submitted && !formValue.id_hang_hoa;
  const quantityInvalid = submitted && soLuong <= 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!formValue.id_hang_hoa || soLuong <= 0) return;
    onSave({
      id_hang_hoa: formValue.id_hang_hoa,
      phan_loai: formValue.phan_loai?.trim() || null,
      muc_dich_su_dung: formValue.muc_dich_su_dung?.trim() || null,
      so_luong: soLuong,
      don_gia: formValue.don_gia != null ? Number(formValue.don_gia) : undefined,
      ghi_chu: formValue.ghi_chu?.trim() || undefined,
    });
  };

  return (
    <GenericDrawer
      title={mode === 'add' ? t('donDatHang.form.addLineTitle') : t('donDatHang.form.editLineTitle')}
      icon={<Package size={18} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      stackLevel={1}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button type="button" variant="ghost" onClick={onClose} className="border border-border">
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="don-dat-hang-line-form" className="bg-primary text-white hover:bg-primary/90">
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <form id="don-dat-hang-line-form" className="space-y-4" onSubmit={handleSubmit}>
        <FormSection title={t('donDatHang.form.itemsSection')} icon={<Package size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div className="col-span-1 sm:col-span-2">
              <Combobox
                label={t('donDatHang.form.item')}
                options={hangHoaOptions}
                value={formValue.id_hang_hoa || null}
                onChange={(v) => {
                  const id = v ? String(v) : '';
                  const h = id ? hangHoaMap[id] : null;
                  setFormValue((prev) => ({
                    ...prev,
                    id_hang_hoa: id,
                    don_gia: h?.don_gia ?? 0,
                  }));
                }}
                placeholder={t('donDatHang.form.itemPlaceholder')}
                searchPlaceholder={t('donDatHang.form.itemSearchPlaceholder')}
                searchable
                dropdownInPortal
                error={itemInvalid ? t('donDatHang.validation.itemRequired') : undefined}
              />
            </div>
            <Input
              label={t('donDatHang.chiTietTab.categoryLevel1Col')}
              value={selectedHangHoa?.ten_danh_muc_cap1 ?? ''}
              readOnly
              placeholder="—"
            />
            <Input
              label={t('donDatHang.chiTietTab.categoryLevel2Col')}
              value={selectedHangHoa?.ten_danh_muc_cap2 ?? ''}
              readOnly
              placeholder="—"
            />
            <Combobox
              label={t('donDatHang.chiTietTab.classificationCol')}
              icon={<Tag size={12} />}
              options={phanLoaiOptions}
              value={formValue.phan_loai ?? ''}
              onChange={(v) => setFormValue((prev) => ({ ...prev, phan_loai: typeof v === 'string' ? v : String(v ?? '') }))}
              placeholder={t('donDatHang.form.classificationPlaceholder')}
              searchPlaceholder={t('donDatHang.form.classificationSearchPlaceholder')}
              creatable
              creatableLabel={t('donDatHang.form.creatableNew')}
              searchable
              dropdownInPortal
            />
            <Input
              label={t('donDatHang.chiTietTab.itemCodeCol')}
              value={selectedHangHoa?.ma_hang ?? selectedHangHoa?.ma_hang_hoa ?? ''}
              readOnly
              placeholder="—"
            />
            <Input
              label={t('donDatHang.chiTietTab.itemNameCol')}
              value={selectedHangHoa?.ten_hang ?? selectedHangHoa?.ten_hang_hoa ?? ''}
              readOnly
              placeholder="—"
            />
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('donDatHang.form.quantity')} <span className="text-destructive">*</span>
              </label>
              <NumberInput
                value={formValue.so_luong}
                onChange={(v) => setFormValue((prev) => ({ ...prev, so_luong: v }))}
                min={0}
                maxFractionDigits={4}
                className="w-full border-border h-9 text-sm"
                compact
              />
              {quantityInvalid && (
                <p className="text-xs text-destructive mt-1">{t('donDatHang.validation.quantityMin')}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('donDatHang.form.unitPrice')}
              </label>
              <NumberInput
                value={formValue.don_gia}
                onChange={(v) => setFormValue((prev) => ({ ...prev, don_gia: v }))}
                min={0}
                maxFractionDigits={4}
                className="w-full border-border h-9 text-sm"
                compact
              />
            </div>
            <Input
              label={t('donDatHang.form.amount')}
              value={formatNumberVN(thanhTien)}
              readOnly
            />
            <Input
              label={t('donDatHang.form.unit')}
              value={selectedHangHoa?.dvt ?? selectedHangHoa?.don_vi_tinh ?? ''}
              readOnly
              placeholder="—"
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('donDatHang.chiTietTab.purposeOfUseCol')}
                value={formValue.muc_dich_su_dung ?? ''}
                onChange={(e) => setFormValue((prev) => ({ ...prev, muc_dich_su_dung: e.target.value }))}
                placeholder={t('donDatHang.form.purposeOfUsePlaceholder')}
                rows={2}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('donDatHang.form.note')}
                value={formValue.ghi_chu ?? ''}
                onChange={(e) => setFormValue((prev) => ({ ...prev, ghi_chu: e.target.value }))}
                placeholder={t('donDatHang.form.notePlaceholder')}
                rows={3}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

interface Props {
  /** Truyền từ ngoài hoặc form tự gọi useDoiTacRefQuery('nha_cung_cap') */
  supplierList?: DoiTacRefLite[];
  khoList: Kho[];
  employees: EmployeeRef[];
  phieuDeXuatList?: PhieuDeXuatSoPhieuOption[];
  initialData?: DonDatHang | null;
  /** Giá trị điền sẵn khi tạo mới (ví dụ: từ phiếu đề xuất vật tư) */
  prefillValues?: Partial<DonDatHangFormValues>;
  onClose: () => void;
}

const DonDatHangForm: React.FC<Props> = ({
  supplierList: supplierListProp,
  khoList,
  employees,
  phieuDeXuatList = [],
  initialData,
  prefillValues,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDonDatHang(onClose);
  const updateMutation = useUpdateDonDatHang(onClose);
  const { data: nextSoPo, isLoading: loadingSoPo } = useNextSoPoDonDatHang(!isEdit);
  const { data: hangHoaList = [] } = useHangHoaRefQuery();
  const { data: phanLoaiList = [] } = usePhanLoaiDonDatHangChiTiet();
  const { data: supplierListFromHook = [] } = useDoiTacRefQuery('nha_cung_cap');
  const supplierList = (supplierListProp?.length ? supplierListProp : supplierListFromHook) as DoiTacRefLite[];

  const supplierOptions = useMemo(
    () =>
      supplierList
        .filter((d) => d.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((d) => ({ value: d.id, label: `${d.ma_ncc} - ${d.ten_ncc}` })),
    [supplierList]
  );

  const khoOptions = useMemo(() => {
    const activeKho = khoList.filter((k) => k.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG);
    const base = [
      { value: '' as const, label: t('donDatHang.form.warehousePlaceholder') },
      ...activeKho.map((k) => ({ value: String(k.id), label: k.ten_kho })),
    ];
    // Khi sửa: nếu kho đã chọn không còn trong danh sách (vd. đã ẩn/xóa), vẫn hiển thị tên từ ten_kho_nhan
    if (initialData?.id_kho_nhan && initialData.ten_kho_nhan) {
      const idStr = String(initialData.id_kho_nhan);
      if (!activeKho.some((k) => String(k.id) === idStr)) {
        base.push({ value: idStr, label: initialData.ten_kho_nhan });
      }
    }
    return base;
  }, [khoList, t, initialData?.id_kho_nhan, initialData?.ten_kho_nhan]);

  const phieuDeXuatOptions = useMemo(
    () => [
      { value: '', label: t('donDatHang.form.linkRequestPlaceholder') },
      ...phieuDeXuatList.map((p) => ({ value: p.id, label: `${p.so_phieu} - ${p.ngay}` })),
    ],
    [phieuDeXuatList, t]
  );

  const buyerOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}`,
      })),
    [employees]
  );

  const hangHoaComboboxOptions = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((h) => {
          const ma = h.ma_hang ?? h.ma_hang_hoa ?? '';
          const ten = h.ten_hang ?? h.ten_hang_hoa ?? '';
          const dvt = h.don_vi_tinh ?? h.dvt ?? '';
          return {
            value: h.id,
            label: ma && ten ? `${ma} - ${ten}` : ten || ma || h.id,
            subLabel: dvt ? `${t('donDatHang.form.unit')}: ${dvt}` : undefined,
          };
        }),
    [hangHoaList, t]
  );

  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoaRefLite> = {};
    hangHoaList.forEach((h) => { m[h.id] = h; });
    return m;
  }, [hangHoaList]);

  const phanLoaiOptions = useMemo(
    () => phanLoaiList.map((value) => ({ value, label: value })),
    [phanLoaiList]
  );

  const defaultValues: Partial<DonDatHangFormValues> = {
    so_po: '',
    ngay_dat: getTodayISO().slice(0, 10),
    ngay_giao_dk: getEndOfMonthISO(),
    id_nha_cung_cap: '',
    id_kho_nhan: null,
    id_phieu_de_xuat_vat_tu: null,
    id_nguoi_dat: '',
    id_nguoi_duyet: null,
    dieu_khoan_thanh_toan: '',
    ghi_chu: '',
    trang_thai: 'Nháp',
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<DonDatHangFormValues>({
    resolver: zodResolver(donDatHangSchema) as any,
    defaultValues,
  });

  const { fields, append, remove, replace, update } = useFieldArray({ control, name: 'chi_tiet' });

  const [autoFillPhieuId, setAutoFillPhieuId] = useState<string | null>(null);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [lineDrawerOpen, setLineDrawerOpen] = useState(false);
  const { data: phieuForAutoFill } = usePhieuDeXuatVatTuById(
    !isEdit ? (autoFillPhieuId ?? undefined) : undefined
  );
  const appliedPhieuIdRef = useRef<string | null>(null);
  const chiTietValues = watch('chi_tiet') ?? [];

  useEffect(() => {
    if (!isEdit && nextSoPo) {
      setValue('so_po', nextSoPo);
    }
  }, [isEdit, nextSoPo, setValue]);

  useEffect(() => {
    if (!isEdit && prefillValues?.id_phieu_de_xuat_vat_tu) {
      appliedPhieuIdRef.current = prefillValues.id_phieu_de_xuat_vat_tu;
    }
  }, [isEdit, prefillValues?.id_phieu_de_xuat_vat_tu]);

  useEffect(() => {
    if (!phieuForAutoFill) return;
    if (phieuForAutoFill.id === appliedPhieuIdRef.current) return;
    appliedPhieuIdRef.current = phieuForAutoFill.id;
    const phieuGhiChu = phieuForAutoFill.ghi_chu?.trim();
    if (phieuGhiChu) {
      setValue('ghi_chu', phieuGhiChu);
    }
    if (phieuForAutoFill.chi_tiet?.length) {
      replace(mapPhieuDeXuatChiTietToDonDatHangLines(phieuForAutoFill.chi_tiet));
    }
  }, [phieuForAutoFill, replace, setValue]);

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
          phan_loai: ct.phan_loai ?? null,
          muc_dich_su_dung: ct.muc_dich_su_dung ?? null,
          so_luong: ct.so_luong,
          don_gia: ct.don_gia,
          ghi_chu: ct.ghi_chu ?? '',
        })),
      });
    } else {
      reset({
        ...defaultValues,
        ...prefillValues,
        ngay_dat: getTodayISO().slice(0, 10),
        ngay_giao_dk: prefillValues?.ngay_giao_dk ?? getEndOfMonthISO(),
      });
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
        phan_loai: c.phan_loai?.trim() || null,
        muc_dich_su_dung: c.muc_dich_su_dung?.trim() || null,
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

  const handleAddLine = () => {
    setEditingLineIndex(null);
    setLineDrawerOpen(true);
  };

  const handleEditLine = (index: number) => {
    setEditingLineIndex(index);
    setLineDrawerOpen(true);
  };

  const handleSaveLine = (value: DonDatHangChiTietFormItem) => {
    if (editingLineIndex == null) {
      append(value);
    } else {
      update(editingLineIndex, value);
    }
    setLineDrawerOpen(false);
    setEditingLineIndex(null);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const lineDrawerInitialData =
    editingLineIndex != null
      ? {
          id_hang_hoa: chiTietValues[editingLineIndex]?.id_hang_hoa ?? '',
          phan_loai: chiTietValues[editingLineIndex]?.phan_loai ?? null,
          muc_dich_su_dung: chiTietValues[editingLineIndex]?.muc_dich_su_dung ?? null,
          so_luong: Number(chiTietValues[editingLineIndex]?.so_luong) || 0,
          don_gia: chiTietValues[editingLineIndex]?.don_gia,
          ghi_chu: chiTietValues[editingLineIndex]?.ghi_chu ?? '',
        }
      : EMPTY_LINE;

  return (
    <>
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
              placeholder={!isEdit && loadingSoPo ? t('donDatHang.form.codeLoading') : t('donDatHang.form.codePlaceholder')}
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
                <Combobox
                  label={t('donDatHang.form.supplier')}
                  options={supplierOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('donDatHang.form.supplierPlaceholder')}
                  icon={<Building2 size={12} />}
                  required
                  error={errors.id_nha_cung_cap?.message}
                  searchable
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="id_kho_nhan"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('donDatHang.form.warehouse')}
                  options={khoOptions}
                  value={field.value != null ? String(field.value) : ''}
                  onChange={(v) => field.onChange(v === '' || v == null ? null : String(v))}
                  placeholder={t('donDatHang.form.warehousePlaceholder')}
                  icon={<Warehouse size={12} />}
                  error={errors.id_kho_nhan?.message}
                  searchable
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="id_phieu_de_xuat_vat_tu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('donDatHang.form.linkRequest')}
                  options={phieuDeXuatOptions}
                  value={field.value ?? ''}
                  onChange={(v) => {
                    field.onChange(v === '' ? null : v);
                    if (!isEdit) setAutoFillPhieuId(v || null);
                  }}
                  placeholder={t('donDatHang.form.linkRequestPlaceholder')}
                  icon={<FileText size={12} />}
                  disabled={isEdit}
                  error={errors.id_phieu_de_xuat_vat_tu?.message}
                  searchable
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="id_nguoi_dat"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('donDatHang.form.buyer')}
                  options={buyerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('donDatHang.form.buyerPlaceholder')}
                  icon={<User size={12} />}
                  required
                  error={errors.id_nguoi_dat?.message}
                  searchable
                  dropdownInPortal
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
          </FormGrid>
        </FormSection>

        <GenericSubTableSection
          title={t('donDatHang.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('donDatHang.form.addRow')}
          onAdd={handleAddLine}
          emptyTitle={t('donDatHang.form.noItems')}
          emptyDescription={t('donDatHang.form.noItemsHint')}
          maxTableHeight="320px"
        >
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('donDatHang.chiTietTab.categoryLevel1Col')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('donDatHang.chiTietTab.categoryLevel2Col')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[150px]">{t('donDatHang.chiTietTab.classificationCol')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[112px]">{t('donDatHang.chiTietTab.itemCodeCol')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[260px]">{t('donDatHang.chiTietTab.itemNameCol')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[112px]">{t('donDatHang.form.quantity')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[104px]">{t('donDatHang.form.unitPrice')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[116px]">{t('donDatHang.form.amount')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[88px]">{t('donDatHang.form.unit')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">{t('donDatHang.chiTietTab.purposeOfUseCol')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">{t('donDatHang.form.note')}</th>
              <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center min-w-[88px] bg-muted border-l border-border">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  {t('donDatHang.form.noItems')}
                </td>
              </tr>
            ) : (
              fields.map((field, index) => {
                const idHangHoa = chiTietValues[index]?.id_hang_hoa ?? '';
                const h = idHangHoa ? hangHoaMap[idHangHoa] : null;
                const donVi = h ? (h.dvt ?? h.don_vi_tinh ?? '—') : '—';
                const maHang = h ? (h.ma_hang ?? h.ma_hang_hoa ?? '—') : '—';
                const tenHang = h ? (h.ten_hang ?? h.ten_hang_hoa ?? '—') : '—';
                const soLuong = Number(chiTietValues[index]?.so_luong) || 0;
                const donGia = Number(chiTietValues[index]?.don_gia) || 0;
                const thanhTien = soLuong * donGia;
                return (
                  <tr key={field.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{h?.ten_danh_muc_cap1 ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{h?.ten_danh_muc_cap2 ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate" title={chiTietValues[index]?.phan_loai ?? ''}>
                      {chiTietValues[index]?.phan_loai || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{maHang}</td>
                    <td className="px-4 py-2.5 text-sm min-w-[12rem] max-w-md truncate" title={tenHang}>{tenHang}</td>
                    <td className="px-4 py-2.5 text-xs tabular-nums">{formatNumberVN(soLuong)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">{formatNumberVN(donGia)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {formatNumberVN(thanhTien)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{donVi}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs truncate" title={chiTietValues[index]?.muc_dich_su_dung ?? ''}>
                      {chiTietValues[index]?.muc_dich_su_dung?.trim() || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-sm truncate" title={chiTietValues[index]?.ghi_chu ?? ''}>
                      {chiTietValues[index]?.ghi_chu || '—'}
                    </td>
                    <td className="sticky right-0 z-[1] px-4 py-2.5 bg-card border-l border-border/50">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditLine(index)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                          title={t('common.edit')}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
                  <td colSpan={6} className="px-4 py-2.5 text-muted-foreground text-xs" />
                  <td className="px-4 py-2.5 text-xs tabular-nums">{formatNumberVN(tongSoLuong)}</td>
                  <td className="px-4 py-2.5 text-xs" />
                  <td className="px-4 py-2.5 text-xs tabular-nums">{formatNumberVN(tongTien)}</td>
                  <td colSpan={3} className="px-4 py-2.5 text-xs" />
                </tr>
              );
            })()}
          </tbody>
        </GenericSubTableSection>
      </form>
      </GenericDrawer>

      <ChiTietLineDrawer
        open={lineDrawerOpen}
        mode={editingLineIndex == null ? 'add' : 'edit'}
        initialData={lineDrawerInitialData}
        hangHoaOptions={hangHoaComboboxOptions}
        phanLoaiOptions={phanLoaiOptions}
        hangHoaMap={hangHoaMap}
        onClose={() => {
          setLineDrawerOpen(false);
          setEditingLineIndex(null);
        }}
        onSave={handleSaveLine}
      />
    </>
  );
};

export default DonDatHangForm;
