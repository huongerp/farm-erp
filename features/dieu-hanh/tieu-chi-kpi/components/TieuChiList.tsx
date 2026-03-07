import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Gauge } from 'lucide-react';
import { formatDateShort } from '../../../../lib/utils';
import type { TieuChiKpi } from '../core/types';
import { LOAI_DO_LUONG_LABEL_KEYS, TAN_SUAT_LABEL_KEYS } from '../core/constants';
import type { LoaiDoLuong, TanSuat } from '../core/types';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';

interface Props {
  data: TieuChiKpi[];
  hanhDongById: Record<string, string>;
  dvtByMa: Record<string, string>;
  ctdByMa: Record<string, string>;
  columns: ColumnConfig[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (item: TieuChiKpi) => void;
  onEdit: (item: TieuChiKpi) => void;
  onDelete: (id: string) => void;
}

const TieuChiList: React.FC<Props> = ({
  data,
  hanhDongById,
  dvtByMa,
  ctdByMa,
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

  const renderCell = (item: TieuChiKpi, col: ColumnConfig) => {
    switch (col.id) {
      case 'hanh_dong':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground truncate block">
              {hanhDongById[item.id_hanh_dong] ?? '—'}
            </span>
          </td>
        );
      case 'ma':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-mono text-xs text-muted-foreground">{item.ma || '—'}</span>
          </td>
        );
      case 'ten':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg border border-border bg-primary/5 flex items-center justify-center text-primary shrink-0">
                <Gauge size={16} />
              </div>
              <span className="font-semibold text-foreground">{item.ten}</span>
            </div>
          </td>
        );
      case 'don_vi_tinh':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-muted-foreground">
              {dvtByMa[item.don_vi_tinh] ?? item.don_vi_tinh}
            </span>
          </td>
        );
      case 'loai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span
              className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
                item.loai === 'xuoi'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}
            >
              {t(LOAI_DO_LUONG_LABEL_KEYS[item.loai as LoaiDoLuong])}
            </span>
          </td>
        );
      case 'gia_tri_muc_tieu':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm font-medium tabular-nums">
              {item.gia_tri_muc_tieu}
              {dvtByMa[item.don_vi_tinh] ? ` ${dvtByMa[item.don_vi_tinh]}` : ''}
            </span>
          </td>
        );
      case 'cach_tinh_diem':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground">
              {ctdByMa[item.cach_tinh_diem] ?? item.cach_tinh_diem}
            </span>
          </td>
        );
      case 'tan_suat':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground">
              {t(TAN_SUAT_LABEL_KEYS[item.tan_suat as TanSuat])}
            </span>
          </td>
        );
      case 'ty_trong':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm font-medium tabular-nums">{item.ty_trong}%</span>
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
        loadingText={t('tieuChiKpi.searchPlaceholder')}
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
                      title={t('tieuChiKpi.empty')}
                      description={t('tieuChiKpi.emptyHint')}
                      icon={<Gauge className="w-10 h-10 text-muted-foreground mx-auto" />}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onView(item)}
                    onKeyDown={(e) => e.key === 'Enter' && onView(item)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                          title={t('common.edit')}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
          recordsLabel={t('tieuChiKpi.footerRecords')}
        />
      </div>
    </div>
  );
};

export default TieuChiList;
