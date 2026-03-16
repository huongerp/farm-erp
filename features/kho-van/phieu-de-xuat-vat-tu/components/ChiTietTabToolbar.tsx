import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Warehouse, User, UserCheck, Package } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useChiTietTabStore } from '../store/useChiTietTabStore';
import type { PhieuDeXuatVatTuChiTietRow } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';
import type { Employee } from '../../../he-thong/nhan-vien/core/types';

interface Props {
  data: PhieuDeXuatVatTuChiTietRow[];
  employees: Employee[];
  currentUserId: string | null;
  selectedCount: number;
  /** Khi có: bấm Back gọi callback (vd. về tab Danh sách). Khi không có: không hiện nút Back. */
  onBack?: () => void;
  /** Nút hành động khi có chọn dòng (vd. Tiến độ). */
  bulkActions?: React.ReactNode;
}

const ChiTietTabToolbar: React.FC<Props> = ({
  data,
  employees,
  currentUserId,
  bulkActions,
  selectedCount,
  onBack,
}) => {
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
  } = useChiTietTabStore();

  const statusLen = filters.status?.length ?? 0;
  const noiDeXuatLen = filters.noiDeXuat?.length ?? 0;
  const nguoiDeXuatLen = filters.nguoiDeXuat?.length ?? 0;
  const nguoiDuyetLen = filters.nguoiDuyet?.length ?? 0;
  const tienDoMhLen = filters.tienDoMh?.length ?? 0;
  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      statusLen +
      (noiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDuyetLen > 0 ? 1 : 0) +
      (tienDoMhLen > 0 ? 1 : 0),
    [searchTerm, statusLen, noiDeXuatLen, nguoiDeXuatLen, nguoiDuyetLen, tienDoMhLen]
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

  const handleClearAllFilters = () => {
    setSearchTerm('');
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
        count: data.filter((r) => r.trang_thai_phieu === TRANG_THAI_CHO_DUYET).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.approved'),
        value: 'Approved',
        count: data.filter((r) => r.trang_thai_phieu === TRANG_THAI_DA_DUYET).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.rejected'),
        value: 'Rejected',
        count: data.filter((r) => r.trang_thai_phieu === TRANG_THAI_KHONG_DUYET).length,
      },
    ],
    [data, t]
  );

  const noiDeXuatOptions = useMemo(() => {
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
  }, [data]);

  const nguoiDeXuatOptions = useMemo(() => {
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
  }, [data]);

  const nguoiDuyetOptions = useMemo(() => {
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
  }, [data]);

  const tienDoMhOptions = useMemo(() => {
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
  }, [data]);

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
            {mineCount > 0 && <span className="opacity-80">({mineCount})</span>}
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
            {toApproveCount > 0 && <span className="opacity-80">({toApproveCount})</span>}
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

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      filters={renderFilters}
      filterGroups={filterGroups}
      bulkActions={bulkActions}
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
