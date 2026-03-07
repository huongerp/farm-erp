import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Pin, PinOff, FileText } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import type { TaiLieu } from '../core/types';
import { useTaiLieuStore } from '../store/useTaiLieuStore';
import { getHuongLabel } from '../core/constants';
import { TRANG_THAI_MAU_DEFAULT } from '../../thiet-lap-tai-lieu/core/constants';

interface Props {
  data: TaiLieu[];
  isLoading: boolean;
  pinnedIds: Set<string>;
  onEdit: (item: TaiLieu) => void;
  onDelete: (id: string) => void;
  onView?: (item: TaiLieu) => void;
  onTogglePin: (id: string) => void;
}

const TaiLieuTable: React.FC<Props> = ({ data, isLoading, pinnedIds, onEdit, onDelete, onView, onTogglePin }) => {
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
  } = useTaiLieuStore();

  const renderCell = (colId: string, item: TaiLieu) => {
    switch (colId) {
      case 'ma_so':
        return (
          <span className="text-sm font-mono text-foreground">{item.ma_so || '—'}</span>
        );
      case 'trich_yeu':
        return (
          <span className="text-sm font-medium text-foreground line-clamp-2">{item.trich_yeu}</span>
        );
      case 'huong': {
        const huongCls =
          item.huong === 'noi_bo'
            ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700'
            : item.huong === 'den'
              ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
              : 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${huongCls}`}>
            {getHuongLabel(item.huong, t)}
          </span>
        );
      }
      case 'ten_loai':
        return <span className="text-sm text-foreground">{item.ten_loai || item.ma_loai || '—'}</span>;
      case 'ten_nhom_tai_lieu':
        return <span className="text-sm text-foreground">{item.ten_nhom_tai_lieu || '—'}</span>;
      case 'ten_trang_thai': {
        const mau = item.mau_trang_thai || TRANG_THAI_MAU_DEFAULT;
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-border"
            style={{ backgroundColor: `${mau}20`, color: mau, borderColor: `${mau}40` }}
          >
            {item.ten_trang_thai || '—'}
          </span>
        );
      }
      case 'ten_phong_ban':
        return <span className="text-sm text-foreground">{item.ten_phong_ban || '—'}</span>;
      case 'phan_quyen': {
        const count = item.id_chuc_vu_xem?.length ?? 0;
        return count === 0 ? (
          <span className="text-xs text-muted-foreground">{t('taiLieu.phanQuyenEmpty')}</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {t('taiLieu.phanQuyenCount', { count })}
          </span>
        );
      }
      case 'so_den':
        return <span className="text-sm font-mono">{item.so_den || '—'}</span>;
      case 'so_di':
        return <span className="text-sm font-mono">{item.so_di || '—'}</span>;
      case 'ngay_den':
        return (
          <span className="text-sm text-muted-foreground">
            {item.ngay_den ? formatDate(item.ngay_den) : '—'}
          </span>
        );
      case 'ngay_ky':
        return (
          <span className="text-sm text-muted-foreground">
            {item.ngay_ky ? formatDate(item.ngay_ky) : '—'}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        const isPinned = pinnedIds.has(item.id);
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={isPinned ? t('taiLieu.unpin') : t('taiLieu.pin')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(item.id);
                }}
                className={`p-2 rounded-lg transition-all ${isPinned ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'text-muted-foreground hover:bg-muted'}`}
                aria-label={isPinned ? t('taiLieu.unpin') : t('taiLieu.pin')}
              >
                {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
            </Tooltip>
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

  const renderMobileCard = (item: TaiLieu, isSelected: boolean) => {
    const isPinned = pinnedIds.has(item.id);
    return (
      <div className="bg-card rounded-xl border border-border p-3.5 shadow-sm transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-foreground text-sm line-clamp-2">{item.trich_yeu}</h4>
              <div className="shrink-0">
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
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                  item.huong === 'noi_bo'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : item.huong === 'den'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-violet-50 text-violet-700 border-violet-100'
                }`}
              >
                {getHuongLabel(item.huong, t)}
              </span>
              {item.ten_trang_thai && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: `${item.mau_trang_thai || '#6366f1'}20`,
                    color: item.mau_trang_thai || '#6366f1',
                    borderColor: `${item.mau_trang_thai || '#6366f1'}40`,
                  }}
                >
                  {item.ten_trang_thai}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{item.ten_loai || item.ma_loai || '—'}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2.5 border-t border-border gap-2">
          <span className="text-muted-foreground text-xs flex items-center gap-1.5 flex-wrap">
            {item.ten_trang_thai && (
              <span
                className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${item.mau_trang_thai || '#6366f1'}20`,
                  color: item.mau_trang_thai || '#6366f1',
                  borderColor: `${item.mau_trang_thai || '#6366f1'}40`,
                }}
              >
                {item.ten_trang_thai}
              </span>
            )}
            {item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '—'}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onTogglePin(item.id)}
              className={`p-2 rounded-lg transition-all ${isPinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-muted-foreground bg-muted/50 hover:bg-muted'}`}
              aria-label={isPinned ? t('taiLieu.unpin') : t('taiLieu.pin')}
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button type="button" onClick={() => onEdit(item)} className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg" aria-label={t('common.edit')}>
              <Edit size={14} />
            </button>
            <button type="button" onClick={() => onDelete(item.id)} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-lg" aria-label={t('common.delete')}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      onRowClick={onView}
      keyExtractor={(item) => item.id}
    />
  );
};

export default TaiLieuTable;
