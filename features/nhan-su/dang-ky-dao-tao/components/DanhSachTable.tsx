import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, PlayCircle, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import {
  getTrangThaiDangKyLabel,
  getTrangThaiDangKyBadgeClass,
  getLoaiDangKyLabel,
} from '../core/constants';
import { useDangKyDaoTaoStore } from '../store/useDangKyDaoTaoStore';
import type { DangKyThamGia } from '../core/types';

interface Props {
  data: DangKyThamGia[];
  isLoading: boolean;
  onView: (item: DangKyThamGia) => void;
  onVaoHoc: (item: DangKyThamGia) => void;
  onDelete: (id: string) => void;
  showNhanVienColumn?: boolean;
}

const DanhSachTable: React.FC<Props> = ({
  data,
  isLoading,
  onView,
  onVaoHoc,
  onDelete,
  showNhanVienColumn = false,
}) => {
  const { t } = useTranslation();
  const {
    columns,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    sort,
    setSort,
  } = useDangKyDaoTaoStore();

  const visibleColumns = React.useMemo(() => {
    if (showNhanVienColumn) return columns;
    return columns.filter((c) => c.id !== 'ten_nhan_vien');
  }, [columns, showNhanVienColumn]);

  const renderCell = (colId: string, item: DangKyThamGia) => {
    switch (colId) {
      case 'ma_khoa_hoc':
        return (
          <span className="text-sm text-foreground font-mono tabular-nums">
            {item.ma_khoa_hoc ?? '—'}
          </span>
        );
      case 'ten_khoa_hoc':
        return (
          <span
            className="font-medium text-sm text-foreground block min-w-0 truncate"
            title={item.ten_khoa_hoc ?? undefined}
          >
            {item.ten_khoa_hoc ?? '—'}
          </span>
        );
      case 'ten_nhan_vien':
        return (
          <span className="text-sm text-foreground truncate block max-w-[180px]">
            {item.ten_nhan_vien ?? '—'}
          </span>
        );
      case 'loai_dang_ky':
        return (
          <span className="text-xs text-muted-foreground">
            {getLoaiDangKyLabel(item.loai_dang_ky, t)}
          </span>
        );
      case 'trang_thai':
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getTrangThaiDangKyBadgeClass(item.trang_thai)}`}
          >
            {getTrangThaiDangKyLabel(item.trang_thai, t)}
          </span>
        );
      case 'tien_do':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {item.so_chuong_da_pass != null && item.so_chuong_tong != null
              ? `${item.so_chuong_da_pass}/${item.so_chuong_tong} ${t('dangKyDaoTao.chuong')}`
              : item.so_bai_da_xem != null && item.so_bai_tong != null
                ? `${item.so_bai_da_xem}/${item.so_bai_tong}`
                : '—'}
          </span>
        );
      case 'tg_dang_ky':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDateTimeShort(item.tg_dang_ky)}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            {(item.trang_thai === 1 || item.trang_thai === 2) && (
              <Tooltip content={t('dangKyDaoTao.vaoHoc')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVaoHoc(item);
                  }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                  aria-label={t('dangKyDaoTao.vaoHoc')}
                >
                  <PlayCircle size={16} />
                </button>
              </Tooltip>
            )}
            <Tooltip content={t('common.delete')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                aria-label={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: DangKyThamGia, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView(item)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <BookOpen size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {item.ten_khoa_hoc ?? item.ma_khoa_hoc ?? '—'}
            </h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelection(item.id)}
                className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                aria-label={t('common.select')}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getTrangThaiDangKyBadgeClass(item.trang_thai)}`}
            >
              {getTrangThaiDangKyLabel(item.trang_thai, t)}
            </span>
            <span className="text-xs text-muted-foreground">
              {item.so_chuong_da_pass != null && item.so_chuong_tong != null
                ? `${item.so_chuong_da_pass}/${item.so_chuong_tong} ${t('dangKyDaoTao.chuong')}`
                : ''}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1.5 pt-2.5 border-t border-border">
        {(item.trang_thai === 1 || item.trang_thai === 2) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVaoHoc(item);
            }}
            className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all"
            aria-label={t('dangKyDaoTao.vaoHoc')}
          >
            <PlayCircle size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 rounded-lg transition-all"
          aria-label={t('common.delete')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('common.loading')}
      selectedIds={selectedIds}
      onToggleSelection={toggleSelection}
      onToggleAll={toggleAllSelection}
      page={pagination.page}
      pageSize={pagination.pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      sort={sort}
      onSort={setSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={(item) => onView(item)}
      emptyTitle={t('dangKyDaoTao.emptyTitle')}
      emptyDescription={t('dangKyDaoTao.emptyDescription')}
    />
  );
};

export default DanhSachTable;
