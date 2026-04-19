import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Warehouse, User, UserCheck } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { usePhieuDeXuatVatTuStore } from '../store/usePhieuDeXuatVatTuStore';
import type { PhieuDeXuatVatTu } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';
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

  const statusLen = filters.status?.length ?? 0;
  const noiDeXuatLen = filters.noiDeXuatIds?.length ?? 0;
  const nguoiDeXuatLen = filters.nguoiDeXuatIds?.length ?? 0;
  const nguoiDuyetLen = filters.nguoiDuyetIds?.length ?? 0;
  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (statusLen > 0 ? 1 : 0) +
      (noiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDuyetLen > 0 ? 1 : 0),
    [searchInput, statusLen, noiDeXuatLen, nguoiDeXuatLen, nguoiDuyetLen]
  );

  const mineCount = currentUserId ? data.filter((d) => d.id_nguoi_de_xuat === currentUserId).length : 0;
  const toApproveCount = currentUserId ? data.filter((d) => d.id_nguoi_duyet === currentUserId).length : 0;
  const showMineApproveCounts = !unweighted;

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('status', []);
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

  const renderActions = canCreate ? (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  ) : null;

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
