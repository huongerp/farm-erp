import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Building2 } from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import type { DoiThu } from '../core/types';
import { LOAI_DOI_THU_LABELS } from '../core/constants';
import type { LoaiDoiThu } from '../core/constants';

const PHAN_LOAI_BADGE_CLASS: Record<LoaiDoiThu, string> = {
  dau_nganh: 'bg-primary/10 text-primary border-primary/20',
  truc_tiep: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  tiem_nang: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';

interface Props {
  data: DoiThu[];
  columns: ColumnConfig[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView?: (item: DoiThu) => void;
  onEdit: (item: DoiThu) => void;
  onDelete: (id: string) => void;
}

const PhanTichDoiThuList: React.FC<Props> = ({
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

  const handleRowClick = (item: DoiThu) => {
    onView?.(item);
  };

  const renderCell = (item: DoiThu, col: ColumnConfig) => {
    switch (col.id) {
      case 'ten_doi_thu':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <div className="flex items-center gap-3">
              {item.logo ? (
                <img
                  src={item.logo}
                  alt=""
                  className="w-10 h-10 rounded-lg border border-border object-cover bg-muted shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg border border-dashed border-border bg-primary/5 flex items-center justify-center text-primary/70 shrink-0">
                  <Building2 size={18} />
                </div>
              )}
              <span className="font-semibold text-foreground">{item.ten_doi_thu}</span>
            </div>
          </td>
        );
      case 'phan_loai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span
              className={cn(
                'inline-flex px-2 py-0.5 rounded-md text-xs font-medium border',
                PHAN_LOAI_BADGE_CLASS[item.phan_loai as LoaiDoiThu] ?? 'bg-muted/50 text-muted-foreground border-border'
              )}
            >
              {LOAI_DOI_THU_LABELS[item.phan_loai as LoaiDoiThu] ?? item.phan_loai}
            </span>
          </td>
        );
      case 'diem_manh_nhat':
        return (
          <td key={col.id} className="px-4 py-3 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground/90 line-clamp-2">{item.diem_manh_nhat ?? '—'}</span>
          </td>
        );
      case 'link':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <div className="flex flex-wrap gap-2">
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Web
                </a>
              )}
              {item.fanpage && (
                <>
                  {item.website && <span className="text-muted-foreground">·</span>}
                  <a
                    href={item.fanpage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    FB
                  </a>
                </>
              )}
              {!item.website && !item.fanpage && <span className="text-xs text-muted-foreground">—</span>}
            </div>
          </td>
        );
      case 'ngay_cap_nhat':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground">{formatDateShort(item.ngay_cap_nhat)}</span>
          </td>
        );
      default:
        return <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)} />;
    }
  };

  if (isLoading) {
    return (
      <ListPageSkeleton
        loadingText={t('phanTichDoiThu.searchPlaceholder')}
        tableColumns={visibleColumns.length + 1}
        tableRowCount={5}
        tableColumnWithSubline={0}
        cardCount={0}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <EmptyState
          title={t('phanTichDoiThu.empty')}
          description={t('phanTichDoiThu.emptyHint')}
          icon={<Building2 className="w-10 h-10 text-muted-foreground" />}
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
                  className={cn('group hover:bg-muted/50 transition-colors cursor-pointer')}
                  onClick={() => handleRowClick(item)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRowClick(item)}
                  role="button"
                  tabIndex={0}
                >
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
          recordsLabel={t('phanTichDoiThu.footerRecords')}
        />
      </div>
    </div>
  );
};

export default PhanTichDoiThuList;
