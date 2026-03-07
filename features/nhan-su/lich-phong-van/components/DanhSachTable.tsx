import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Calendar, Video } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getTrangThaiLichPVLabel, getHinhThucLabel, HINH_THUC_BADGE_CLASS, getKetQuaBadgeClass, getTrangThaiDanhGiaLabel, TRANG_THAI_DANH_GIA_BADGE_CLASS } from '../core/constants';
import type { LichPhongVan } from '../core/types';
import { useLichPhongVanStore } from '../store/useLichPhongVanStore';

const TRANG_THAI_VARIANT: Record<number, string> = {
  0: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  1: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  2: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  3: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

interface Props {
  data: LichPhongVan[];
  isLoading: boolean;
  onEdit: (item: LichPhongVan) => void;
  onDelete: (id: string) => void;
  onView?: (item: LichPhongVan) => void;
}

const DanhSachTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onView }) => {
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
  } = useLichPhongVanStore();

  const renderStatusBadge = (trangThai: number) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${TRANG_THAI_VARIANT[trangThai] ?? TRANG_THAI_VARIANT[0]}`}
    >
      {getTrangThaiLichPVLabel(trangThai, t)}
    </span>
  );

  const renderCell = (colId: string, item: LichPhongVan) => {
    switch (colId) {
      case 'ten_ung_vien':
        return (
          <span className="font-medium text-sm text-foreground block min-w-0 truncate" title={item.ten_ung_vien ?? undefined}>
            {item.ten_ung_vien ?? '—'}
          </span>
        );
      case 'so_vong':
        return (
          <span className="text-sm tabular-nums text-foreground whitespace-nowrap">{item.so_vong}</span>
        );
      case 'ngay':
        return (
          <span className="text-sm text-foreground tabular-nums whitespace-nowrap">{item.ngay}</span>
        );
      case 'gio':
        return (
          <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{item.gio}</span>
        );
      case 'hinh_thuc':
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${HINH_THUC_BADGE_CLASS[item.hinh_thuc] ?? HINH_THUC_BADGE_CLASS.offline}`}
          >
            {getHinhThucLabel(item.hinh_thuc, t)}
          </span>
        );
      case 'dia_diem':
        return (
          <span className="text-sm text-foreground line-clamp-2 min-w-0 block break-words" title={item.dia_diem || undefined}>
            {item.dia_diem || '—'}
          </span>
        );
      case 'trang_thai':
        return renderStatusBadge(item.trang_thai);
      case 'trang_thai_danh_gia': {
        const v = item.trang_thai_danh_gia ?? 0;
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${TRANG_THAI_DANH_GIA_BADGE_CLASS[v] ?? TRANG_THAI_DANH_GIA_BADGE_CLASS[0]}`}
          >
            {getTrangThaiDanhGiaLabel(v, t)}
          </span>
        );
      }
      case 'ket_qua':
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap max-w-full min-w-0 truncate ${getKetQuaBadgeClass(item.ket_qua)}`}
            title={item.ket_qua ?? undefined}
          >
            {item.ket_qua || '—'}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('common.edit')} placement="left">
              <button
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

  const renderMobileCard = (item: LichPhongVan, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Calendar size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {item.ten_ung_vien ?? '—'} · {t('lichPhongVan.store.soVongCol')} {item.so_vong}
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
            <span className="text-xs text-muted-foreground">{item.ngay} {item.gio}</span>
            {renderStatusBadge(item.trang_thai)}
          </div>
        </div>
      </div>
      <div className="text-body-sm text-muted-foreground mb-3 flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${HINH_THUC_BADGE_CLASS[item.hinh_thuc] ?? HINH_THUC_BADGE_CLASS.offline}`}
          >
            {getHinhThucLabel(item.hinh_thuc, t)}
          </span>
          <span>{item.dia_diem || '—'}</span>
        </div>
      <div className="flex justify-end gap-1.5 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all"
          aria-label={t('common.edit')}
        >
          <Edit size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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
      onRowClick={(item) => onView?.(item)}
    />
  );
};

export default DanhSachTable;
