import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FileText } from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import type { PhieuDeXuatVatTu } from '../core/types';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';

interface Props {
  data: PhieuDeXuatVatTu[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (item: PhieuDeXuatVatTu) => void;
  onDelete: (id: string) => void;
  onView?: (item: PhieuDeXuatVatTu) => void;
  canEditItem?: (item: PhieuDeXuatVatTu) => boolean;
  isOverdue?: (item: PhieuDeXuatVatTu) => boolean;
}

const PhieuDeXuatVatTuList: React.FC<Props> = ({
  data,
  columns,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
  canEditItem,
  isOverdue,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const totalRecords = data.length;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const allIds = useMemo(() => paginatedData.map((p) => p.id), [paginatedData]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const renderCell = (item: PhieuDeXuatVatTu, col: ColumnConfig) => {
    switch (col.id) {
      case 'so_phieu':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.so_phieu}
            </span>
          </td>
        );
      case 'ngay':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">{item.ngay}</span>
          </td>
        );
      case 'ngay_can':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">{item.ngay_can}</span>
          </td>
        );
      case 'ten_noi_de_xuat':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">{item.ten_noi_de_xuat ?? '—'}</span>
          </td>
        );
      case 'ten_nguoi_de_xuat':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">{item.ten_nguoi_de_xuat ?? '—'}</span>
          </td>
        );
      case 'ten_nguoi_duyet':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">{item.ten_nguoi_duyet ?? '—'}</span>
          </td>
        );
      case 'ghi_chu':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground line-clamp-2">{item.ghi_chu ?? '—'}</span>
          </td>
        );
      case 'trang_thai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <div className="flex flex-wrap items-center gap-1">
              {item.trang_thai === 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {t('phieuDeXuatVatTu.status.pending')}
                </span>
              )}
              {item.trang_thai === 1 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {t('phieuDeXuatVatTu.status.approved')}
                </span>
              )}
              {item.trang_thai === 2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {t('phieuDeXuatVatTu.status.rejected')}
                </span>
              )}
              {isOverdue?.(item) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  {t('phieuDeXuatVatTu.overdueWarning')}
                </span>
              )}
            </div>
          </td>
        );
      case 'tg_cap_nhat':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>
          </td>
        );
      default:
        return <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)} />;
    }
  };

  if (isLoading) {
    return (
      <ListPageSkeleton
        loadingText={t('phieuDeXuatVatTu.loading')}
        tableColumns={visibleColumns.length + 2}
        tableRowCount={5}
        tableColumnWithSubline={0}
        cardCount={3}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <EmptyState
          title={t('phieuDeXuatVatTu.empty')}
          description={t('phieuDeXuatVatTu.emptyHint')}
          icon={<FileText className="w-10 h-10 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-card overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
              <tr>
                <th className="px-4 py-3 w-10" style={{ minWidth: 40 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onToggleAllSelection(allIds)}
                    className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                    aria-label={t('common.selectAll')}
                  />
                </th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap"
                    style={getColumnCellStyle(col)}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs text-right w-24">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
              {paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className={cn('group hover:bg-muted/50 transition-colors', onView && 'cursor-pointer')}
                  onClick={onView ? () => onView(item) : undefined}
                  onKeyDown={onView ? (e) => e.key === 'Enter' && onView(item) : undefined}
                  role={onView ? 'button' : undefined}
                  tabIndex={onView ? 0 : undefined}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => onToggleSelection(item.id)}
                      className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                      aria-label={t('common.select')}
                    />
                  </td>
                  {visibleColumns.map((col) => renderCell(item, col))}
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      {(!canEditItem || canEditItem(item)) && (
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                          title={t('common.edit')}
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="shrink-0 border-t border-border bg-muted/30">
        <TablePaginationFooter
          totalRecords={totalRecords}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          selectedCount={selectedIds.size}
          recordsLabel={t('phieuDeXuatVatTu.footerRecords')}
        />
      </div>
    </div>
  );
};

export default PhieuDeXuatVatTuList;
