import React from 'react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import StatsExportDropdown from './StatsExportDropdown';

export type StatsExportFormat = 'excel' | 'pdf';

interface StatsToolbarProps {
  className?: string;
  filters?: React.ReactNode;
  /** Hàng 2 (mobile: hiển thị bộ lọc dưới hàng 1). Dùng kèm row2ContentMobileOnly để tránh trùng với filters trên desktop. */
  row2Content?: React.ReactNode;
  /** true = row2Content chỉ hiện trên mobile */
  row2ContentMobileOnly?: boolean;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onExportReport?: (format: StatsExportFormat) => Promise<void>;
  onPrintReport?: () => void;
  hideBack?: boolean;
  onBack?: () => void;
  /** Nút/action tùy chỉnh bên cạnh Export (vd. tùy chỉnh card KPI) */
  customActions?: React.ReactNode;
}

const StatsToolbar: React.FC<StatsToolbarProps> = ({
  className,
  filters,
  row2Content,
  row2ContentMobileOnly = false,
  activeFilterCount = 0,
  onClearFilters,
  onExportReport,
  onPrintReport,
  hideBack = false,
  onBack,
  customActions,
}) => {
  const actions = (
    <div className="flex items-center gap-2">
      {customActions}
      <StatsExportDropdown
        onExport={onExportReport ?? (async () => {})}
        onPrint={onPrintReport}
        disabled={!onExportReport}
        compact={false}
      />
    </div>
  );

  const mobileActions = (
    <>
      {customActions}
      <StatsExportDropdown
        onExport={onExportReport ?? (async () => {})}
        onPrint={onPrintReport}
        disabled={!onExportReport}
        compact
      />
    </>
  );

  return (
    <DashboardToolbar
      filters={filters}
      row2Content={row2Content}
      row2ContentMobileOnly={row2ContentMobileOnly}
      activeFilterCount={activeFilterCount}
      onClearFilters={onClearFilters}
      onBack={onBack}
      actions={actions}
      mobileActions={mobileActions}
      className={className}
      hideBack={hideBack}
    />
  );
};

export default StatsToolbar;
