import React from 'react';
import DashboardToolbar from '../../../../../components/shared/DashboardToolbar';
import StatsExportDropdown from './StatsExportDropdown';
import type { FilterGroup } from '../../../../../components/ui/MobileFilterSheet';

export type StatsExportFormat = 'excel' | 'pdf';

interface StatsToolbarProps {
  className?: string;
  filters?: React.ReactNode;
  filterGroups?: FilterGroup[];
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onExportReport?: (format: StatsExportFormat) => Promise<void>;
  onPrintReport?: () => void;
  /** Ẩn nút back */
  hideBack?: boolean;
  /** Callback khi bấm back (vd. quay về tab Danh sách) */
  onBack?: () => void;
}

const StatsToolbar: React.FC<StatsToolbarProps> = ({
  className,
  filters,
  filterGroups,
  activeFilterCount = 0,
  onClearFilters,
  onExportReport,
  onPrintReport,
  hideBack = false,
  onBack,
}) => {
  const actions = (
    <div className="flex items-center gap-2">
      <StatsExportDropdown
        onExport={onExportReport ?? (async () => {})}
        onPrint={onPrintReport}
        disabled={!onExportReport}
        compact={false}
      />
    </div>
  );

  const mobileActions = (
    <StatsExportDropdown
      onExport={onExportReport ?? (async () => {})}
      onPrint={onPrintReport}
      disabled={!onExportReport}
      compact
    />
  );

  return (
    <DashboardToolbar
      filters={filters}
      filterGroups={filterGroups}
      activeFilterCount={activeFilterCount}
      onClearFilters={onClearFilters}
      actions={actions}
      mobileActions={mobileActions}
      className={className}
      hideBack={hideBack}
      onBack={onBack}
    />
  );
};

export default StatsToolbar;
