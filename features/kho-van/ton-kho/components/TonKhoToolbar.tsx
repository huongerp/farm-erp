import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

interface TonKhoToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder: string;
  columns: ColumnConfig[];
  onToggleColumn: (id: string) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  onResetColumns: () => void;
  filters?: React.ReactNode;
  activeFilterCount?: number;
  onClearAllFilters?: () => void;
  filterGroups?: FilterGroup[];
  /** Xuất (Excel): cùng pattern với GenericToolbar + DanhSachToolbar (desktop icon + mobile sheet). */
  onExport?: () => void;
}

/**
 * Toolbar chuẩn cho module Tồn kho (chỉ xem): search + filter chips + quản lý cột.
 */
const TonKhoToolbar: React.FC<TonKhoToolbarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  columns,
  onToggleColumn,
  onReorderColumns,
  onResetColumns,
  filters,
  activeFilterCount = 0,
  onClearAllFilters,
  filterGroups,
  onExport,
}) => {
  const { t } = useTranslation();

  const mobileActions = useMemo(
    () =>
      onExport
        ? [{ key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' }]
        : undefined,
    [onExport, t]
  );

  const actions = onExport ? (
    <div className="hidden sm:flex items-center gap-2">
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
        >
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  ) : null;

  return (
    <GenericToolbar
      selectedCount={0}
      onClearSelection={() => {}}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      showBack
      actions={actions}
      mobileActions={mobileActions}
      filters={filters}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={onClearAllFilters}
      filterGroups={filterGroups}
      columns={columns}
      onToggleColumn={onToggleColumn}
      onReorderColumns={onReorderColumns}
      onResetColumns={onResetColumns}
    />
  );
};

export default TonKhoToolbar;
