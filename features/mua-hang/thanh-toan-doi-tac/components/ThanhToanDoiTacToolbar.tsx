import React, { useMemo } from 'react';
import type { ThanhToanDoiTacTomTat } from '../services/thanh-toan-doi-tac-service';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Building2, Users, FolderTree, User, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { DATE_RANGE_PRESETS, type DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import { useThanhToanDoiTacStore } from '../store/useThanhToanDoiTacStore';
import ImportExportButtons, { buildImportExportMobileActions } from './ImportExportButtons';
import type { DoiTacRefLite } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import type { NhomDoiTac } from '../../../kho-van/danh-sach-doi-tac/core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { TrangThaiThanhToanDoiTac } from '../../thiet-lap-de-xuat-vat-tu/core/types';

interface NguoiTaoOption {
  id: string;
  ho_ten: string;
}

interface Props {
  /**
   * Danh sách TÓM TẮT phiếu trong phạm vi xem (không phải trang đang xem) — chip lọc phải
   * đếm trên toàn bộ dữ liệu.
   */
  data: ThanhToanDoiTacTomTat[];
  doiTacList: DoiTacRefLite[];
  nhomList: NhomDoiTac[];
  chiNhanhList: Branch[];
  statusList: TrangThaiThanhToanDoiTac[];
  nguoiTaoList: NguoiTaoOption[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport?: () => void;
  onImport?: () => void;
  exportLoading?: boolean;
  /** Nút thao tác hàng loạt (Đã thanh toán / Huỷ) hiện khi có dòng được chọn. */
  bulkActions?: React.ReactNode;
  canCreate?: boolean;
  canDelete?: boolean;
}

/** Desktop: nhóm lọc ít dùng luôn nằm trong nút Filter (bảng lọc mobile vẫn đủ nhóm). */
const LUON_VAO_FILTER = ['nguoiTaoIds'];

/** Đếm số phiếu theo một cột của bản tóm tắt. */
function demTheo(data: ThanhToanDoiTacTomTat[], cot: keyof ThanhToanDoiTacTomTat): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of data) {
    const v = x[cot];
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return m;
}

const ThanhToanDoiTacToolbar: React.FC<Props> = ({
  data,
  doiTacList,
  nhomList,
  chiNhanhList,
  statusList,
  nguoiTaoList,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  onImport,
  exportLoading = false,
  bulkActions,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useThanhToanDoiTacStore);
  const filters = useThanhToanDoiTacStore((s) => s.filters);
  const setFilter = useThanhToanDoiTacStore((s) => s.setFilter);
  const clearSelection = useThanhToanDoiTacStore((s) => s.clearSelection);
  const columns = useThanhToanDoiTacStore((s) => s.columns);
  const toggleColumn = useThanhToanDoiTacStore((s) => s.toggleColumn);
  const reorderColumns = useThanhToanDoiTacStore((s) => s.reorderColumns);
  const resetColumns = useThanhToanDoiTacStore((s) => s.resetColumns);
  const resetColumnWidths = useThanhToanDoiTacStore((s) => s.resetColumnWidths);

  const datePreset = filters.datePreset || 'all';
  const customDateFrom = filters.customDateFrom || '';
  const customDateEnd = filters.customDateEnd || '';

  const dateRangeLabel = useMemo(() => {
    if (datePreset === 'all') return '';
    return getDateRangeFromPreset(
      datePreset as DateRangePresetId,
      customDateFrom ? new Date(customDateFrom) : undefined,
      customDateEnd ? new Date(customDateEnd) : undefined
    ).label;
  }, [datePreset, customDateFrom, customDateEnd]);

  const dateRangePresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);
  const dateRangeValue: DateRangeValue = { preset: datePreset, customStart: customDateFrom, customEnd: customDateEnd };
  const handleDateRangeChange = (v: DateRangeValue) => {
    setFilter('datePreset', v.preset);
    setFilter('customDateFrom', v.customStart);
    setFilter('customDateEnd', v.customEnd);
  };
  const dateRangeActive = datePreset !== 'all';

  const statusOptions = useMemo(() => {
    const dem = demTheo(data, 'id_trang_thai_thanh_toan');
    return statusList.map((s) => ({ value: s.id, label: s.ten, count: dem.get(s.id) ?? 0 }));
  }, [statusList, data]);

  const doiTacOptions = useMemo(() => {
    const dem = demTheo(data, 'id_doi_tac');
    return doiTacList.map((d) => ({ value: d.id, label: `${d.ma_ncc} - ${d.ten_ncc}`, count: dem.get(d.id) ?? 0 }));
  }, [doiTacList, data]);

  /** Chỉ nhóm của nhà cung cấp — phiếu thanh toán không gắn khách hàng. */
  const nhomOptions = useMemo(() => {
    const dem = demTheo(data, 'id_nhom');
    return nhomList
      .filter((n) => n.loai !== 'khach_hang')
      .map((n) => ({ value: n.id, label: n.ten_nhom, count: dem.get(n.id) ?? 0 }));
  }, [nhomList, data]);

  const donViOptions = useMemo(() => {
    const dem = demTheo(data, 'id_don_vi');
    return chiNhanhList.map((b) => ({ value: b.id, label: b.ten_chi_nhanh, count: dem.get(b.id) ?? 0 }));
  }, [chiNhanhList, data]);

  /** Danh sách nhân viên dài → chỉ hiện người đã lập phiếu trong phạm vi xem (giữ người đang chọn). */
  const nguoiTaoOptions = useMemo(() => {
    const dem = demTheo(data, 'id_nguoi_tao');
    const dangChon = new Set(filters.nguoiTaoIds ?? []);
    return nguoiTaoList
      .filter((nv) => dem.has(String(nv.id)) || dangChon.has(String(nv.id)))
      .map((nv) => ({ value: String(nv.id), label: nv.ho_ten, count: dem.get(String(nv.id)) ?? 0 }));
  }, [nguoiTaoList, data, filters.nguoiTaoIds]);

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    (filters.statusIds?.length ?? 0) +
    (filters.doiTacIds?.length ?? 0) +
    (filters.nhomIds?.length ?? 0) +
    (filters.donViIds?.length ?? 0) +
    (filters.nguoiTaoIds?.length ?? 0) +
    (dateRangeActive ? 1 : 0);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('statusIds', []);
    setFilter('doiTacIds', []);
    setFilter('nhomIds', []);
    setFilter('donViIds', []);
    setFilter('nguoiTaoIds', []);
    setFilter('datePreset', 'all');
    setFilter('customDateFrom', '');
    setFilter('customDateEnd', '');
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'statusIds',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.statusIds ?? [],
        onChange: (val: string[]) => setFilter('statusIds', val),
      },
      {
        key: 'nhomIds',
        label: t('thanhToanDoiTac.store.nhomDoiTacCol'),
        icon: FolderTree,
        options: nhomOptions,
        value: filters.nhomIds ?? [],
        onChange: (val: string[]) => setFilter('nhomIds', val),
      },
      {
        key: 'doiTacIds',
        label: t('thanhToanDoiTac.form.doiTac'),
        icon: Users,
        options: doiTacOptions,
        value: filters.doiTacIds ?? [],
        onChange: (val: string[]) => setFilter('doiTacIds', val),
      },
      {
        key: 'donViIds',
        label: t('thanhToanDoiTac.form.donVi'),
        icon: Building2,
        options: donViOptions,
        value: filters.donViIds ?? [],
        onChange: (val: string[]) => setFilter('donViIds', val),
      },
      {
        key: 'nguoiTaoIds',
        label: t('thanhToanDoiTac.form.nguoiTao'),
        icon: User,
        options: nguoiTaoOptions,
        value: filters.nguoiTaoIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiTaoIds', val),
      },
    ],
    [
      t,
      statusOptions,
      nhomOptions,
      doiTacOptions,
      donViOptions,
      nguoiTaoOptions,
      filters.statusIds,
      filters.nhomIds,
      filters.doiTacIds,
      filters.donViIds,
      filters.nguoiTaoIds,
      setFilter,
    ]
  );

  const [statusGroup, nhomGroup, doiTacGroup, donViGroup, nguoiTaoGroup] = filterGroups;
  const filterItems: FilterChipItem[] = [
    { kind: 'group', group: statusGroup, className: 'w-full sm:w-[140px]' },
    { kind: 'group', group: nhomGroup, className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: doiTacGroup, className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: donViGroup, className: 'w-full sm:w-[150px]' },
    {
      kind: 'custom',
      key: 'dateRange',
      node: (
        <DateRangePicker
          presets={dateRangePresets}
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          displayLabel={dateRangeLabel}
          placeholder={t('thanhToanDoiTac.filters.dateRange')}
          className="w-full sm:w-auto"
        />
      ),
    },
    { kind: 'group', group: nguoiTaoGroup },
  ];

  const renderActions = (
    <>
      <ImportExportButtons
        onImport={canCreate ? onImport : undefined}
        onExport={onExport}
        exportLoading={exportLoading}
      />
      {canCreate && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      )}
    </>
  );

  const mobileActions = useMemo(
    () => buildImportExportMobileActions(t, canCreate ? onImport : undefined, onExport),
    [t, onImport, onExport, canCreate]
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      bulkActions={bulkActions}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} luonVaoFilter={LUON_VAO_FILTER} />}
      filterGroups={filterGroups}
      mobileFilterExtra={
        <MobileFilterField label={t('thanhToanDoiTac.filters.dateRange')} icon={Calendar} active={dateRangeActive}>
          <DateRangePicker inline presets={dateRangePresets} value={dateRangeValue} onChange={handleDateRangeChange} />
        </MobileFilterField>
      }
      mobileFilterExtraCount={dateRangeActive ? 1 : 0}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
    />
  );
};

export default ThanhToanDoiTacToolbar;
