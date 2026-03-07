import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, ClipboardCheck } from 'lucide-react';
import { formatDateShort } from '../../../../lib/utils';
import type { KetQuaBaoCaoKpi } from '../core/types';
import type { TrangThaiBaoCaoKpi } from '../core/types';
import { TRANG_THAI_BAO_CAO_LABEL_KEYS } from '../core/constants';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';

function formatKy(r: KetQuaBaoCaoKpi): string {
  if (r.ky_thang != null) return `${r.ky_nam}-${String(r.ky_thang).padStart(2, '0')}`;
  if (r.ky_quy != null) return `${r.ky_nam}-Q${r.ky_quy}`;
  return String(r.ky_nam);
}

interface Props {
  data: KetQuaBaoCaoKpi[];
  tieuChiById: Record<string, string>;
  tieuChiMucTieuById: Record<string, number>;
  tieuChiDvtById: Record<string, string>;
  phongBanById: Record<string, string>;
  columns: ColumnConfig[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (item: KetQuaBaoCaoKpi) => void;
  onEdit: (item: KetQuaBaoCaoKpi) => void;
  onDelete: (id: string) => void;
}

const TheoDoiDanhGiaList: React.FC<Props> = ({
  data,
  tieuChiById,
  tieuChiMucTieuById,
  tieuChiDvtById,
  phongBanById,
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

  const renderCell = (item: KetQuaBaoCaoKpi, col: ColumnConfig) => {
    const dvt = tieuChiDvtById[item.id_tieu_chi];
    const mucTieu = tieuChiMucTieuById[item.id_tieu_chi];
    switch (col.id) {
      case 'ky':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm font-medium tabular-nums">{formatKy(item)}</span>
          </td>
        );
      case 'phong_ban':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground">{phongBanById[item.id_phong_ban] ?? item.id_phong_ban}</span>
          </td>
        );
      case 'tieu_chi':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm text-foreground truncate block">
              {tieuChiById[item.id_tieu_chi] ?? item.id_tieu_chi}
            </span>
          </td>
        );
      case 'muc_tieu':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm tabular-nums text-muted-foreground">
              {mucTieu != null ? `${mucTieu}${dvt ? ` ${dvt}` : ''}` : '—'}
            </span>
          </td>
        );
      case 'thuc_te':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm font-medium tabular-nums">
              {item.gia_tri_thuc_te}
              {dvt ? ` ${dvt}` : ''}
            </span>
          </td>
        );
      case 'diem':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="text-sm tabular-nums">
              {item.diem_tinh != null ? `${item.diem_tinh}` : '—'}
            </span>
          </td>
        );
      case 'trang_thai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span
              className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
                item.trang_thai === 'da_danh_gia'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : item.trang_thai === 'da_gui'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                    : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {t(TRANG_THAI_BAO_CAO_LABEL_KEYS[item.trang_thai as TrangThaiBaoCaoKpi])}
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
        loadingText={t('theoDoiDanhGia.searchPlaceholder')}
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
                      title={t('theoDoiDanhGia.empty')}
                      description={t('theoDoiDanhGia.emptyHint')}
                      icon={<ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto" />}
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
          recordsLabel={t('theoDoiDanhGia.footerRecords')}
        />
      </div>
    </div>
  );
};

export default TheoDoiDanhGiaList;
