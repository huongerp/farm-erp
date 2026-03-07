import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FolderOpen, Pin, PinOff } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import type { HoSo } from '../core/types';
import { useHoSoStore } from '../store/useHoSoStore';

interface Props {
  data: HoSo[];
  isLoading: boolean;
  pinnedIds: Set<string>;
  onEdit: (item: HoSo) => void;
  onDelete: (id: string) => void;
  onView?: (item: HoSo) => void;
  onTogglePin: (id: string) => void;
}

const HoSoTable: React.FC<Props> = ({ data, isLoading, pinnedIds, onEdit, onDelete, onView, onTogglePin }) => {
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
  } = useHoSoStore();

  const renderStatusBadge = (status: number) =>
    status === 1 ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {t('common.activeStatus')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {t('common.inactiveStatus')}
      </span>
    );

  const renderCell = (colId: string, item: HoSo) => {
    switch (colId) {
      case 'ma_ho_so':
        return (
          <span className="font-mono text-sm font-medium text-foreground">{item.ma_ho_so}</span>
        );
      case 'ten_ho_so':
        return (
          <span className="text-sm text-foreground font-medium">{item.ten_ho_so}</span>
        );
      case 'ten_tai_lieu':
        return (
          <span className="text-sm text-foreground">{item.ten_tai_lieu || '—'}</span>
        );
      case 'ten_phong_ban':
        return (
          <span className="text-sm text-foreground">{item.ten_phong_ban || '—'}</span>
        );
      case 'thoi_han_luu_tru':
        return (
          <span className="text-sm text-muted-foreground">
            {item.thoi_han_luu_tru ? formatDate(item.thoi_han_luu_tru) : '—'}
          </span>
        );
      case 'trang_thai':
        return renderStatusBadge(item.trang_thai);
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions': {
        const isPinned = pinnedIds.has(item.id);
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={isPinned ? t('hoSo.unpin') : t('hoSo.pin')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(item.id);
                }}
                className={`p-2 rounded-lg transition-all ${isPinned ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'text-muted-foreground hover:bg-muted'}`}
                aria-label={isPinned ? t('hoSo.unpin') : t('hoSo.pin')}
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
      }
      default:
        return null;
    }
  };

  const renderMobileCard = (item: HoSo, isSelected: boolean) => (
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
          <FolderOpen size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_ho_so}</h4>
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
            <span className="text-xs font-mono text-muted-foreground">{item.ma_ho_so}</span>
            {renderStatusBadge(item.trang_thai)}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">
          {item.thoi_han_luu_tru ? formatDate(item.thoi_han_luu_tru) : '—'}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onTogglePin(item.id); }}
            className={`p-2 rounded-lg transition-all ${pinnedIds.has(item.id) ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-muted-foreground bg-muted/50 hover:bg-muted'}`}
            aria-label={pinnedIds.has(item.id) ? t('hoSo.unpin') : t('hoSo.pin')}
          >
            {pinnedIds.has(item.id) ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
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
            className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-lg transition-all"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
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
      onRowClick={onView ? (item) => onView(item) : undefined}
      emptyTitle={t('hoSo.empty')}
      emptyDescription={t('hoSo.emptyHint')}
    />
  );
};

export default HoSoTable;
