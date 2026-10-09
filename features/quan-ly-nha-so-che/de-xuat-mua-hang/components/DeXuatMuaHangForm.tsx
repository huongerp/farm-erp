import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller, SubmitHandler, useFieldArray, type FieldErrors, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FileText, Calendar, Warehouse, User, UserCheck, Package, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import { DeXuatMuaHangFormValues, deXuatMuaHangSchema } from '../core/schema';
import type { DeXuatMuaHang } from '../core/types';
import {
  SO_NGAY_MAC_DINH_NGAY_CAN,
  SO_PHIEU_DO_DAI,
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DE_XUAT_MUA_HANG,
  trangThaiToI18nKey,
} from '../core/constants';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { FarmHangHoa } from '../../hang-hoa-phan-thuoc/core/types';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useAuthStore } from '../../../../store/useStore';
import { useCreateDeXuatMuaHang, useUpdateDeXuatMuaHang } from '../hooks/use-de-xuat-mua-hang';
import { useFarmHangHoaRefQuery } from '../../hang-hoa-phan-thuoc/hooks/use-farm-hang-hoa';
import type { FarmHangHoaRefLite } from '../../hang-hoa-phan-thuoc/services/farm-hang-hoa-service';
import { useFarmTienDoMuaHangList } from '../../thiet-lap-de-xuat-mua-hang/hooks/use-farm-tien-do-mua-hang';
import { getNextSoPhieuDeXuatMuaHangRpc } from '../services/de-xuat-mua-hang-db.service';
import GenericDrawer, { DRAWER_WIDTH_DE_XUAT } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import SubTableActionButton from '../../../../components/shared/sub-table/SubTableActionButton';
import { cn } from '../../../../lib/utils';
import { dongDeXuatDoDang } from '../../../../lib/de-xuat-chi-tiet';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const ADD_HANG_HOA = '__add_hang_hoa__';

interface Props {
  khoList: Kho[];
  employees: EmployeeRef[];
  initialData?: DeXuatMuaHang | null;
  onClose: () => void;
  /** When false (phiếu đã duyệt), form is read-only */
  canEdit?: boolean;
  /** Gọi khi user chọn "Thêm hàng hóa mới" trong dropdown hàng hóa (như phiếu kho). */
  onRequestAddHangHoa?: () => Promise<FarmHangHoa | null>;
}

/** Lấy id chi nhánh đầu tiên của user (User.id_chi_nhanh có thể là string hoặc string[]) */
function getUserBranchId(user: { id_chi_nhanh?: string | string[] | null } | null): string | null {
  if (!user?.id_chi_nhanh) return null;
  return Array.isArray(user.id_chi_nhanh) ? user.id_chi_nhanh[0] ?? null : (user.id_chi_nhanh as string) ?? null;
}

/** Giá trị trống của form — hằng ngoài component để effect reset không phụ thuộc tham chiếu mới mỗi lần render. */
const DEFAULT_FORM_VALUES: Partial<DeXuatMuaHangFormValues> = {
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

const DeXuatMuaHangForm: React.FC<Props> = ({ khoList, employees, initialData, onClose, canEdit = true, onRequestAddHangHoa }) => {
  const bt = useKhoBienThe();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData?.id;
  const createMutation = useCreateDeXuatMuaHang(onClose);
  const updateMutation = useUpdateDeXuatMuaHang(onClose);
  const { data: hangHoaList = [] } = useFarmHangHoaRefQuery();
  const { data: tienDoMuaHangList = [] } = useFarmTienDoMuaHangList();
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
      hangHoaList.map((h) => ({
        value: h.id,
        label: `${h.ma_hang} - ${h.ten_hang}`,
        subLabel: h.don_vi_tinh ? `${t('deXuatMuaHang.form.unit')}: ${h.don_vi_tinh}` : undefined,
      })),
    [hangHoaList, t]
  );

  const hangHoaComboboxOptionsWithAdd = useMemo(
    () => [
      ...(onRequestAddHangHoa ? [{ value: ADD_HANG_HOA, label: `➕ ${t('deXuatMuaHang.form.addProduct')}`, subLabel: undefined }] : []),
      ...hangHoaComboboxOptions,
    ],
    [hangHoaComboboxOptions, onRequestAddHangHoa, t]
  );

  const renderAddOption = (opt: { value: string | number; label: string }) =>
    opt.value === ADD_HANG_HOA ? <span className="text-primary font-medium">{opt.label}</span> : undefined;

  const hangHoaMap = useMemo(() => {
    const m: Record<string, FarmHangHoaRefLite> = {};
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


  const { register, handleSubmit, formState: { errors, isDirty, isSubmitted }, reset, control, setValue } = useForm<DeXuatMuaHangFormValues>({
    resolver: zodResolver(deXuatMuaHangSchema) as Resolver<DeXuatMuaHangFormValues>,
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });
  const chiTietValues = useWatch({ control, name: 'chi_tiet' }) ?? [];

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
        ngay_can: addDays(todayStr, SO_NGAY_MAC_DINH_NGAY_CAN),
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
      // Không gọi RPC khi mở form (tránh tốn số). Mã phiếu sinh khi bấm Lưu.
    } else {
      const today = new Date().toISOString().slice(0, 10);
      reset({
        ...DEFAULT_FORM_VALUES,
        so_phieu: '',
        ngay: today,
        ngay_can: addDays(today, SO_NGAY_MAC_DINH_NGAY_CAN),
        trang_thai: TRANG_THAI_CHO_DUYET,
      });
      // Không gọi RPC khi mở form (tránh tốn số). Mã phiếu sinh khi bấm Lưu.
      if (user?.id) setValue('id_nguoi_de_xuat', user.id);
      if (defaultKhoByBranch?.id) setValue('id_noi_de_xuat', defaultKhoByBranch.id);
    }
  }, [initialData, isCopy, reset, user?.id, defaultKhoByBranch?.id, setValue, defaultTienDoMuaHang]);

  // Không gọi RPC khi mở form — chỉ gọi khi submit để tránh tốn số sequence mỗi lần bấm Thêm phiếu.

  const onSubmit: SubmitHandler<DeXuatMuaHangFormValues> = async (data) => {
    const validChiTiet = (data.chi_tiet ?? []).filter(
      (c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0
    );
    const doDang = dongDeXuatDoDang(data.chi_tiet ?? []);
    if (doDang.length > 0) {
      // Trước đây dòng dở dang bị lọc ngầm — phiếu lưu xong thiếu hàng mà không ai biết.
      toast.error(t('deXuatMuaHang.validation.lineIncomplete', { rows: doDang.map((i) => i + 1).join(', ') }));
      return;
    }
    if (validChiTiet.length === 0) {
      toast.error(t('deXuatMuaHang.validation.atLeastOneItem'));
      return;
    }
    let soPhieu = data.so_phieu?.trim() ?? '';
    if (!isEdit) {
      try {
        soPhieu = await getNextSoPhieuDeXuatMuaHangRpc(bt, {
          tien_to_so_phieu: bt.tienTo.deXuat,
          do_dai_phan_so: SO_PHIEU_DO_DAI,
        });
      } catch {
        toast.error(t('deXuatMuaHang.service.duplicateCode'));
        return;
      }
    }
    const sanitized: DeXuatMuaHangFormValues = {
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

  const onInvalid = (errs: FieldErrors<DeXuatMuaHangFormValues>) => {
    const chiTietMsg = errs.chi_tiet?.message ?? errs.chi_tiet?.root?.message;
    if (chiTietMsg) toast.error(chiTietMsg);
  };

  const addRow = () => {
    append(
      {
        id_hang_hoa: '',
        so_luong: 0,
        thong_so: '',
        ghi_chu: '',
        id_tien_do_mh: defaultTienDoMuaHang?.id ?? null,
        ten_tien_do_mh: defaultTienDoMuaHang?.ten ?? null,
      },
      { shouldFocus: false }
    );
    // Dòng mới nằm cuối danh sách — trên mobile thường khuất dưới màn hình.
    const newIndex = fields.length;
    requestAnimationFrame(() =>
      document.getElementById(`de-xuat-mua-hang-form-row-${newIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    );
  };

  const chiTietError = errors.chi_tiet?.message ?? errors.chi_tiet?.root?.message;
  // Chỉ tô đỏ sau lần bấm Lưu đầu tiên — không mắng khi đang nhập dở.
  const dongDoDang = new Set(isSubmitted ? dongDeXuatDoDang(chiTietValues) : []);

  const chiTietColumns: SubTableColumn[] = [
    { id: 'hang_hoa', label: t('deXuatMuaHang.form.item'), width: 300, minWidth: 200, sticky: true },
    { id: 'so_luong', label: t('deXuatMuaHang.form.quantity'), width: 130, minWidth: 96 },
    { id: 'dvt', label: t('deXuatMuaHang.form.unit'), width: 80, minWidth: 56 },
    { id: 'tien_do', label: t('deXuatMuaHang.form.tienDoMh'), width: 180, minWidth: 130 },
    { id: 'thong_so', label: t('deXuatMuaHang.form.specs'), width: 220, minWidth: 140 },
    { id: 'ghi_chu', label: t('deXuatMuaHang.form.note'), width: 220, minWidth: 140 },
  ];

  const renderChiTietField = (colId: string, index: number): React.ReactNode => {
    const row = chiTietValues[index];
    const idHangHoa = row?.id_hang_hoa ?? '';
    const doDang = dongDoDang.has(index);
    switch (colId) {
      case 'hang_hoa':
        return (
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
                placeholder={t('deXuatMuaHang.form.itemPlaceholder')}
                searchable
                triggerClassName={cn('h-9 text-sm border-border rounded-md', doDang && !idHangHoa && 'border-rose-500')}
                dropdownInPortal
                renderOption={renderAddOption}
                disabled={readOnly}
              />
            )}
          />
        );
      case 'so_luong':
        return (
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
                className={cn('w-full border-border', doDang && !!idHangHoa && 'border-rose-500')}
                compact
              />
            )}
          />
        );
      case 'dvt':
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {idHangHoa ? (hangHoaMap[idHangHoa]?.don_vi_tinh ?? '—') : '—'}
          </span>
        );
      case 'tien_do':
        return (
          <Controller
            name={`chi_tiet.${index}.id_tien_do_mh`}
            control={control}
            render={({ field: f }) => (
              <Combobox
                options={tienDoMuaHangOptions}
                value={f.value ?? null}
                onChange={(v) => {
                  const item = tienDoMuaHangList.find((td) => td.id === v);
                  f.onChange(v ?? null);
                  if (item) setValue(`chi_tiet.${index}.ten_tien_do_mh`, item.ten);
                }}
                placeholder={t('deXuatMuaHang.form.tienDoMhPlaceholder')}
                searchable
                triggerClassName="h-9 text-sm border-border rounded-md"
                dropdownInPortal
                disabled={readOnly}
              />
            )}
          />
        );
      case 'thong_so':
        return (
          <Textarea
            placeholder={t('deXuatMuaHang.form.specsPlaceholder')}
            className="min-h-[52px] text-sm border-border w-full resize-y"
            disabled={readOnly}
            rows={2}
            {...register(`chi_tiet.${index}.thong_so`)}
          />
        );
      case 'ghi_chu':
        return (
          <Textarea
            placeholder={t('deXuatMuaHang.form.notePlaceholder')}
            className="min-h-[52px] text-sm border-border w-full resize-y"
            disabled={readOnly}
            rows={2}
            {...register(`chi_tiet.${index}.ghi_chu`)}
          />
        );
      default:
        return null;
    }
  };

  /** Mobile: một dòng hàng = một card xếp dọc, ô nhập full chiều ngang. */
  const renderChiTietMobileCard = (index: number) => (
    <div
      id={`de-xuat-mua-hang-form-row-${index}`}
      className={cn(
        'rounded-xl border bg-card p-3 space-y-3 shadow-sm',
        dongDoDang.has(index) ? 'border-rose-400' : 'border-border'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-7 px-2.5 items-center rounded-md bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
          #{index + 1}
        </span>
        {!readOnly && (
          <SubTableActionButton
            tone="danger"
            label={t('common.delete')}
            icon={<Trash2 size={14} />}
            onClick={() => remove(index)}
          />
        )}
      </div>
      {chiTietColumns
        .filter((c) => c.id !== 'so_luong' && c.id !== 'dvt')
        .map((c) => (
          <React.Fragment key={c.id}>
            <div className="space-y-1">
              <span className="text-caption font-medium text-muted-foreground">{c.label}</span>
              {renderChiTietField(c.id, index)}
            </div>
            {c.id === 'hang_hoa' && (
              <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                <div className="space-y-1 min-w-0">
                  <span className="text-caption font-medium text-muted-foreground">{t('deXuatMuaHang.form.quantity')}</span>
                  {renderChiTietField('so_luong', index)}
                </div>
                <div className="space-y-1 pb-2">
                  <span className="text-caption font-medium text-muted-foreground block">{t('deXuatMuaHang.form.unit')}</span>
                  {renderChiTietField('dvt', index)}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
    </div>
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('deXuatMuaHang.form.editTitle') : t('deXuatMuaHang.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      isDirty={!readOnly && isDirty}
      footer={
        readOnly ? null : (
          <FormDrawerFooter
            formId="de-xuat-mua-hang-form"
            onCancel={onClose}
            isLoading={isLoading}
            isEdit={isEdit}
            saveLabel={t('deXuatMuaHang.form.save')}
            createLabel={t('deXuatMuaHang.form.create')}
          />
        )
      }
      maxWidthClass={DRAWER_WIDTH_DE_XUAT}
    >
      <form
        id="de-xuat-mua-hang-form"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="space-y-5"
      >
        <FormSection title={t('deXuatMuaHang.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('deXuatMuaHang.form.code')}
              placeholder={
                isEdit ? t('deXuatMuaHang.form.codePlaceholder') : t('deXuatMuaHang.form.autoCodePlaceholder')
              }
              icon={<FileText size={12} />}
              disabled={!isEdit || readOnly}
              {...register('so_phieu')}
              error={errors.so_phieu?.message}
            />
            <Input
              label={t('deXuatMuaHang.form.date')}
              type="date"
              icon={<Calendar size={12} />}
              required
              disabled={readOnly}
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <Input
              label={t('deXuatMuaHang.form.requiredDate')}
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
                  label={t('deXuatMuaHang.form.place')}
                  options={khoComboboxOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('deXuatMuaHang.form.placePlaceholder')}
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
                  label={t('deXuatMuaHang.form.requester')}
                  options={requesterComboboxOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('deXuatMuaHang.form.requesterPlaceholder')}
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
                    label={t('deXuatMuaHang.form.approver')}
                    options={approverComboboxOptions}
                    value={field.value ?? null}
                    onChange={(v) => field.onChange(v === '' || v == null ? null : v)}
                    placeholder={t('deXuatMuaHang.form.approverPlaceholder')}
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
                label={t('deXuatMuaHang.form.notes')}
                placeholder={t('deXuatMuaHang.form.notesPlaceholder')}
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
                      label={t('deXuatMuaHang.form.status')}
                      options={TRANG_THAI_DE_XUAT_MUA_HANG.map((value) => ({
                        value,
                        label: t(`deXuatMuaHang.status.${trangThaiToI18nKey(value)}`),
                      }))}
                      value={field.value ?? ''}
                      onChange={(v) => field.onChange(v ?? TRANG_THAI_CHO_DUYET)}
                      placeholder={t('deXuatMuaHang.form.status')}
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
          title={t('deXuatMuaHang.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('deXuatMuaHang.form.addRow')}
          onAdd={readOnly ? undefined : addRow}
          emptyTitle={t('deXuatMuaHang.form.noItems')}
          emptyDescription={t('deXuatMuaHang.form.noItemsHint')}
          contentMode="raw"
        >
          {fields.length > 0 && (
            <SubTable
              tableKey="de-xuat-mua-hang.form"
              columns={chiTietColumns}
              rows={fields}
              keyExtractor={(field) => field.id}
              renderCell={(colId, _field, index) => renderChiTietField(colId, index)}
              renderActions={
                readOnly
                  ? undefined
                  : (_field, index) => (
                      <SubTableActionButton
                        tone="danger"
                        label={t('common.delete')}
                        icon={<Trash2 size={14} />}
                        onClick={() => remove(index)}
                      />
                    )
              }
              actionsWidth={64}
              rowClassName={(_field, index) => (dongDoDang.has(index) ? 'bg-rose-50/60 dark:bg-rose-950/20' : undefined)}
              renderMobileCard={(_field, index) => renderChiTietMobileCard(index)}
            />
          )}
        </GenericSubTableSection>
        {chiTietError && (
          <p role="alert" className="-mt-3 px-1 text-xs text-destructive">
            {chiTietError}
          </p>
        )}
      </form>
    </GenericDrawer>
  );
};

export default DeXuatMuaHangForm;
