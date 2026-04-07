import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Warehouse, ArrowRightLeft, User, CheckCircle, Truck, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { usePhieuKhoStore } from '../store/usePhieuKhoStore';
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import { DATE_RANGE_PRESETS } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';

interface Props {
  /** Toàn bộ phiếu trong tab (chưa lọc chip) — dùng cho số đếm trên chip */
  data: PhieuKho[];
  loai: LoaiPhieuKhoTab;
  khoList: Kho[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

/** Tránh crash MultiSelect khi state/HMR để filter không phải mảng. */
function asStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return [];
}

const PhieuKhoToolbar: React.FC<Props> = ({
  data: dataProp,
  loai,
  khoList: khoListProp,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  canCreate = true,
  canDelete = true,
}) => {
  const data = Array.isArray(dataProp) ? dataProp : [];
  const khoList = Array.isArray(khoListProp) ? khoListProp : [];
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearSelection,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = usePhieuKhoStore();

  const isChuyen = loai === 'chuyen';
  const isNhap = loai === 'nhap';
  const isXuat = loai === 'xuat';
  const labelKho = isNhap ? t('phieuKho.form.warehouseTo') : t('phieuKho.form.warehouseFrom');

  const datePreset = typeof filters.datePreset === 'string' ? filters.datePreset : 'all';
  const customFrom = typeof filters.customDateFrom === 'string' ? filters.customDateFrom : '';
  const customEnd = typeof filters.customDateEnd === 'string' ? filters.customDateEnd : '';

  const dateRangeLabel = useMemo(() => {
    const range = getDateRangeFromPreset(
      datePreset as DateRangePresetId,
      customFrom ? new Date(customFrom) : undefined,
      customEnd ? new Date(customEnd) : undefined
    );
    return range.label;
  }, [datePreset, customFrom, customEnd]);

  const dateFilterActive = useMemo(
    () =>
      (datePreset && datePreset !== 'all') ||
      !!customFrom.trim() ||
      !!customEnd.trim(),
    [datePreset, customFrom, customEnd]
  );

  const statusArr = asStringArray(filters.status);
  const khoIdsArr = asStringArray(filters.khoIds);
  const khoDenIdsArr = asStringArray(filters.khoDenIds);
  const nguoiTaoArr = asStringArray(filters.nguoiTaoIds);
  const nguoiDuyetArr = asStringArray(filters.nguoiDuyetIds);
  const doiTacArr = asStringArray(filters.doiTacIds);

  const statusLen = statusArr.length;
  const khoIdsLen = khoIdsArr.length;
  const khoDenIdsLen = khoDenIdsArr.length;
  const nguoiTaoLen = nguoiTaoArr.length;
  const nguoiDuyetLen = nguoiDuyetArr.length;
  const doiTacLen = doiTacArr.length;

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (statusLen > 0 ? 1 : 0) +
      (khoIdsLen > 0 ? 1 : 0) +
      (khoDenIdsLen > 0 ? 1 : 0) +
      (dateFilterActive ? 1 : 0) +
      (nguoiTaoLen > 0 ? 1 : 0) +
      (nguoiDuyetLen > 0 ? 1 : 0) +
      (doiTacLen > 0 ? 1 : 0),
    [searchTerm, statusLen, khoIdsLen, khoDenIdsLen, dateFilterActive, nguoiTaoLen, nguoiDuyetLen, doiTacLen]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
    setFilter('khoIds', []);
    setFilter('khoDenIds', []);
    setFilter('datePreset', 'all');
    setFilter('customDateFrom', '');
    setFilter('customDateEnd', '');
    setFilter('nguoiTaoIds', []);
    setFilter('nguoiDuyetIds', []);
    setFilter('doiTacIds', []);
  };

  const statusOptions = useMemo(
    () => [
      { label: t('phieuKho.status.pending'), value: 'Pending', count: data.filter((d) => d.trang_thai === 'Chờ duyệt').length },
      { label: t('phieuKho.status.approved'), value: 'Approved', count: data.filter((d) => d.trang_thai === 'Đã duyệt').length },
      { label: t('phieuKho.status.rejected'), value: 'Rejected', count: data.filter((d) => d.trang_thai === 'Không duyệt').length },
    ],
    [data, t]
  );

  const khoOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: (k.ten_kho != null && String(k.ten_kho).trim() !== '' ? String(k.ten_kho) : null) ?? String(k.id),
        count: data.filter((d) => d.kho_id === k.id).length,
      })),
    [khoList, data]
  );

  const khoDenOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: (k.ten_kho != null && String(k.ten_kho).trim() !== '' ? String(k.ten_kho) : null) ?? String(k.id),
        count: data.filter((d) => d.kho_den_id === k.id).length,
      })),
    [khoList, data]
  );

  const nguoiTaoOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const d of data) {
      if (d.nguoi_tao_id == null) continue;
      const k = String(d.nguoi_tao_id);
      const label = (typeof d.ten_nguoi_tao === 'string' ? d.ten_nguoi_tao.trim() : '') || `#${k}`;
      const prev = map.get(k);
      if (prev) prev.count += 1;
      else map.set(k, { label, count: 1 });
    }
    return [...map.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data]);

  const nguoiDuyetOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const d of data) {
      if (d.id_nguoi_duyet == null) continue;
      const k = String(d.id_nguoi_duyet);
      const label = (typeof d.ten_nguoi_duyet === 'string' ? d.ten_nguoi_duyet.trim() : '') || `#${k}`;
      const prev = map.get(k);
      if (prev) prev.count += 1;
      else map.set(k, { label, count: 1 });
    }
    return [...map.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data]);

  const doiTacOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    if (isNhap) {
      for (const d of data) {
        if (!d.id_nha_cung_cap) continue;
        const k = d.id_nha_cung_cap;
        const label = (typeof d.ten_nha_cung_cap === 'string' ? d.ten_nha_cung_cap.trim() : '') || k;
        const prev = map.get(k);
        if (prev) prev.count += 1;
        else map.set(k, { label, count: 1 });
      }
    } else if (isXuat) {
      for (const d of data) {
        if (!d.id_khach_hang) continue;
        const k = d.id_khach_hang;
        const label = (typeof d.ten_khach_hang === 'string' ? d.ten_khach_hang.trim() : '') || k;
        const prev = map.get(k);
        if (prev) prev.count += 1;
        else map.set(k, { label, count: 1 });
      }
    }
    return [...map.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data, isNhap, isXuat]);

  const mobileActions = useMemo(
    () => [
      {
        key: 'export',
        label: t('common.export'),
        icon: Download,
        onClick: onExport,
        description: '',
      },
    ],
    [onExport, t]
  );

  const dateRangePickerPresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);

  type FilterGroup = {
    key: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    options: { value: string; label: string; count: number }[];
    value: string[];
    onChange: (val: string[]) => void;
  };

  const filterGroups = useMemo(() => {
    const groups: FilterGroup[] = [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: statusArr,
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'khoIds',
        label: labelKho,
        icon: Warehouse,
        options: khoOptions,
        value: khoIdsArr,
        onChange: (val: string[]) => setFilter('khoIds', val),
      },
    ];
    if (isChuyen) {
      groups.push({
        key: 'khoDenIds',
        label: t('phieuKho.form.warehouseTo'),
        icon: ArrowRightLeft,
        options: khoDenOptions,
        value: khoDenIdsArr,
        onChange: (val: string[]) => setFilter('khoDenIds', val),
      });
    }
    groups.push(
      {
        key: 'nguoiTaoIds',
        label: t('phieuKho.filters.creator'),
        icon: User,
        options: nguoiTaoOptions,
        value: nguoiTaoArr,
        onChange: (val: string[]) => setFilter('nguoiTaoIds', val),
      },
      {
        key: 'nguoiDuyetIds',
        label: t('phieuKho.filters.approver'),
        icon: CheckCircle,
        options: nguoiDuyetOptions,
        value: nguoiDuyetArr,
        onChange: (val: string[]) => setFilter('nguoiDuyetIds', val),
      }
    );
    if (isNhap || isXuat) {
      groups.push({
        key: 'doiTacIds',
        label: isNhap ? t('phieuKho.filters.supplier') : t('phieuKho.filters.customer'),
        icon: Truck,
        options: doiTacOptions,
        value: doiTacArr,
        onChange: (val: string[]) => setFilter('doiTacIds', val),
      });
    }
    return groups;
  }, [
    t,
    statusOptions,
    statusArr,
    khoIdsArr,
    khoDenIdsArr,
    nguoiTaoArr,
    nguoiDuyetArr,
    doiTacArr,
    setFilter,
    labelKho,
    khoOptions,
    khoDenOptions,
    nguoiTaoOptions,
    nguoiDuyetOptions,
    doiTacOptions,
    isChuyen,
    isNhap,
    isXuat,
  ]);

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={statusArr}
        onChange={(v) => setFilter('status', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <DateRangePicker
        presets={dateRangePickerPresets}
        value={{
          preset: datePreset,
          customStart: customFrom,
          customEnd: customEnd,
        }}
        onChange={(v) => {
          setFilter('datePreset', v.preset as DateRangePresetId);
          setFilter('customDateFrom', v.customStart);
          setFilter('customDateEnd', v.customEnd);
        }}
        displayLabel={dateRangeLabel}
        placeholder={t('phieuKho.filters.datePhieu')}
        className="w-full sm:w-auto"
      />
      <FilterChipMultiSelect
        options={khoOptions}
        value={khoIdsArr}
        onChange={(v) => setFilter('khoIds', v)}
        placeholder={labelKho}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      {isChuyen && (
        <FilterChipMultiSelect
          options={khoDenOptions}
          value={filters.khoDenIds ?? []}
          onChange={(v) => setFilter('khoDenIds', v)}
          placeholder={t('phieuKho.form.warehouseTo')}
          icon={ArrowRightLeft}
          className="w-full sm:w-[160px]"
        />
      )}
      <FilterChipMultiSelect
        options={nguoiTaoOptions}
        value={nguoiTaoArr}
        onChange={(v) => setFilter('nguoiTaoIds', v)}
        placeholder={t('phieuKho.filters.creator')}
        icon={User}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={nguoiDuyetOptions}
        value={nguoiDuyetArr}
        onChange={(v) => setFilter('nguoiDuyetIds', v)}
        placeholder={t('phieuKho.filters.approver')}
        icon={CheckCircle}
        className="w-full sm:w-[150px]"
      />
      {(isNhap || isXuat) && (
        <FilterChipMultiSelect
          options={doiTacOptions}
          value={doiTacArr}
          onChange={(v) => setFilter('doiTacIds', v)}
          placeholder={isNhap ? t('phieuKho.filters.supplier') : t('phieuKho.filters.customer')}
          icon={Truck}
          className="w-full sm:w-[170px]"
        />
      )}
    </>
  );

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.export')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
      {canCreate ? (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      ) : null}
    </>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('phieuKho.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default PhieuKhoToolbar;
