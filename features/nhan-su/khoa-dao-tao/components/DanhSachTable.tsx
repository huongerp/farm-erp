import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, BookOpen } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import {
  getTrangThaiKhoaDaoTaoLabel,
  getTrangThaiKhoaDaoTaoBadgeClass,
  getLoaiKhoaHocBadgeClass,
} from '../core/constants';
import { useKhoaDaoTaoStore } from '../store/useKhoaDaoTaoStore';
import type { KhoaDaoTao } from '../core/types';

interface Props {
  data: KhoaDaoTao[];
  isLoading: boolean;
  onView: (item: KhoaDaoTao) => void;
  onEdit: (item: KhoaDaoTao) => void;
  onDelete: (id: string) => void;
}

const DanhSachTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete }) => {
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
  } = useKhoaDaoTaoStore();

  const renderCell = (colId: string, item: KhoaDaoTao) => {
    switch (colId) {
      case 'ma':
        return (
          <span className="text-sm text-foreground font-mono tabular-nums">
            {item.ma}
          </span>
        );
      case 'ten':
        return (
          <span
            className="font-medium text-sm text-foreground block min-w-0 truncate"
            title={item.ten}
          >
            {item.ten}
          </span>
        );
      case 'ten_loai_khoa_hoc':
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium truncate max-w-full ${getLoaiKhoaHocBadgeClass(item.id_loai_khoa_hoc)}`}
            title={item.ten_loai_khoa_hoc ?? undefined}
          >
            {item.ten_loai_khoa_hoc ?? '—'}
          </span>
        );
      case 'so_chuong':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {item.so_chuong ?? 0}
          </span>
        );
      case 'so_bai_hoc':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {item.so_bai_hoc ?? 0}
          </span>
        );
      case 'so_bai_test':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {item.so_bai_test ?? 0}
          </span>
        );
      case 'phan_quyen':
        return (
          <span className="text-xs text-muted-foreground">
            {(item.id_chuc_vu_xem?.length ?? 0) > 0
              ? t('khoaDaoTao.table.phanQuyenCount', { count: item.id_chuc_vu_xem!.length })
              : t('khoaDaoTao.detail.phanQuyenEmpty')}
          </span>
        );
      case 'thoi_luong':
        return (
          <span className="text-sm text-foreground tabular-nums whitespace-nowrap">
            {item.thoi_luong} {t('khoaDaoTao.gio')}
          </span>
        );
      case 'ngay_bat_dau':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDate(item.ngay_bat_dau)}
          </span>
        );
      case 'ngay_ket_thuc':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDate(item.ngay_ket_thuc)}
          </span>
        );
      case 'trang_thai':
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getTrangThaiKhoaDaoTaoBadgeClass(item.trang_thai)}`}
          >
            {getTrangThaiKhoaDaoTaoLabel(item.trang_thai, t)}
          </span>
        );
      case 'giang_vien':
        return (
          <span className="text-sm text-foreground truncate block max-w-[180px]">
            {item.giang_vien ?? '—'}
          </span>
        );
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDateTimeShort(item.tg_tao)}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '—'}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('common.edit')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                aria-label={t('common.edit')}
              >
                <Edit size={16} />
              </button>
            </Tooltip>
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

  const renderMobileCard = (item: KhoaDaoTao, isSelected: boolean) => (
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
              {item.ten}
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
            <span className="text-xs text-muted-foreground font-mono">{item.ma}</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getLoaiKhoaHocBadgeClass(item.id_loai_khoa_hoc)}`}
            >
              {item.ten_loai_khoa_hoc ?? '—'}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getTrangThaiKhoaDaoTaoBadgeClass(item.trang_thai)}`}
            >
              {getTrangThaiKhoaDaoTaoLabel(item.trang_thai, t)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {item.thoi_luong} {t('khoaDaoTao.gio')}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{t('khoaDaoTao.detail.soChuong')}: {item.so_chuong ?? 0}</span>
            <span>{t('khoaDaoTao.detail.soBaiHoc')}: {item.so_bai_hoc ?? 0}</span>
            <span>{t('khoaDaoTao.detail.soBaiTest')}: {item.so_bai_test ?? 0}</span>
            <span>
              {(item.id_chuc_vu_xem?.length ?? 0) > 0
                ? t('khoaDaoTao.table.phanQuyenCount', { count: item.id_chuc_vu_xem!.length })
                : t('khoaDaoTao.detail.phanQuyenEmpty')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1.5 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all"
          aria-label={t('common.edit')}
        >
          <Edit size={14} />
        </button>
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
      columns={columns}
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
      emptyTitle={t('khoaDaoTao.emptyTitle')}
      emptyDescription={t('khoaDaoTao.emptyDescription')}
    />
  );
};

export default DanhSachTable;
