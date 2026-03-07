import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, ArrowRightLeft, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useThuChiStore } from '../store/useThuChiStore';
import type { ThuChi } from '../../core/types';
import { BTN_ADD } from '../../../../lib/button-labels';

interface Props {
  data: ThuChi[];
  selectedCount: number;
  onAdd: () => void;
  onClearSelection: () => void;
  onDeleteMany: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
}

const ThuChiToolbar: React.FC<Props> = ({
  data,
  selectedCount,
  onAdd,
  onClearSelection,
  onDeleteMany,
  onExportExcel,
  onPrint,
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
  } = useThuChiStore();

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.loai.length > 0 ? 1 : 0) +
      (filters.trang_thai.length > 0 ? 1 : 0) +
      (filters.tu_ngay ? 1 : 0) +
      (filters.den_ngay ? 1 : 0),
    [searchTerm, filters.loai.length, filters.trang_thai.length, filters.tu_ngay, filters.den_ngay]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('loai', []);
    setFilter('trang_thai', []);
    setFilter('tu_ngay', '');
    setFilter('den_ngay', '');
  };

  const loaiOptions = useMemo(
    () => [
      { label: t('thuChi.loaiThu'), value: 'thu', count: data.filter((d) => d.loai === 'thu').length },
      { label: t('thuChi.loaiChi'), value: 'chi', count: data.filter((d) => d.loai === 'chi').length },
      { label: t('thuChi.loaiChuyenQuy'), value: 'chuyen_quy', count: data.filter((d) => d.loai === 'chuyen_quy').length },
    ],
    [data, t]
  );

  const statusOptions = useMemo(
    () => [
      { label: t('thuChi.status.choDuyet'), value: 'cho_duyet', count: data.filter((d) => d.trang_thai === 'cho_duyet').length },
      { label: t('thuChi.status.hoanThanh'), value: 'hoan_thanh', count: data.filter((d) => d.trang_thai === 'hoan_thanh').length },
      { label: t('thuChi.status.huy'), value: 'huy', count: data.filter((d) => d.trang_thai === 'huy').length },
    ],
    [data, t]
  );

  const filterGroups = useMemo(
    () => [
      { key: 'loai', label: t('thuChi.filterLoai'), icon: ArrowRightLeft, options: loaiOptions, value: filters.loai, onChange: (val: string[]) => setFilter('loai', val) },
      { key: 'trang_thai', label: t('thuChi.filterTrangThai'), icon: Tag, options: statusOptions, value: filters.trang_thai, onChange: (val: string[]) => setFilter('trang_thai', val) },
    ],
    [filters.loai, filters.trang_thai, setFilter, t, loaiOptions, statusOptions]
  );

  const renderFilters = (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar size={16} className="text-muted-foreground shrink-0" />
        <input
          type="date"
          value={filters.tu_ngay}
          onChange={(e) => setFilter('tu_ngay', e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground min-w-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t('thuChi.filterTuNgay')}
        />
        <span className="text-muted-foreground text-sm">→</span>
        <input
          type="date"
          value={filters.den_ngay}
          onChange={(e) => setFilter('den_ngay', e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground min-w-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t('thuChi.filterDenNgay')}
        />
      </div>
      <FilterChipMultiSelect options={loaiOptions} value={filters.loai} onChange={(v) => setFilter('loai', v)} placeholder={t('thuChi.filterLoai')} icon={ArrowRightLeft} className="w-full sm:w-[140px]" />
      <FilterChipMultiSelect options={statusOptions} value={filters.trang_thai} onChange={(v) => setFilter('trang_thai', v)} placeholder={t('thuChi.filterTrangThai')} icon={Tag} className="w-full sm:w-[140px]" />
    </>
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      {onExportExcel && (
        <Button variant="outline" size="sm" onClick={onExportExcel} className="h-8">
          {t('thuChi.export.excel')}
        </Button>
      )}
      {onPrint && (
        <Button variant="outline" size="sm" onClick={onPrint} className="h-8">
          {t('thuChi.export.print')}
        </Button>
      )}
      <Tooltip content={BTN_ADD()} placement="bottom">
        <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3">
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="text-xs">{BTN_ADD()}</span>
        </Button>
      </Tooltip>
    </div>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={onClearSelection}
      onDeleteMany={onDeleteMany}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      showBack
      searchPlaceholder={t('thuChi.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ThuChiToolbar;
