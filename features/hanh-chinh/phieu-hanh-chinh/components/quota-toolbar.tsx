import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ListOrdered, User } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import FilterChipSingleSelect from '../../../../components/shared/FilterChipSingleSelect';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getAdminFormTypeOptions } from '../../thiet-lap-cong-luong/core/constants';
import type { AdminFormQuotaRow } from '../core/types';

interface Props {
  /** Danh sách dòng quota để đếm count theo loại phiếu. */
  items?: AdminFormQuotaRow[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: { type: string[]; nguoiXem: string };
  setFilter: (key: 'type' | 'nguoiXem', value: any) => void;
  /** Kỳ đang tính định mức, vd "10/2026" — tab luôn tính theo tháng hiện tại. */
  thangLabel: string;
  /** Chip chọn nhân viên — chỉ truyền khi người dùng có viewAll. */
  personOptions?: { value: string; label: string; count?: number }[];
  /** Nhân viên đang xem (đã quy "chính mình" về id thật). */
  nguoiDangXem: string;
  currentUserId: string;
  columns: ColumnConfig[];
  toggleColumn: (id: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resetColumns: () => void;
  resetColumnWidths: () => void;
  selectedIds: Set<string>;
  clearSelection: () => void;
}

const AdminFormQuotaToolbar: React.FC<Props> = ({
  items = [],
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
  thangLabel,
  personOptions,
  nguoiDangXem,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const selectedCount = selectedIds.size;
  const dangXemNguoiKhac = !!personOptions && nguoiDangXem !== currentUserId;
  const activeFilterCount = filters.type.length + (dangXemNguoiKhac ? 1 : 0);
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const row of items) {
      if (row.loai_phieu) m[row.loai_phieu] = (m[row.loai_phieu] || 0) + 1;
    }
    return m;
  }, [items]);
  const typeOptions = useMemo(
    () => getAdminFormTypeOptions(t).map((o) => ({ ...o, count: typeCounts[o.value] ?? 0 })),
    [t, typeCounts]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'type',
        label: t('adminForm.store.typeCol'),
        icon: ListOrdered,
        options: typeOptions,
        value: filters.type,
        onChange: (val: string[]) => setFilter('type', val),
      },
      ...(personOptions
        ? [
            {
              key: 'nguoiXem',
              label: t('adminForm.store.requesterCol'),
              icon: User,
              options: personOptions,
              value: [nguoiDangXem],
              // Sheet là chọn nhiều — giữ người vừa bấm; bỏ hết = quay về chính mình.
              onChange: (val: string[]) => setFilter('nguoiXem', val.find((v) => v !== nguoiDangXem) ?? ''),
            },
          ]
        : []),
    ],
    [filters.type, setFilter, typeOptions, personOptions, nguoiDangXem, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={typeOptions}
        value={filters.type}
        onChange={(val) => setFilter('type', val)}
        placeholder={t('adminForm.store.typeCol')}
        icon={ListOrdered}
        className="w-full sm:w-[220px]"
        size="sm"
      />
      {personOptions && (
        <FilterChipSingleSelect
          options={personOptions}
          value={nguoiDangXem}
          onChange={(val) => setFilter('nguoiXem', val ?? '')}
          placeholder={t('adminForm.store.requesterCol')}
          icon={User}
          className="w-full sm:w-[220px]"
        />
      )}
      {/* Định mức tính theo tháng — không cho chọn kỳ, chỉ ghi rõ tháng đang tính. */}
      <span className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 text-xs font-medium text-muted-foreground whitespace-nowrap">
        <Calendar size={13} className="shrink-0" />
        {t('adminForm.quota.kyThang', { thang: thangLabel })}
      </span>
    </>
  );

  const handleClearAllFilters = () => {
    setFilter('type', []);
    setFilter('nguoiXem', '');
  };

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      filters={renderFilters}
      filterGroups={filterGroups}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
    />
  );
};

export default AdminFormQuotaToolbar;
