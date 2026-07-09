import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Warehouse, User, UserCheck, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { DATE_RANGE_PRESETS, type DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import { usePhieuDeXuatVatTuStore } from '../store/usePhieuDeXuatVatTuStore';
import type { PhieuDeXuatVatTu } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_DOI_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';

interface Props {
  data: PhieuDeXuatVatTu[];
  khoList: Kho[];
  employees: EmployeeRef[];
  currentUserId: string | null;
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  /** Xuất danh sách (ExportDialog) — bắt buộc tab Danh sách. */
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
  chipCountsMode?: 'fromRows' | 'unweighted';
}

const PhieuDeXuatVatTuToolbar: React.FC<Props> = ({
  data,
  khoList,
  employees,
  currentUserId,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  canCreate = true,
  canDelete = true,
  chipCountsMode = 'fromRows',
}) => {
  const { t } = useTranslation();
  const unweighted = chipCountsMode === 'unweighted';
  const searchTerm = usePhieuDeXuatVatTuStore((s) => s.searchTerm);
  const commitSearchTerm = usePhieuDeXuatVatTuStore((s) => s.commitSearchTerm);
  const filters = usePhieuDeXuatVatTuStore((s) => s.filters);
  const setFilter = usePhieuDeXuatVatTuStore((s) => s.setFilter);
  const clearSelection = usePhieuDeXuatVatTuStore((s) => s.clearSelection);
  const columns = usePhieuDeXuatVatTuStore((s) => s.columns);
  const toggleColumn = usePhieuDeXuatVatTuStore((s) => s.toggleColumn);
  const reorderColumns = usePhieuDeXuatVatTuStore((s) => s.reorderColumns);
  const resetColumns = usePhieuDeXuatVatTuStore((s) => s.resetColumns);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const datePreset = typeof filters.datePreset === 'string' ? filters.datePreset : 'all';
  const customDateFrom = typeof filters.customDateFrom === 'string' ? filters.customDateFrom : '';
  const customDateEnd = typeof filters.customDateEnd === 'string' ? filters.customDateEnd : '';
  const dateFilterActive = useMemo(
    () => datePreset !== 'all' || !!customDateFrom.trim() || !!customDateEnd.trim(),
    [datePreset, customDateFrom, customDateEnd]
  );
  const dateRangeLabel = useMemo(() => {
    const range = getDateRangeFromPreset(
      datePreset as DateRangePresetId,
      customDateFrom ? new Date(customDateFrom) : undefined,
      customDateEnd ? new Date(customDateEnd) : undefined
    );
    return range.label;
  }, [datePreset, customDateFrom, customDateEnd]);
  const dateRangePickerPresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);

  const statusLen = filters.status?.length ?? 0;
  const noiDeXuatLen = filters.noiDeXuatIds?.length ?? 0;
  const nguoiDeXuatLen = filters.nguoiDeXuatIds?.length ?? 0;
  const nguoiDuyetLen = filters.nguoiDuyetIds?.length ?? 0;
  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (statusLen > 0 ? 1 : 0) +
      (dateFilterActive ? 1 : 0) +
      (noiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDuyetLen > 0 ? 1 : 0),
    [searchInput, statusLen, dateFilterActive, noiDeXuatLen, nguoiDeXuatLen, nguoiDuyetLen]
  );

  const mineCount = currentUserId ? data.filter((d) => d.id_nguoi_de_xuat === currentUserId).length : 0;
  const toApproveCount = currentUserId ? data.filter((d) => d.id_nguoi_duyet === currentUserId).length : 0;
  const showMineApproveCounts = !unweighted;

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('status', []);
    setFilter('datePreset', 'all');
    setFilter('customDateFrom', '');
    setFilter('customDateEnd', '');
    setFilter('noiDeXuatIds', []);
    setFilter('nguoiDeXuatIds', []);
    setFilter('nguoiDuyetIds', []);
  };

  const filterMine = currentUserId && (filters.nguoiDeXuatIds ?? []).length === 1 && (filters.nguoiDeXuatIds ?? [])[0] === currentUserId;
  const filterToApprove = currentUserId && (filters.nguoiDuyetIds ?? []).length === 1 && (filters.nguoiDuyetIds ?? [])[0] === currentUserId;

  const toggleMine = () => {
    if (filterMine) setFilter('nguoiDeXuatIds', []);
    else if (currentUserId) setFilter('nguoiDeXuatIds', [currentUserId]);
  };
  const toggleToApprove = () => {
    if (filterToApprove) setFilter('nguoiDuyetIds', []);
    else if (currentUserId) setFilter('nguoiDuyetIds', [currentUserId]);
  };

  const statusOptions = useMemo(
    () => [
      {
        label: t('phieuDeXuatVatTu.status.pending'),
        value: 'Pending',
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === TRANG_THAI_CHO_DUYET).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.waiting'),
        value: 'Waiting',
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === TRANG_THAI_DOI_DUYET).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.approved'),
        value: 'Approved',
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === TRANG_THAI_DA_DUYET).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.rejected'),
        value: 'Rejected',
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === TRANG_THAI_KHONG_DUYET).length,
      },
    ],
    [data, t, unweighted]
  );

  const noiDeXuatOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: unweighted ? 1 : data.filter((d) => d.id_noi_de_xuat === k.id).length,
      })),
    [khoList, data, unweighted]
  );

  const nguoiDeXuatOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.ho_ten,
        count: unweighted ? 1 : data.filter((d) => d.id_nguoi_de_xuat === e.id).length,
      })),
    [employees, data, unweighted]
  );

  const nguoiDuyetOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.ho_ten,
        count: unweighted ? 1 : data.filter((d) => d.id_nguoi_duyet === e.id).length,
      })),
    [employees, data, unweighted]
  );

  const exportIconButtonClass =
    'inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50';

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

  const bulkExport = useMemo(
    () => (
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className={exportIconButtonClass}
          aria-label={t('common.export')}
        >
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    ),
    [exportIconButtonClass, onExport, t]
  );

  const searchTrailingExport = (
    <Tooltip content={t('common.export')} placement="bottom">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExport}
        className="sm:hidden shrink-0 inline-flex min-h-[44px] min-w-[44px] h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
        aria-label={t('common.export')}
      >
        <Download className="w-4 h-4" />
      </Button>
    </Tooltip>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status ?? [],
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'noiDeXuatIds',
        label: t('phieuDeXuatVatTu.form.place'),
        icon: Warehouse,
        options: noiDeXuatOptions,
        value: filters.noiDeXuatIds ?? [],
        onChange: (val: string[]) => setFilter('noiDeXuatIds', val),
      },
      {
        key: 'nguoiDeXuatIds',
        label: t('phieuDeXuatVatTu.form.requester'),
        icon: User,
        options: nguoiDeXuatOptions,
        value: filters.nguoiDeXuatIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDeXuatIds', val),
      },
      {
        key: 'nguoiDuyetIds',
        label: t('phieuDeXuatVatTu.form.approver'),
        icon: UserCheck,
        options: nguoiDuyetOptions,
        value: filters.nguoiDuyetIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDuyetIds', val),
      },
    ],
    [
      t,
      statusOptions,
      noiDeXuatOptions,
      nguoiDeXuatOptions,
      nguoiDuyetOptions,
      filters.status,
      filters.noiDeXuatIds,
      filters.nguoiDeXuatIds,
      filters.nguoiDuyetIds,
      setFilter,
    ]
  );

  const renderFilters = (
    <>
      {currentUserId && (
        <>
          <button
            type="button"
            onClick={toggleMine}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterMine
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
            title={t('phieuDeXuatVatTu.filters.mineHint')}
          >
            <User className="w-3.5 h-3.5" />
            {t('phieuDeXuatVatTu.tabs.mine')}
            {showMineApproveCounts && mineCount > 0 && (
              <span className="opacity-80">({mineCount})</span>
            )}
          </button>
          <button
            type="button"
            onClick={toggleToApprove}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterToApprove
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
            title={t('phieuDeXuatVatTu.filters.toApproveHint')}
          >
            <UserCheck className="w-3.5 h-3.5" />
            {t('phieuDeXuatVatTu.tabs.toApprove')}
            {showMineApproveCounts && toApproveCount > 0 && (
              <span className="opacity-80">({toApproveCount})</span>
            )}
          </button>
        </>
      )}
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status ?? []}
        onChange={(v) => setFilter('status', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <DateRangePicker
        presets={dateRangePickerPresets}
        value={{
          preset: datePreset,
          customStart: customDateFrom,
          customEnd: customDateEnd,
        }}
        onChange={(v) => {
          setFilter('datePreset', v.preset as DateRangePresetId);
          setFilter('customDateFrom', v.customStart);
          setFilter('customDateEnd', v.customEnd);
        }}
        displayLabel={dateRangeLabel}
        placeholder={t('phieuDeXuatVatTu.filters.datePhieu')}
        className="w-full sm:w-auto"
      />
      <FilterChipMultiSelect
        options={noiDeXuatOptions}
        value={filters.noiDeXuatIds ?? []}
        onChange={(v) => setFilter('noiDeXuatIds', v)}
        placeholder={t('phieuDeXuatVatTu.form.place')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiDeXuatOptions}
        value={filters.nguoiDeXuatIds ?? []}
        onChange={(v) => setFilter('nguoiDeXuatIds', v)}
        placeholder={t('phieuDeXuatVatTu.form.requester')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiDuyetOptions}
        value={filters.nguoiDuyetIds ?? []}
        onChange={(v) => setFilter('nguoiDuyetIds', v)}
        placeholder={t('phieuDeXuatVatTu.form.approver')}
        icon={UserCheck}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.export')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className={exportIconButtonClass}
            aria-label={t('common.export')}
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
      bulkActions={bulkExport}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      searchTrailing={searchTrailingExport}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('phieuDeXuatVatTu.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default PhieuDeXuatVatTuToolbar;
