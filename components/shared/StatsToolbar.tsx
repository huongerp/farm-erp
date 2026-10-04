import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FileDown, FileText, Printer } from 'lucide-react';
import { cn } from '../../lib/utils';
import DashboardToolbar from './DashboardToolbar';
import type { FilterGroup } from '../ui/MobileFilterSheet';

/**
 * Toolbar tab Thống kê: nút Back + filter chips + menu "Thao tác" (Xuất báo cáo / [Xuất PDF] / In).
 * Chuỗi hiển thị là của từng module → caller dịch sẵn rồi truyền vào.
 */
export interface StatsToolbarProps {
  className?: string;
  filters?: React.ReactNode;
  filterGroups?: FilterGroup[];
  /** Bộ lọc tự do cho bảng lọc mobile (khoảng ngày…) — chuyển thẳng xuống DashboardToolbar. */
  mobileFilterExtra?: React.ReactNode;
  mobileFilterExtraCount?: number;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  /** Nhãn nút mở menu (vd. `t('<module>.stats.actions')`). */
  actionsLabel: string;
  /** Nhãn mục xuất báo cáo (Excel). */
  exportLabel: string;
  /** Không truyền → ẩn mục xuất (đừng truyền handler chỉ báo "đang phát triển"). */
  onExportReport?: () => void;
  /** Có nhãn thì menu thêm mục xuất PDF (giữa Excel và In) và rộng 170px. */
  exportPdfLabel?: string;
  onExportPDF?: () => void;
  /** Nhãn mục in báo cáo. */
  printLabel: string;
  onPrintReport?: () => void;
}

const ITEM_CLASS =
  'w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors';

const StatsToolbar: React.FC<StatsToolbarProps> = ({
  className,
  filters,
  filterGroups,
  mobileFilterExtra,
  mobileFilterExtraCount,
  activeFilterCount = 0,
  onClearFilters,
  actionsLabel,
  exportLabel,
  onExportReport,
  exportPdfLabel,
  onExportPDF,
  printLabel,
  onPrintReport,
}) => {
  const navigate = useNavigate();
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const hasPdf = exportPdfLabel != null;

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

  const runAndClose = (fn?: () => void) => () => {
    fn?.();
    setActionsOpen(false);
  };

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
        <span>{actionsLabel}</span>
        <ChevronDown size={14} className={cn('transition-transform', actionsOpen && 'rotate-180')} />
      </button>
      {actionsOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1.5 z-50 bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150',
            hasPdf ? 'min-w-[170px]' : 'min-w-[160px]'
          )}
        >
          {onExportReport && (
            <button type="button" onClick={runAndClose(onExportReport)} className={ITEM_CLASS}>
              <FileDown size={16} className="text-muted-foreground" />
              {exportLabel}
            </button>
          )}
          {hasPdf && (
            <button
              type="button"
              onClick={runAndClose(onExportPDF)}
              className={cn(ITEM_CLASS, onExportReport && 'border-t border-border')}
            >
              <FileText size={16} className="text-muted-foreground" />
              {exportPdfLabel}
            </button>
          )}
          <button
            type="button"
            onClick={runAndClose(onPrintReport)}
            className={cn(ITEM_CLASS, (onExportReport || hasPdf) && 'border-t border-border')}
          >
            <Printer size={16} className="text-muted-foreground" />
            {printLabel}
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
      mobileFilterExtra={mobileFilterExtra}
      mobileFilterExtraCount={mobileFilterExtraCount}
      activeFilterCount={activeFilterCount}
      onClearFilters={onClearFilters}
      actions={actions}
      className={className}
    />
  );
};

export default StatsToolbar;
