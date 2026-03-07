import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, CreditCard } from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import type { ThanhToanDoiTac } from '../core/types';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';

interface Props {
  data: ThanhToanDoiTac[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (item: ThanhToanDoiTac) => void;
  onDelete: (id: string) => void;
  onView?: (item: ThanhToanDoiTac) => void;
}

const ThanhToanDoiTacList: React.FC<Props> = ({
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

  const renderCell = (item: ThanhToanDoiTac, col: ColumnConfig) => {
    switch (col.id) {
      case 'so_phieu':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.so_phieu}
            </span>
          </td>
        );
      case 'hang_muc_thanh_toan':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground truncate block">{item.hang_muc_thanh_toan}</span>
          </td>
        );
      case 'ngay':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">{item.ngay}</span>
          </td>
        );
      case 'ten_don_vi':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">{item.ten_don_vi ?? '—'}</span>
          </td>
        );
      case 'ten_doi_tac':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">{item.ten_doi_tac ?? '—'}</span>
          </td>
        );
      case 'ten_trang_thai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/50 text-muted-foreground border-border">
              {item.ten_trang_thai ?? '—'}
            </span>
          </td>
        );
      case 'so_tien':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm tabular-nums font-medium">
              {item.so_tien != null ? item.so_tien.toLocaleString('vi-VN') : '—'}
            </span>
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
        loadingText={t('thanhToanDoiTac.loading')}
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
          title={t('thanhToanDoiTac.empty')}
          description={t('thanhToanDoiTac.emptyHint')}
          icon={<CreditCard className="w-10 h-10 text-muted-foreground" />}
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
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                        title={t('common.edit')}
                      >
                        <Edit size={14} />
                      </button>
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
          recordsLabel={t('thanhToanDoiTac.footerRecords')}
        />
      </div>
    </div>
  );
};

export default ThanhToanDoiTacList;
