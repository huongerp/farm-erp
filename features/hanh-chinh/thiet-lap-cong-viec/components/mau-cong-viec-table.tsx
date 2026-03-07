import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FileText } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import type { MauCongViec } from '../core/types';
import { useMauCongViecStore } from '../store/useMauCongViecStore';
import { getUuTienLabel } from '../core/constants';

interface Props {
  data: MauCongViec[];
  isLoading: boolean;
  onEdit: (item: MauCongViec) => void;
  onDelete: (id: string) => void;
  onView?: (item: MauCongViec) => void;
}

const MauCongViecTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onView }) => {
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
  } = useMauCongViecStore();

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

  const renderUuTienBadge = (uuTien: 'cao' | 'trung_binh' | 'thap') => {
    const label = getUuTienLabel(uuTien, t);
    const cls =
      uuTien === 'cao'
        ? 'bg-rose-50 text-rose-700 border-rose-100'
        : uuTien === 'trung_binh'
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
        {label}
      </span>
    );
  };

  const renderCell = (colId: string, item: MauCongViec) => {
    switch (colId) {
      case 'ten_mau':
        return (
          <span className="font-medium text-foreground">
            {item.ten_mau}
          </span>
        );
      case 'tieu_de_mac_dinh':
        return (
          <span className="text-sm text-foreground line-clamp-2 max-w-[240px]">
            {item.tieu_de_mac_dinh || '—'}
          </span>
        );
      case 'uu_tien_mac_dinh':
        return renderUuTienBadge(item.uu_tien_mac_dinh);
      case 'trang_thai_mac_dinh':
        return renderStatusBadge(item.trang_thai_mac_dinh);
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
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

  const renderMobileCard = (item: MauCongViec, isSelected: boolean) => (
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
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_mau}</h4>
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
            {renderUuTienBadge(item.uu_tien_mac_dinh)}
            {renderStatusBadge(item.trang_thai_mac_dinh)}
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.tieu_de_mac_dinh || '—'}</div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">{formatDateTimeShort(item.tg_cap_nhat)}</span>
        <div className="flex gap-1.5">
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
      loadingText={t('thietLapCongViec.mau.loading')}
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
      emptyTitle={t('thietLapCongViec.mau.empty')}
      emptyDescription={t('thietLapCongViec.mau.emptyHint')}
    />
  );
};

export default MauCongViecTable;
