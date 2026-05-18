import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FileDown, Printer } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import DashboardToolbar from '../../../../../components/shared/DashboardToolbar';
import type { FilterGroup } from '../../../../../components/ui/MobileFilterSheet';

interface StatsToolbarProps {
  className?: string;
  filters?: React.ReactNode;
  filterGroups?: FilterGroup[];
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onExportXLSX?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
}

const StatsToolbar: React.FC<StatsToolbarProps> = ({
  className,
  filters,
  filterGroups,
  activeFilterCount = 0,
  onClearFilters,
  onExportXLSX,
  onExportPDF,
  onPrint,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const actions = (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.98]',
          open
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <span>Xuất / In</span>
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[170px] bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {onExportXLSX && (
            <button
              type="button"
              onClick={() => { onExportXLSX(); setOpen(false); }}
              className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors"
            >
              <FileDown size={15} className="text-emerald-600 shrink-0" />
              Xuất Excel (XLSX)
            </button>
          )}
          {onExportPDF && (
            <button
              type="button"
              onClick={() => { onExportPDF(); setOpen(false); }}
              className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors border-t border-border"
            >
              <FileDown size={15} className="text-red-500 shrink-0" />
              Xuất PDF
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              onClick={() => { onPrint(); setOpen(false); }}
              className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors border-t border-border"
            >
              <Printer size={15} className="text-muted-foreground shrink-0" />
              In báo cáo
            </button>
          )}
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

export default StatsToolbar;
