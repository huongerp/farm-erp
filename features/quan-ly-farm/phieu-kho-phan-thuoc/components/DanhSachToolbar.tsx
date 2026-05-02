import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Warehouse, ArrowRightLeft, User, CheckCircle, Download, Layers } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { usePhieuKhoPTStore } from '../store/usePhieuKhoPTStore';
import type { PhieuKhoPT } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import { DATE_RANGE_PRESETS } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';

interface Props {
  data: PhieuKhoPT[];
  khoList: Kho[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
  chipCountsMode?: 'fromRows' | 'unweighted';
  employeesForChips?: { id: string; ho_ten: string }[];
}

function asStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return [];
}

const DanhSachToolbar: React.FC<Props> = ({
  data: dataProp,
  khoList: khoListProp,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  canCreate = true,
  canDelete = true,
  chipCountsMode = 'fromRows',
  employeesForChips = [],
}) => {
  const data = Array.isArray(dataProp) ? dataProp : [];
  const khoList = Array.isArray(khoListProp) ? khoListProp : [];
  const { t } = useTranslation();
  const searchTerm = usePhieuKhoPTStore((s) => s.searchTerm);
  const commitSearchTerm = usePhieuKhoPTStore((s) => s.commitSearchTerm);
  const filters = usePhieuKhoPTStore((s) => s.filters);
  const setFilter = usePhieuKhoPTStore((s) => s.setFilter);
  const clearSelection = usePhieuKhoPTStore((s) => s.clearSelection);
  const columns = usePhieuKhoPTStore((s) => s.columns);
  const toggleColumn = usePhieuKhoPTStore((s) => s.toggleColumn);
  const reorderColumns = usePhieuKhoPTStore((s) => s.reorderColumns);
  const resetColumns = usePhieuKhoPTStore((s) => s.resetColumns);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

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
    () => (datePreset && datePreset !== 'all') || !!customFrom.trim() || !!customEnd.trim(),
    [datePreset, customFrom, customEnd]
  );

  const loaiKeysArr = asStringArray(filters.loaiKeys);
  const statusArr = asStringArray(filters.status);
  const khoIdsArr = asStringArray(filters.khoIds);
  const khoDenIdsArr = asStringArray(filters.khoDenIds);
  const nguoiTaoArr = asStringArray(filters.nguoiTaoIds);
  const nguoiDuyetArr = asStringArray(filters.nguoiDuyetIds);

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (loaiKeysArr.length > 0 ? 1 : 0) +
      (statusArr.length > 0 ? 1 : 0) +
      (khoIdsArr.length > 0 ? 1 : 0) +
      (khoDenIdsArr.length > 0 ? 1 : 0) +
      (dateFilterActive ? 1 : 0) +
      (nguoiTaoArr.length > 0 ? 1 : 0) +
      (nguoiDuyetArr.length > 0 ? 1 : 0),
    [searchInput, loaiKeysArr.length, statusArr.length, khoIdsArr.length, khoDenIdsArr.length, dateFilterActive, nguoiTaoArr.length, nguoiDuyetArr.length]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('loaiKeys', []);
    setFilter('status', []);
    setFilter('khoIds', []);
    setFilter('khoDenIds', []);
    setFilter('datePreset', 'all');
    setFilter('customDateFrom', '');
    setFilter('customDateEnd', '');
    setFilter('nguoiTaoIds', []);
    setFilter('nguoiDuyetIds', []);
  };

  const unweighted = chipCountsMode === 'unweighted';

  const loaiOptions = useMemo(
    () => [
      { label: t('phieuKhoPhanThuoc.tabs.nhap'), value: 'nhap', count: unweighted ? 1 : data.filter((d) => d.loai === 'nhập').length },
      { label: t('phieuKhoPhanThuoc.tabs.xuat'), value: 'xuat', count: unweighted ? 1 : data.filter((d) => d.loai === 'xuất').length },
      { label: t('phieuKhoPhanThuoc.tabs.chuyen'), value: 'chuyen', count: unweighted ? 1 : data.filter((d) => d.loai === 'chuyển').length },
    ],
    [data, t, unweighted]
  );

  const statusOptions = useMemo(
    () => [
      { label: t('phieuKhoPhanThuoc.status.pending'), value: 'Pending', count: unweighted ? 1 : data.filter((d) => d.trang_thai === 'Chờ duyệt').length },
      { label: t('phieuKhoPhanThuoc.status.approved'), value: 'Approved', count: unweighted ? 1 : data.filter((d) => d.trang_thai === 'Đã duyệt').length },
      { label: t('phieuKhoPhanThuoc.status.rejected'), value: 'Rejected', count: unweighted ? 1 : data.filter((d) => d.trang_thai === 'Không duyệt').length },
    ],
    [data, t, unweighted]
  );

  const khoOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: (k.ten_kho != null && String(k.ten_kho).trim() !== '' ? String(k.ten_kho) : null) ?? String(k.id),
        count: unweighted ? 1 : data.filter((d) => d.kho_id === k.id).length,
      })),
    [khoList, data, unweighted]
  );

  const khoDenOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: (k.ten_kho != null && String(k.ten_kho).trim() !== '' ? String(k.ten_kho) : null) ?? String(k.id),
        count: unweighted ? 1 : data.filter((d) => d.kho_den_id === k.id).length,
      })),
    [khoList, data, unweighted]
  );

  const nguoiTaoOptions = useMemo(() => {
    if (unweighted && employeesForChips.length) {
      return [...employeesForChips]
        .map((e) => ({ value: e.id, label: e.ho_ten.trim() || `#${e.id}`, count: 1 }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    }
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
  }, [data, unweighted, employeesForChips]);

  const nguoiDuyetOptions = useMemo(() => {
    if (unweighted && employeesForChips.length) {
      return [...employeesForChips]
        .map((e) => ({ value: e.id, label: e.ho_ten.trim() || `#${e.id}`, count: 1 }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    }
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
  }, [data, unweighted, employeesForChips]);

  const filterGroups = useMemo(
    () => [
      {
        key: 'loaiKeys',
        label: t('phieuKhoPhanThuoc.filters.loaiPhieu'),
        icon: Layers,
        options: loaiOptions,
        value: loaiKeysArr,
        onChange: (val: string[]) => setFilter('loaiKeys', val),
      },
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
        label: t('phieuKhoPhanThuoc.form.warehouse'),
        icon: Warehouse,
        options: khoOptions,
        value: khoIdsArr,
        onChange: (val: string[]) => setFilter('khoIds', val),
      },
      {
        key: 'khoDenIds',
        label: t('phieuKhoPhanThuoc.form.warehouseTo'),
        icon: ArrowRightLeft,
        options: khoDenOptions,
        value: khoDenIdsArr,
        onChange: (val: string[]) => setFilter('khoDenIds', val),
      },
      {
        key: 'nguoiTaoIds',
        label: t('phieuKhoPhanThuoc.filters.creator'),
        icon: User,
        options: nguoiTaoOptions,
        value: nguoiTaoArr,
        onChange: (val: string[]) => setFilter('nguoiTaoIds', val),
      },
      {
        key: 'nguoiDuyetIds',
        label: t('phieuKhoPhanThuoc.filters.approver'),
        icon: CheckCircle,
        options: nguoiDuyetOptions,
        value: nguoiDuyetArr,
        onChange: (val: string[]) => setFilter('nguoiDuyetIds', val),
      },
    ],
    [
      t,
      loaiOptions,
      loaiKeysArr,
      statusOptions,
      statusArr,
      khoOptions,
      khoIdsArr,
      khoDenOptions,
      khoDenIdsArr,
      nguoiTaoOptions,
      nguoiTaoArr,
      nguoiDuyetOptions,
      nguoiDuyetArr,
      setFilter,
    ]
  );

  const mobileActions = useMemo(
    () => [{ key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' }],
    [onExport, t]
  );

  const dateRangePickerPresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={loaiOptions}
        value={loaiKeysArr}
        onChange={(v) => setFilter('loaiKeys', v)}
        placeholder={t('phieuKhoPhanThuoc.filters.loaiPhieu')}
        icon={Layers}
        className="w-full sm:w-[160px]"
      />
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
        placeholder={t('phieuKhoPhanThuoc.filters.datePhieu')}
        className="w-full sm:w-auto"
      />
      <FilterChipMultiSelect
        options={khoOptions}
        value={khoIdsArr}
        onChange={(v) => setFilter('khoIds', v)}
        placeholder={t('phieuKhoPhanThuoc.form.warehouse')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={khoDenOptions}
        value={khoDenIdsArr}
        onChange={(v) => setFilter('khoDenIds', v)}
        placeholder={t('phieuKhoPhanThuoc.form.warehouseTo')}
        icon={ArrowRightLeft}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiTaoOptions}
        value={nguoiTaoArr}
        onChange={(v) => setFilter('nguoiTaoIds', v)}
        placeholder={t('phieuKhoPhanThuoc.filters.creator')}
        icon={User}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={nguoiDuyetOptions}
        value={nguoiDuyetArr}
        onChange={(v) => setFilter('nguoiDuyetIds', v)}
        placeholder={t('phieuKhoPhanThuoc.filters.approver')}
        icon={CheckCircle}
        className="w-full sm:w-[150px]"
      />
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
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('phieuKhoPhanThuoc.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default DanhSachToolbar;
