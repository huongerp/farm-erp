import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FileText, Calendar, Warehouse, User, UserCheck, Package, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import { PhieuDeXuatVatTuFormValues, phieuDeXuatVatTuSchema } from '../core/schema';
import type { PhieuDeXuatVatTu } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import type { Employee } from '../../../he-thong/nhan-vien/core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useAuthStore } from '../../../../store/useStore';
import { useCreatePhieuDeXuatVatTu, useUpdatePhieuDeXuatVatTu } from '../hooks/use-phieu-de-xuat-vat-tu';
import { useHangHoaList } from '../../danh-sach-hang-hoa/hooks/use-hang-hoa';
import { useCauHinhDeXuatVatTu, useGetNextSoPhieuAndIncrement } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/hooks/use-cau-hinh-de-xuat-vat-tu';
import { useTienDoMuaHangList } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/hooks/use-tien-do-mua-hang';
import { getNextSoPhieuPreview } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/services/thiet-lap-de-xuat-vat-tu-service';
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

const ADD_HANG_HOA = '__add_hang_hoa__';

interface Props {
  khoList: Kho[];
  employees: Employee[];
  initialData?: PhieuDeXuatVatTu | null;
  onClose: () => void;
  /** When false (e.g. approved and config disallows edit), form is read-only */
  canEdit?: boolean;
  /** Gọi khi user chọn "Thêm hàng hóa mới" trong dropdown hàng hóa (như phiếu kho). */
  onRequestAddHangHoa?: () => Promise<HangHoa | null>;
}

/** Lấy id chi nhánh đầu tiên của user (User.id_chi_nhanh có thể là string hoặc string[]) */
function getUserBranchId(user: { id_chi_nhanh?: string | string[] | null } | null): string | null {
  if (!user?.id_chi_nhanh) return null;
  return Array.isArray(user.id_chi_nhanh) ? user.id_chi_nhanh[0] ?? null : (user.id_chi_nhanh as string) ?? null;
}

const PhieuDeXuatVatTuForm: React.FC<Props> = ({ khoList, employees, initialData, onClose, canEdit = true, onRequestAddHangHoa }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData?.id;
  const createMutation = useCreatePhieuDeXuatVatTu(onClose);
  const updateMutation = useUpdatePhieuDeXuatVatTu(onClose);
  const { data: hangHoaList = [] } = useHangHoaList();
  const { data: tienDoMuaHangList = [] } = useTienDoMuaHangList();
  const { data: config } = useCauHinhDeXuatVatTu();
  const getNextSoPhieu = useGetNextSoPhieuAndIncrement();
  const readOnly = isEdit && !canEdit;
  const isCreate = !isEdit;

  const khoComboboxOptions = useMemo(
    () => khoList.map((k) => ({ value: k.id, label: k.ten_kho })),
    [khoList]
  );

  const requesterComboboxOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}`,
        subLabel: e.ho_ten,
      })),
    [employees]
  );

  const approverComboboxOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}`,
        subLabel: e.ho_ten,
      })),
    [employees]
  );

  const hangHoaComboboxOptions = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((h) => ({
          value: h.id,
          label: `${h.ma_hang} - ${h.ten_hang}`,
          subLabel: h.don_vi_tinh ? `${t('phieuDeXuatVatTu.form.unit')}: ${h.don_vi_tinh}` : undefined,
        })),
    [hangHoaList, t]
  );

  const hangHoaComboboxOptionsWithAdd = useMemo(
    () => [
      ...(onRequestAddHangHoa ? [{ value: ADD_HANG_HOA, label: `➕ ${t('phieuDeXuatVatTu.form.addProduct')}`, subLabel: undefined }] : []),
      ...hangHoaComboboxOptions,
    ],
    [hangHoaComboboxOptions, onRequestAddHangHoa, t]
  );

  const renderAddOption = (opt: { value: string | number; label: string }) =>
    opt.value === ADD_HANG_HOA ? <span className="text-primary font-medium">{opt.label}</span> : undefined;

  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoa> = {};
    hangHoaList.forEach((h) => {
      m[h.id] = h;
    });
    return m;
  }, [hangHoaList]);

  /** Tiến độ mua hàng có thứ tự nhỏ nhất (mặc định khi thêm dòng mới) */
  const defaultTienDoMuaHang = useMemo(() => {
    const sorted = [...tienDoMuaHangList].filter((t) => t.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG);
    sorted.sort((a, b) => a.thu_tu - b.thu_tu);
    return sorted[0] ?? null;
  }, [tienDoMuaHangList]);

  const tienDoMuaHangOptions = useMemo(
    () =>
      tienDoMuaHangList
        .filter((t) => t.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .sort((a, b) => a.thu_tu - b.thu_tu)
        .map((t) => ({ value: t.id, label: t.ten })),
    [tienDoMuaHangList]
  );

  const defaultValues: Partial<PhieuDeXuatVatTuFormValues> = {
    so_phieu: '',
    ngay: '',
    ngay_can: '',
    id_noi_de_xuat: '',
    id_nguoi_de_xuat: '',
    id_nguoi_duyet: null,
    ghi_chu: '',
    trang_thai: 'Chờ duyệt',
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<PhieuDeXuatVatTuFormValues>({
    resolver: zodResolver(phieuDeXuatVatTuSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });
  const chiTietValues = watch('chi_tiet') ?? [];

  const defaultKhoByBranch = useMemo(() => {
    const branchId = getUserBranchId(user);
    if (!branchId) return null;
    return khoList.find((k) => k.id_chi_nhanh === branchId) ?? null;
  }, [user, khoList]);

  const isCopy = !!initialData && !initialData.id;

  useEffect(() => {
    if (initialData && !isCopy) {
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
          id_tien_do_mh: ct.id_tien_do_mh ?? null,
          ten_tien_do_mh: ct.ten_tien_do_mh ?? null,
          trao_doi: ct.trao_doi ?? null,
        })),
      });
    } else if (isCopy) {
      const todayStr = new Date().toISOString().slice(0, 10);
      reset({
        so_phieu: '',
        ngay: todayStr,
        ngay_can: config ? addDays(todayStr, config.so_ngay_mac_dinh_ngay_can ?? 0) : '',
        id_noi_de_xuat: initialData.id_noi_de_xuat,
        id_nguoi_de_xuat: user?.id ?? initialData.id_nguoi_de_xuat,
        id_nguoi_duyet: null,
        ghi_chu: '',
        trang_thai: TRANG_THAI_CHO_DUYET,
        chi_tiet: (initialData.chi_tiet ?? []).map((ct) => ({
          id_hang_hoa: ct.id_hang_hoa,
          so_luong: ct.so_luong,
          thong_so: ct.thong_so ?? '',
          ghi_chu: ct.ghi_chu ?? '',
          id_tien_do_mh: ct.id_tien_do_mh ?? defaultTienDoMuaHang?.id ?? null,
          ten_tien_do_mh: ct.ten_tien_do_mh ?? defaultTienDoMuaHang?.ten ?? null,
          trao_doi: null,
        })),
      });
      if (config?.tu_sinh_so_phieu) {
        getNextSoPhieuPreview().then((preview) => {
          if (preview) setValue('so_phieu', preview);
        });
      }
    } else if (config) {
      const today = new Date().toISOString().slice(0, 10);
      reset({
        ...defaultValues,
        so_phieu: '',
        ngay: today,
        ngay_can: addDays(today, config.so_ngay_mac_dinh_ngay_can ?? 0),
        trang_thai: TRANG_THAI_CHO_DUYET,
      });
      if (config.tu_sinh_so_phieu) {
        getNextSoPhieuPreview().then((preview) => {
          if (preview) setValue('so_phieu', preview);
        });
      }
      if (user?.id) setValue('id_nguoi_de_xuat', user.id);
      if (defaultKhoByBranch?.id) setValue('id_noi_de_xuat', defaultKhoByBranch.id);
    } else {
      reset(defaultValues);
      if (user?.id) setValue('id_nguoi_de_xuat', user.id);
      if (defaultKhoByBranch?.id) setValue('id_noi_de_xuat', defaultKhoByBranch.id);
    }
  }, [initialData, config, reset, user?.id, defaultKhoByBranch?.id, setValue, defaultTienDoMuaHang]);

  // Khi tạo mới và bật tự sinh số phiếu: đảm bảo preview luôn được điền (kể cả config load sau)
  useEffect(() => {
    if (isEdit || !config?.tu_sinh_so_phieu) return;
    getNextSoPhieuPreview().then((preview) => {
      if (preview) setValue('so_phieu', preview);
    });
  }, [isEdit, config?.tu_sinh_so_phieu, setValue]);

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
        id_tien_do_mh: c.id_tien_do_mh?.trim() || null,
        ten_tien_do_mh: c.ten_tien_do_mh?.trim() || null,
        trao_doi: c.trao_doi?.trim() || null,
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
                <Combobox
                  label={t('phieuDeXuatVatTu.form.place')}
                  options={khoComboboxOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('phieuDeXuatVatTu.form.placePlaceholder')}
                  searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
                  icon={<Warehouse size={12} />}
                  required
                  disabled={readOnly}
                  error={errors.id_noi_de_xuat?.message}
                  searchable
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="id_nguoi_de_xuat"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('phieuDeXuatVatTu.form.requester')}
                  options={requesterComboboxOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('phieuDeXuatVatTu.form.requesterPlaceholder')}
                  searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
                  icon={<User size={12} />}
                  required
                  disabled={readOnly}
                  error={errors.id_nguoi_de_xuat?.message}
                  searchable
                  dropdownInPortal
                />
              )}
            />
            {!isCreate && (
              <Controller
                name="id_nguoi_duyet"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('phieuDeXuatVatTu.form.approver')}
                    options={approverComboboxOptions}
                    value={field.value ?? null}
                    onChange={(v) => field.onChange(v === '' || v == null ? null : v)}
                    placeholder={t('phieuDeXuatVatTu.form.approverPlaceholder')}
                    searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
                    icon={<UserCheck size={12} />}
                    disabled={readOnly}
                    error={errors.id_nguoi_duyet?.message}
                    searchable
                    dropdownInPortal
                  />
                )}
              />
            )}
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
            {!isCreate && (
              <div className="col-span-1 sm:col-span-2">
                <Controller
                  name="trang_thai"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      label={t('phieuDeXuatVatTu.form.status')}
                      options={[
                        { value: TRANG_THAI_CHO_DUYET, label: t('phieuDeXuatVatTu.status.pending') },
                        { value: TRANG_THAI_DA_DUYET, label: t('phieuDeXuatVatTu.status.approved') },
                        { value: TRANG_THAI_KHONG_DUYET, label: t('phieuDeXuatVatTu.status.rejected') },
                      ]}
                      value={field.value ?? ''}
                      onChange={(v) => field.onChange(v ?? TRANG_THAI_CHO_DUYET)}
                      placeholder={t('phieuDeXuatVatTu.form.status')}
                      searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
                      disabled={readOnly}
                      searchable
                      dropdownInPortal
                    />
                  )}
                />
              </div>
            )}
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
            append({
              id_hang_hoa: '',
              so_luong: 0,
              thong_so: '',
              ghi_chu: '',
              id_tien_do_mh: defaultTienDoMuaHang?.id ?? null,
              ten_tien_do_mh: defaultTienDoMuaHang?.ten ?? null,
            });
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
                {t('phieuDeXuatVatTu.form.tienDoMh')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">
                {t('phieuDeXuatVatTu.form.specs')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">
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
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-xs">
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
                            options={hangHoaComboboxOptionsWithAdd}
                            value={f.value || null}
                            onChange={(v) => {
                              if (v === ADD_HANG_HOA) {
                                onRequestAddHangHoa?.().then((h) => {
                                  if (h) setValue(`chi_tiet.${index}.id_hang_hoa`, h.id);
                                });
                                return;
                              }
                              f.onChange(v ?? '');
                            }}
                            placeholder={t('phieuDeXuatVatTu.form.itemPlaceholder')}
                            searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
                            searchable
                            triggerClassName="h-9 text-sm border-border rounded-md"
                            dropdownInPortal
                            renderOption={renderAddOption}
                          />
                        )}
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px] align-top">
                      <Controller
                        name={`chi_tiet.${index}.so_luong`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            value={field.value}
                            onChange={(v) => field.onChange(v)}
                            onBlur={field.onBlur}
                            min={0}
                            maxFractionDigits={4}
                            disabled={readOnly}
                            className="min-w-[6rem] max-w-[10rem] border-border"
                            compact
                          />
                        )}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{donVi}</td>
                    <td className="px-4 py-2.5 min-w-[140px] align-top">
                      <Controller
                        name={`chi_tiet.${index}.id_tien_do_mh`}
                        control={control}
                        render={({ field: f }) => (
                          <Combobox
                            options={tienDoMuaHangOptions}
                            value={f.value ?? null}
                            onChange={(v) => {
                              const item = tienDoMuaHangList.find((t) => t.id === v);
                              f.onChange(v ?? null);
                              if (item) setValue(`chi_tiet.${index}.ten_tien_do_mh`, item.ten);
                            }}
                            placeholder={t('phieuDeXuatVatTu.form.tienDoMhPlaceholder')}
                            searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
                            searchable
                            triggerClassName="h-9 text-sm border-border rounded-md"
                            dropdownInPortal
                            disabled={readOnly}
                          />
                        )}
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[200px] align-top">
                      <Textarea
                        placeholder={t('phieuDeXuatVatTu.form.specsPlaceholder')}
                        className="min-h-[52px] text-sm border-border w-full resize-y"
                        disabled={readOnly}
                        rows={2}
                        {...register(`chi_tiet.${index}.thong_so`)}
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[200px] align-top">
                      <Textarea
                        placeholder={t('phieuDeXuatVatTu.form.notePlaceholder')}
                        className="min-h-[52px] text-sm border-border w-full resize-y"
                        disabled={readOnly}
                        rows={2}
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
