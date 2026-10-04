import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Calendar, ListOrdered, User, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getAdminFormTypeOptions } from '../../thiet-lap-cong-luong/core/constants';
import { getAdminFormStatusLabel, ADMIN_FORM_STATUSES } from '../core/constants';
import { useAdminFormFilterCounts } from '../hooks/use-admin-form-filter-counts';
import type { AdminFormTomTat } from '../core/types';
import type { AdminFormListFilters } from '../store/useAdminFormListStore';
import { KY_CUSTOM, type KyLoc } from '../core/ky-loc';

/** Nhãn từng mốc của chip Thời gian — id khớp core/ky-loc.ts#KY_PRESETS. */
const KY_PRESET_LABEL_KEYS: Record<string, string> = {
  all: 'adminForm.filter.timeAll',
  thisMonth: 'adminForm.filter.thisMonth',
  lastMonth: 'adminForm.filter.lastMonth',
  thisQuarter: 'adminForm.filter.thisQuarter',
  thisYear: 'adminForm.filter.thisYear',
};

interface Props {
  /** Bản vài cột của toàn bộ phạm vi xem — chip lọc đếm trên list này. */
  tomTat: AdminFormTomTat[];
  /** Kỳ đã tính từ chip Thời gian (forms-tab) — để số đếm các chip khác cùng kỳ với bảng. */
  ky: KyLoc | null;
  /** Hiện chip Người gửi (người có viewAll). */
  showPersonFilter: boolean;
  currentUserId: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: AdminFormListFilters;
  setFilter: (key: keyof AdminFormListFilters, value: any) => void;
  columns: ColumnConfig[];
  toggleColumn: (id: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resetColumns: () => void;
  resetColumnWidths: () => void;
  selectedIds: Set<string>;
  clearSelection: () => void;
  onAdd?: () => void;
  onDeleteMany?: (ids: string[]) => void;
  /** Mở hộp thoại Xuất file. */
  onExport: () => void;
  bulkActions?: React.ReactNode;
}

const AdminFormToolbar: React.FC<Props> = ({
  tomTat,
  ky,
  showPersonFilter,
  currentUserId,
  searchTerm,
  setSearchTerm,
  filters,
  setFilter,
  columns,
  toggleColumn,
  reorderColumns,
  resetColumns,
  resetColumnWidths,
  selectedIds,
  clearSelection,
  onAdd,
  onDeleteMany,
  onExport,
  bulkActions,
}) => {
  const { t } = useTranslation();
  const { statusCounts, typeCounts, nguoiTaoCounts, nguoiGuiOptions } = useAdminFormFilterCounts(tomTat, filters, ky);
  const selectedCount = selectedIds.size;
  const nguoiTao = filters.nguoiTao ?? [];
  const activeFilterCount =
    filters.status.length + filters.type.length + (showPersonFilter ? nguoiTao.length : 0) + (filters.kyPreset !== 'all' ? 1 : 0);

  const statusOptions = useMemo(
    () => ADMIN_FORM_STATUSES.map((s) => ({ label: getAdminFormStatusLabel(s, t), value: s, count: statusCounts[s] ?? 0 })),
    [t, statusCounts]
  );
  const kyPresets = useMemo(
    () => Object.entries(KY_PRESET_LABEL_KEYS).map(([id, key]) => ({ id, label: t(key) })),
    [t]
  );
  const kyValue: DateRangeValue = useMemo(
    () => ({ preset: filters.kyPreset, customStart: filters.tuNgay, customEnd: filters.denNgay }),
    [filters.kyPreset, filters.tuNgay, filters.denNgay]
  );
  const handleKyChange = (value: DateRangeValue) => {
    setFilter('kyPreset', value.preset);
    setFilter('tuNgay', value.preset === KY_CUSTOM ? value.customStart : '');
    setFilter('denNgay', value.preset === KY_CUSTOM ? value.customEnd : '');
  };
  const typeOptions = useMemo(() => {
    const opts = getAdminFormTypeOptions(t);
    return opts.map((o) => ({ ...o, count: typeCounts[o.value] ?? 0 }));
  }, [t, typeCounts]);
  // Chính mình đứng đầu kèm "(Tôi)", còn lại theo tên.
  const personOptions = useMemo(() => {
    const opts = nguoiGuiOptions.map((p) => ({
      value: p.id,
      label: p.id === currentUserId ? `${p.ten || p.id} (${t('adminForm.filter.me')})` : p.ten || p.id,
      count: nguoiTaoCounts[p.id] ?? 0,
    }));
    return opts.sort((a, b) =>
      a.value === currentUserId ? -1 : b.value === currentUserId ? 1 : a.label.localeCompare(b.label, 'vi')
    );
  }, [nguoiGuiOptions, nguoiTaoCounts, currentUserId, t]);

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('adminForm.store.statusCol'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'type',
        label: t('adminForm.store.typeCol'),
        icon: ListOrdered,
        options: typeOptions,
        value: filters.type,
        onChange: (val: string[]) => setFilter('type', val),
      },
      ...(showPersonFilter
        ? [
            {
              key: 'nguoiTao',
              label: t('adminForm.store.requesterCol'),
              icon: User,
              options: personOptions,
              value: nguoiTao,
              onChange: (val: string[]) => setFilter('nguoiTao', val),
            },
          ]
        : []),
      {
        key: 'ky',
        label: t('adminForm.store.periodCol'),
        icon: Calendar,
        // Sheet mobile chỉ có mốc nhanh; khoảng ngày tự do chọn trên desktop.
        options: kyPresets.filter((p) => p.id !== 'all').map((p) => ({ label: p.label, value: p.id })),
        value: filters.kyPreset === 'all' || filters.kyPreset === KY_CUSTOM ? [] : [filters.kyPreset],
        // Sheet là chọn nhiều — giữ mốc vừa bấm để chip vẫn chỉ một mốc.
        onChange: (val: string[]) => {
          setFilter('kyPreset', val.find((v) => v !== filters.kyPreset) ?? 'all');
          setFilter('tuNgay', '');
          setFilter('denNgay', '');
        },
      },
    ],
    [
      filters.status,
      filters.type,
      filters.kyPreset,
      nguoiTao,
      showPersonFilter,
      setFilter,
      statusOptions,
      typeOptions,
      personOptions,
      kyPresets,
      t,
    ]
  );

  const renderFilters = (
    <>
      <DateRangePicker
        presets={kyPresets}
        value={kyValue}
        onChange={handleKyChange}
        // Chưa lọc: nút ghi "Thời gian" như các chip khác; mốc "Tất cả" chỉ hiện trong lưới chọn nhanh.
        displayLabel={filters.kyPreset === 'all' ? t('adminForm.store.periodCol') : undefined}
        placeholder={t('adminForm.store.periodCol')}
        customPresetId={KY_CUSTOM}
        className="shrink-0"
      />
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('adminForm.store.statusCol')}
        icon={Tag}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={typeOptions}
        value={filters.type}
        onChange={(val) => setFilter('type', val)}
        placeholder={t('adminForm.store.typeCol')}
        icon={ListOrdered}
        className="w-full sm:w-[220px]"
      />
      {showPersonFilter && (
        <FilterChipMultiSelect
          options={personOptions}
          value={nguoiTao}
          onChange={(val) => setFilter('nguoiTao', val)}
          placeholder={t('adminForm.store.requesterCol')}
          icon={User}
          className="w-full sm:w-[200px]"
        />
      )}
    </>
  );

  const exportButton = (
    <Tooltip content={t('common.export')} placement="bottom">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExport}
        className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
        aria-label={t('common.export')}
      >
        <Download className="w-4 h-4" />
      </Button>
    </Tooltip>
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2">{exportButton}</div>
      {onAdd && (
        <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      )}
    </div>
  );

  // Đang chọn dòng thì thanh công cụ chỉ hiện bulkActions — giữ nút Xuất ở đó để dùng phạm vi "Đã chọn".
  const renderBulkActions = (
    <>
      {exportButton}
      {bulkActions}
    </>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => [{ key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' }],
    [onExport, t]
  );

  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('type', []);
    setFilter('nguoiTao', []);
    setFilter('kyPreset', 'all');
    setFilter('tuNgay', '');
    setFilter('denNgay', '');
  };

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      bulkActions={renderBulkActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={onAdd}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={onDeleteMany ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
      mobileActions={mobileActions}
    />
  );
};

export default AdminFormToolbar;
