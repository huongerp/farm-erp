import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Warehouse, User, UserCheck, Package, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useChiTietTabStore } from '../store/useChiTietTabStore';
import type { PhieuDeXuatVatTuChiTietRow } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET, TIEN_DO_MH_KNOWN_LABELS } from '../core/constants';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { Kho } from '../../danh-sach-kho/core/types';

interface Props {
  data: PhieuDeXuatVatTuChiTietRow[];
  khoList: Kho[];
  employees: EmployeeRef[];
  currentUserId: string | null;
  selectedCount: number;
  /** Khi có: bấm Back gọi callback (vd. về tab Danh sách). Khi không có: không hiện nút Back. */
  onBack?: () => void;
  /** Nút hành động khi có chọn dòng (vd. Tiến độ). */
  bulkActions?: React.ReactNode;
  /** Xuất file (tab Chi tiết) — chuẩn ExportDialog. */
  onExport?: () => void;
  exportDisabled?: boolean;
  chipCountsMode?: 'fromRows' | 'unweighted';
}

const ChiTietTabToolbar: React.FC<Props> = ({
  data,
  khoList,
  employees,
  currentUserId,
  bulkActions,
  selectedCount,
  onBack,
  onExport,
  exportDisabled,
  chipCountsMode = 'fromRows',
}) => {
  const { t } = useTranslation();
  const unweighted = chipCountsMode === 'unweighted';
  const searchTerm = useChiTietTabStore((s) => s.searchTerm);
  const commitSearchTerm = useChiTietTabStore((s) => s.commitSearchTerm);
  const filters = useChiTietTabStore((s) => s.filters);
  const setFilter = useChiTietTabStore((s) => s.setFilter);
  const clearSelection = useChiTietTabStore((s) => s.clearSelection);
  const columns = useChiTietTabStore((s) => s.columns);
  const toggleColumn = useChiTietTabStore((s) => s.toggleColumn);
  const reorderColumns = useChiTietTabStore((s) => s.reorderColumns);
  const resetColumns = useChiTietTabStore((s) => s.resetColumns);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const statusLen = filters.status?.length ?? 0;
  const noiDeXuatLen = filters.noiDeXuat?.length ?? 0;
  const nguoiDeXuatLen = filters.nguoiDeXuat?.length ?? 0;
  const nguoiDuyetLen = filters.nguoiDuyet?.length ?? 0;
  const tienDoMhLen = filters.tienDoMh?.length ?? 0;
  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      statusLen +
      (noiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDuyetLen > 0 ? 1 : 0) +
      (tienDoMhLen > 0 ? 1 : 0),
    [searchInput, statusLen, noiDeXuatLen, nguoiDeXuatLen, nguoiDuyetLen, tienDoMhLen]
  );

  const currentUserHoTen = useMemo(
    () => (currentUserId ? employees.find((e) => e.id === currentUserId)?.ho_ten ?? null : null),
    [currentUserId, employees]
  );

  const mineCount = useMemo(
    () => (currentUserHoTen ? data.filter((r) => (r.ten_nguoi_de_xuat ?? '') === currentUserHoTen).length : 0),
    [data, currentUserHoTen]
  );
  const toApproveCount = useMemo(
    () => (currentUserHoTen ? data.filter((r) => (r.ten_nguoi_duyet ?? '') === currentUserHoTen).length : 0),
    [data, currentUserHoTen]
  );
  const showMineApproveCounts = !unweighted;

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('status', []);
    setFilter('noiDeXuat', []);
    setFilter('nguoiDeXuat', []);
    setFilter('nguoiDuyet', []);
    setFilter('tienDoMh', []);
  };

  const filterMine =
    currentUserHoTen && (filters.nguoiDeXuat ?? []).length === 1 && (filters.nguoiDeXuat ?? [])[0] === currentUserHoTen;
  const filterToApprove =
    currentUserHoTen && (filters.nguoiDuyet ?? []).length === 1 && (filters.nguoiDuyet ?? [])[0] === currentUserHoTen;

  const toggleMine = () => {
    if (filterMine) setFilter('nguoiDeXuat', []);
    else if (currentUserHoTen) setFilter('nguoiDeXuat', [currentUserHoTen]);
  };
  const toggleToApprove = () => {
    if (filterToApprove) setFilter('nguoiDuyet', []);
    else if (currentUserHoTen) setFilter('nguoiDuyet', [currentUserHoTen]);
  };

  const statusOptions = useMemo(
    () => [
      {
        label: t('phieuDeXuatVatTu.status.pending'),
        value: 'Pending',
        count: unweighted ? 1 : data.filter((r) => r.trang_thai_phieu === TRANG_THAI_CHO_DUYET).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.approved'),
        value: 'Approved',
        count: unweighted ? 1 : data.filter((r) => r.trang_thai_phieu === TRANG_THAI_DA_DUYET).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.rejected'),
        value: 'Rejected',
        count: unweighted ? 1 : data.filter((r) => r.trang_thai_phieu === TRANG_THAI_KHONG_DUYET).length,
      },
    ],
    [data, t, unweighted]
  );

  const noiDeXuatOptions = useMemo(() => {
    if (unweighted) {
      return khoList
        .map((k) => (k.ten_kho ?? '').trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((label) => ({ value: label, label, count: 1 }));
    }
    const seen = new Set<string>();
    return data
      .map((r) => r.ten_noi_de_xuat ?? '')
      .filter((v) => v && !seen.has(v) && (seen.add(v), true))
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({
        value: label,
        label,
        count: data.filter((r) => (r.ten_noi_de_xuat ?? '') === label).length,
      }));
  }, [data, khoList, unweighted]);

  const nguoiDeXuatOptions = useMemo(() => {
    if (unweighted) {
      return employees
        .map((e) => (e.ho_ten ?? '').trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((label) => ({ value: label, label, count: 1 }));
    }
    const seen = new Set<string>();
    return data
      .map((r) => r.ten_nguoi_de_xuat ?? '')
      .filter((v) => v && !seen.has(v) && (seen.add(v), true))
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({
        value: label,
        label,
        count: data.filter((r) => (r.ten_nguoi_de_xuat ?? '') === label).length,
      }));
  }, [data, employees, unweighted]);

  const nguoiDuyetOptions = useMemo(() => {
    if (unweighted) {
      return employees
        .map((e) => (e.ho_ten ?? '').trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((label) => ({ value: label, label, count: 1 }));
    }
    const seen = new Set<string>();
    return data
      .map((r) => r.ten_nguoi_duyet ?? '')
      .filter((v) => v && !seen.has(v) && (seen.add(v), true))
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({
        value: label,
        label,
        count: data.filter((r) => (r.ten_nguoi_duyet ?? '') === label).length,
      }));
  }, [data, employees, unweighted]);

  const tienDoMhOptions = useMemo(() => {
    if (unweighted) {
      return [...TIEN_DO_MH_KNOWN_LABELS].map((label) => ({ value: label, label, count: 1 }));
    }
    const seen = new Set<string>();
    return data
      .map((r) => r.ten_tien_do_mh ?? '')
      .filter((v) => v && !seen.has(v) && (seen.add(v), true))
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({
        value: label,
        label,
        count: data.filter((r) => (r.ten_tien_do_mh ?? '') === label).length,
      }));
  }, [data, unweighted]);

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
        key: 'noiDeXuat',
        label: t('phieuDeXuatVatTu.form.place'),
        icon: Warehouse,
        options: noiDeXuatOptions,
        value: filters.noiDeXuat ?? [],
        onChange: (val: string[]) => setFilter('noiDeXuat', val),
      },
      {
        key: 'nguoiDeXuat',
        label: t('phieuDeXuatVatTu.form.requester'),
        icon: User,
        options: nguoiDeXuatOptions,
        value: filters.nguoiDeXuat ?? [],
        onChange: (val: string[]) => setFilter('nguoiDeXuat', val),
      },
      {
        key: 'nguoiDuyet',
        label: t('phieuDeXuatVatTu.form.approver'),
        icon: UserCheck,
        options: nguoiDuyetOptions,
        value: filters.nguoiDuyet ?? [],
        onChange: (val: string[]) => setFilter('nguoiDuyet', val),
      },
      {
        key: 'tienDoMh',
        label: t('phieuDeXuatVatTu.form.tienDoMh'),
        icon: Package,
        options: tienDoMhOptions,
        value: filters.tienDoMh ?? [],
        onChange: (val: string[]) => setFilter('tienDoMh', val),
      },
    ],
    [
      t,
      statusOptions,
      noiDeXuatOptions,
      nguoiDeXuatOptions,
      nguoiDuyetOptions,
      tienDoMhOptions,
      filters.status,
      filters.noiDeXuat,
      filters.nguoiDeXuat,
      filters.nguoiDuyet,
      filters.tienDoMh,
      setFilter,
    ]
  );

  const renderFilters = (
    <>
      {currentUserId && currentUserHoTen && (
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
            {showMineApproveCounts && mineCount > 0 && <span className="opacity-80">({mineCount})</span>}
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
            {showMineApproveCounts && toApproveCount > 0 && <span className="opacity-80">({toApproveCount})</span>}
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
        value={filters.noiDeXuat ?? []}
        onChange={(v) => setFilter('noiDeXuat', v)}
        placeholder={t('phieuDeXuatVatTu.form.place')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiDeXuatOptions}
        value={filters.nguoiDeXuat ?? []}
        onChange={(v) => setFilter('nguoiDeXuat', v)}
        placeholder={t('phieuDeXuatVatTu.form.requester')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiDuyetOptions}
        value={filters.nguoiDuyet ?? []}
        onChange={(v) => setFilter('nguoiDuyet', v)}
        placeholder={t('phieuDeXuatVatTu.form.approver')}
        icon={UserCheck}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={tienDoMhOptions}
        value={filters.tienDoMh ?? []}
        onChange={(v) => setFilter('tienDoMh', v)}
        placeholder={t('phieuDeXuatVatTu.form.tienDoMh')}
        icon={Package}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const exportAction =
    onExport != null ? (
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.export')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={exportDisabled}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 px-2 sm:px-2.5 gap-1.5 items-center justify-center border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
            aria-label={t('common.export')}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">{t('common.export')}</span>
          </Button>
        </Tooltip>
      </div>
    ) : null;

  const searchTrailingExport =
    onExport != null ? (
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (exportDisabled) return;
            onExport();
          }}
          disabled={exportDisabled}
          className="sm:hidden shrink-0 inline-flex min-h-[44px] min-w-[44px] h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
          aria-label={t('common.export')}
        >
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    ) : undefined;

  const mobileActions = useMemo(() => {
    if (onExport == null) return undefined;
    return [
      {
        key: 'export',
        label: t('common.export'),
        icon: Download,
        onClick: () => {
          if (exportDisabled) return;
          onExport();
        },
        description: '',
      },
    ];
  }, [onExport, exportDisabled, t]);

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      filters={renderFilters}
      filterGroups={filterGroups}
      bulkActions={bulkActions}
      actions={exportAction}
      mobileActions={mobileActions}
      searchTrailing={searchTrailingExport}
      showBack={!!onBack}
      onBack={onBack}
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

export default ChiTietTabToolbar;
