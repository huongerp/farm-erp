import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, Target, Building2, Users } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useChamDiemKpiManagedStore } from '../store/useChamDiemKpiManagedStore';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { getDanhGiaKpiLabel } from '../core/constants';
import type { ChamDiemKpiRecord } from '../core/types';

interface Props {
  /** Danh sách bản ghi chấm KPI (tôi quản lý) để đếm count. */
  items?: ChamDiemKpiRecord[];
  onAdd: () => void;
  onDeleteMany?: (ids: string[]) => void;
}

const DANH_GIA_OPTIONS = (t: (key: string) => string) => [
  { value: 'dat', label: getDanhGiaKpiLabel('dat', t) },
  { value: 'khong_dat', label: getDanhGiaKpiLabel('khong_dat', t) },
];

const ChamDiemKpiManagedToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
}) => {
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    selectedIds,
    clearSelection,
  } = useChamDiemKpiManagedStore();
  const { data: departments = [] } = useDepartments();

  const phongList = useMemo(() => departments.filter((d) => d.cap_do === 1).map((d) => d.ten_phong_ban), [departments]);
  const nhomList = useMemo(() => departments.filter((d) => d.cap_do === 2).map((d) => d.ten_phong_ban), [departments]);

  const counts = useMemo(() => {
    const periodStr = (r: ChamDiemKpiRecord) => `${r.nam}-${String(r.thang).padStart(2, '0')}`;
    const matchYearMonth = (r: ChamDiemKpiRecord) => !filters.yearMonth || periodStr(r).startsWith(filters.yearMonth);
    const matchDanhGia = (r: ChamDiemKpiRecord) => filters.danhGia.length === 0 || filters.danhGia.includes(r.danh_gia);
    const matchPhong = (r: ChamDiemKpiRecord) => filters.phongBan.length === 0 || (r.ten_phong_ban != null && filters.phongBan.includes(r.ten_phong_ban));
    const matchNhom = (r: ChamDiemKpiRecord) => filters.nhom.length === 0 || (r.ten_phong_ban != null && filters.nhom.includes(r.ten_phong_ban));

    const phongCounts: Record<string, number> = {};
    const nhomCounts: Record<string, number> = {};
    const danhGiaCounts: Record<string, number> = {};
    for (const r of items) {
      if (matchYearMonth(r) && matchDanhGia(r) && matchNhom(r) && r.ten_phong_ban && phongList.includes(r.ten_phong_ban)) {
        phongCounts[r.ten_phong_ban] = (phongCounts[r.ten_phong_ban] || 0) + 1;
      }
      if (matchYearMonth(r) && matchDanhGia(r) && matchPhong(r) && r.ten_phong_ban && nhomList.includes(r.ten_phong_ban)) {
        nhomCounts[r.ten_phong_ban] = (nhomCounts[r.ten_phong_ban] || 0) + 1;
      }
      if (matchYearMonth(r) && matchPhong(r) && matchNhom(r) && r.danh_gia) {
        danhGiaCounts[r.danh_gia] = (danhGiaCounts[r.danh_gia] || 0) + 1;
      }
    }
    return { phongCounts, nhomCounts, danhGiaCounts };
  }, [items, filters, phongList, nhomList]);

  const phongOptions = useMemo(
    () =>
      departments
        .filter((d) => d.cap_do === 1)
        .map((d) => ({ label: d.ten_phong_ban, value: d.ten_phong_ban, count: counts.phongCounts[d.ten_phong_ban] ?? 0 })),
    [departments, counts.phongCounts]
  );
  const nhomOptions = useMemo(
    () =>
      departments
        .filter((d) => d.cap_do === 2)
        .map((d) => ({ label: d.ten_phong_ban, value: d.ten_phong_ban, count: counts.nhomCounts[d.ten_phong_ban] ?? 0 })),
    [departments, counts.nhomCounts]
  );

  const activeFilterCount =
    filters.danhGia.length +
    (filters.yearMonth ? 1 : 0) +
    filters.phongBan.length +
    filters.nhom.length;
  const handleClearAllFilters = () => {
    setFilter('danhGia', []);
    setFilter('yearMonth', '');
    setFilter('phongBan', []);
    setFilter('nhom', []);
  };

  const danhGiaOptions = useMemo(
    () => DANH_GIA_OPTIONS(t).map((o) => ({ ...o, count: counts.danhGiaCounts[o.value] ?? 0 })),
    [t, counts.danhGiaCounts]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={phongOptions}
        value={filters.phongBan}
        onChange={(val) => setFilter('phongBan', val)}
        placeholder={t('chamDiemKpi.filter.phong')}
        icon={Building2}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nhomOptions}
        value={filters.nhom}
        onChange={(val) => setFilter('nhom', val)}
        placeholder={t('chamDiemKpi.filter.nhom')}
        icon={Users}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={danhGiaOptions}
        value={filters.danhGia}
        onChange={(val) => setFilter('danhGia', val)}
        placeholder={t('chamDiemKpi.store.danhGiaCol')}
        icon={Target}
        className="w-full sm:w-[140px]"
      />
      <div className="relative w-full sm:w-[160px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="month"
          value={filters.yearMonth}
          onChange={(e) => setFilter('yearMonth', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </div>
    </>
  );

  const renderActions = (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  );

  return (
    <GenericToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={[]}
      onAdd={onAdd}
      searchPlaceholder={t('chamDiemKpi.managed.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={
        onDeleteMany && selectedIds.size > 0
          ? () => onDeleteMany(Array.from(selectedIds))
          : undefined
      }
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default ChamDiemKpiManagedToolbar;
