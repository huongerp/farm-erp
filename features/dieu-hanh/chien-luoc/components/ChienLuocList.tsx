import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Target } from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import type { ChienLuoc } from '../core/types';
import {
  TRANG_THAI_DUYET_LABEL_KEYS,
  TRANG_THAI_TRIEN_KHAI_LABEL_KEYS,
} from '../core/constants';
import type { TrangThaiDuyet, TrangThaiTrienKhai } from '../core/types';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';

const BADGE_DUYET: Record<TrangThaiDuyet, string> = {
  cho_duyet: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  da_duyet: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  khong_duyet: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const BADGE_TRIEN_KHAI: Record<TrangThaiTrienKhai, string> = {
  chua_bat_dau: 'bg-muted text-muted-foreground border-border',
  dang_trien_khai: 'bg-primary/10 text-primary border-primary/20',
  tam_ngung: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  huy: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

interface Props {
  data: ChienLuoc[];
  columns: ColumnConfig[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView?: (item: ChienLuoc) => void;
  onEdit: (item: ChienLuoc) => void;
  onDelete: (id: string) => void;
}

const ChienLuocList: React.FC<Props> = ({
  data,
  columns,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
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

  const handleRowClick = (item: ChienLuoc) => {
    onView?.(item);
  };

  const renderCell = (item: ChienLuoc, col: ColumnConfig) => {
    switch (col.id) {
      case 'ten':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg border border-border bg-primary/5 flex items-center justify-center text-primary shrink-0">
                <Target size={16} />
              </div>
              <span className="font-semibold text-foreground">{item.ten}</span>
            </div>
          </td>
        );
      case 'nam':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground">{item.nam}</span>
          </td>
        );
      case 'loai_tows':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {item.loai_tows}
            </span>
          </td>
        );
      case 'nhom_chien_luoc':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground/90 truncate block">
              {item.nhom_chien_luoc || '—'}
            </span>
          </td>
        );
      case 'trang_thai_duyet':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span
              className={cn(
                'inline-flex px-2 py-0.5 rounded-md text-xs font-medium border',
                BADGE_DUYET[item.trang_thai_duyet] ?? 'bg-muted text-muted-foreground border-border'
              )}
            >
              {t(TRANG_THAI_DUYET_LABEL_KEYS[item.trang_thai_duyet])}
            </span>
          </td>
        );
      case 'trang_thai_trien_khai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span
              className={cn(
                'inline-flex px-2 py-0.5 rounded-md text-xs font-medium border',
                BADGE_TRIEN_KHAI[item.trang_thai_trien_khai] ??
                  'bg-muted text-muted-foreground border-border'
              )}
            >
              {t(TRANG_THAI_TRIEN_KHAI_LABEL_KEYS[item.trang_thai_trien_khai])}
            </span>
          </td>
        );
      case 'ngay_bat_dau':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground">
              {item.ngay_bat_dau ? formatDateShort(item.ngay_bat_dau) : '—'}
            </span>
          </td>
        );
      case 'tg_cap_nhat':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground">
              {formatDateShort(item.tg_cap_nhat)}
            </span>
          </td>
        );
      default:
        return <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)} />;
    }
  };

  if (isLoading) {
    return (
      <ListPageSkeleton
        loadingText={t('chienLuoc.searchPlaceholder')}
        tableColumns={visibleColumns.length + 1}
        tableRowCount={5}
        tableColumnWithSubline={0}
        cardCount={0}
      />
    );
  }

  const isEmpty = data.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0 bg-card overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
              <tr>
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
              {isEmpty ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="px-4 py-12 text-center"
                  >
                    <EmptyState
                      title={t('chienLuoc.empty')}
                      description={t('chienLuoc.emptyHint')}
                      icon={<Target className="w-10 h-10 text-muted-foreground mx-auto" />}
                    />
                  </td>
                </tr>
              ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    'group hover:bg-muted/50 transition-colors cursor-pointer'
                  )}
                  onClick={() => handleRowClick(item)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRowClick(item)}
                  role="button"
                  tabIndex={0}
                >
                  {visibleColumns.map((col) => renderCell(item, col))}
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
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
              )))}
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
          recordsLabel={t('chienLuoc.footerRecords')}
        />
      </div>
    </div>
  );
};

export default ChienLuocList;
