import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from '../ui/Button';
import Tooltip from '../ui/Tooltip';

export interface TablePaginationFooterProps {
  /** Tổng số bản ghi */
  totalRecords: number;
  /** Trang hiện tại (1-based) */
  page: number;
  /** Số bản ghi mỗi trang */
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Số bản ghi đã chọn (hiển thị badge) */
  selectedCount?: number;
  /** Label sau số tổng, vd: "bản ghi" / "records" */
  recordsLabel: string;
  /** Các lựa chọn pageSize */
  pageSizeOptions?: number[];
  /** Class cho container */
  className?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

/**
 * Footer phân trang dùng chung cho bảng/danh sách: tổng bản ghi, khoảng đang xem,
 * số đã chọn, chọn page size, nút first/prev/page/next/last (double-click trang để nhập số).
 */
export const TablePaginationFooter: React.FC<TablePaginationFooterProps> = ({
  totalRecords,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedCount = 0,
  recordsLabel,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}) => {
  const { t } = useTranslation();
  const [editingPage, setEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const pageInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const start = totalRecords === 0 ? 0 : Math.min((page - 1) * pageSize + 1, totalRecords);
  const end = Math.min(page * pageSize, totalRecords);

  const handleGoToPage = () => {
    const num = parseInt(pageInput, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
      onPageChange(num);
    }
    setEditingPage(false);
    setPageInput('');
  };

  useEffect(() => {
    if (!editingPage) setPageInput('');
  }, [editingPage]);

  const showAllOption = totalRecords > 100 && !pageSizeOptions.includes(totalRecords);

  return (
    <div
      className={
        className ??
        'border-t border-border bg-card md:bg-muted/10 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 shrink-0'
      }
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <span className="hidden sm:inline tabular-nums">
          <span className="font-semibold text-foreground">{totalRecords}</span> {recordsLabel}
          <span className="text-muted-foreground/60">
            {' '}
            · {start}–{end}
          </span>
        </span>
        <span className="sm:hidden tabular-nums text-muted-foreground">
          <span className="font-medium text-foreground">
            {start}–{end}
          </span>
          <span className="text-muted-foreground/50"> / {totalRecords}</span>
        </span>
        {selectedCount > 0 && (
          <>
            <span className="text-primary font-medium hidden sm:inline tabular-nums">
              · {selectedCount} {t('common.selected')}
            </span>
            <span className="sm:hidden inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary/15 text-primary text-2xs font-bold tabular-nums">
              {selectedCount}✓
            </span>
          </>
        )}
        <div className="hidden sm:flex items-center gap-1.5 border-l border-border pl-2">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-6 w-14 border border-border rounded bg-card px-1 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
            {showAllOption && (
              <option value={totalRecords}>{t('common.all')}</option>
            )}
          </select>
          <span className="text-muted-foreground/60 text-2xs">{t('common.perPage')}</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <Tooltip content={t('common.firstPage')} placement="top">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(1)}
            className="h-6 w-6 p-0 border-border rounded hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronsLeft size={13} />
          </Button>
        </Tooltip>
        <Tooltip content={t('common.prevPage')} placement="top">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="h-6 w-6 p-0 border-border rounded hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronLeft size={13} />
          </Button>
        </Tooltip>
        <Tooltip content={t('common.doubleClickToPage')} placement="top">
          <div className="flex items-center gap-0.5 px-1">
            {editingPage ? (
              <input
                ref={pageInputRef}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
                onBlur={handleGoToPage}
                onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                className="h-6 w-10 text-center text-xs font-bold border border-primary rounded bg-background text-foreground outline-none tabular-nums"
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={() => {
                  setEditingPage(true);
                  setPageInput(String(page));
                  setTimeout(() => pageInputRef.current?.select(), 50);
                }}
                className="h-6 min-w-[24px] flex items-center justify-center rounded bg-primary text-white text-xs font-bold px-1 tabular-nums cursor-default"
              >
                {page}
              </span>
            )}
            <span className="text-muted-foreground/40 text-xs">/</span>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">{totalPages}</span>
          </div>
        </Tooltip>
        <Tooltip content={t('common.nextPage')} placement="top">
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-6 w-6 p-0 border-border rounded hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronRight size={13} />
          </Button>
        </Tooltip>
        <Tooltip content={t('common.lastPage')} placement="top">
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="h-6 w-6 p-0 border-border rounded hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronsRight size={13} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default TablePaginationFooter;
