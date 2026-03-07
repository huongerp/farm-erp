import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FileDown, Printer, Building2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

export interface NoiQuanLyStatsToolbarProps {
  className?: string;
  /** Options cho filter chi nhánh: { label, value, subLabel? } */
  branchOptions: { label: string; value: string; subLabel?: string }[];
  filterIdChiNhanh: string[];
  onFilterIdChiNhanhChange: (value: string[]) => void;
  onExportReport?: () => void;
  onPrintReport?: () => void;
}

const NoiQuanLyStatsToolbar: React.FC<NoiQuanLyStatsToolbarProps> = ({
  className,
  branchOptions,
  filterIdChiNhanh,
  onFilterIdChiNhanhChange,
  onExportReport,
  onPrintReport,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actionsOpen) return;
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [actionsOpen]);

  const activeFilterCount = filterIdChiNhanh.length;
  const onClearFilters = () => onFilterIdChiNhanhChange([]);

  const filterGroups: FilterGroup[] = [
    {
      key: 'id_chi_nhanh',
      label: t('noiQuanLy.stats.branchCol'),
      icon: Building2,
      options: branchOptions,
      value: filterIdChiNhanh,
      onChange: onFilterIdChiNhanhChange,
    },
  ];

  const filters = (
    <FilterChipMultiSelect
      options={branchOptions}
      value={filterIdChiNhanh}
      onChange={onFilterIdChiNhanhChange}
      placeholder={t('noiQuanLy.stats.branchCol')}
      icon={Building2}
      className="w-full sm:w-[180px]"
      size="md"
    />
  );

  const actions = (
    <div className="relative shrink-0" ref={actionsRef}>
      <button
        type="button"
        onClick={() => setActionsOpen((v) => !v)}
        className={cn(
          'h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.98]',
          actionsOpen
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <span>{t('common.actions')}</span>
        <ChevronDown size={14} className={cn('transition-transform', actionsOpen && 'rotate-180')} />
      </button>
      {actionsOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => {
              onExportReport?.();
              setActionsOpen(false);
            }}
            className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors"
          >
            <FileDown size={16} className="text-muted-foreground" />
            {t('noiQuanLy.stats.exportReport')}
          </button>
          <button
            type="button"
            onClick={() => {
              onPrintReport?.();
              setActionsOpen(false);
            }}
            className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors border-t border-border"
          >
            <Printer size={16} className="text-muted-foreground" />
            {t('noiQuanLy.stats.printReport')}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardToolbar
      onBack={() => navigate(-1)}
      filters={filters}
      filterGroups={filterGroups}
      activeFilterCount={activeFilterCount}
      onClearFilters={onClearFilters}
      actions={actions}
      className={className}
    />
  );
};

export default NoiQuanLyStatsToolbar;
