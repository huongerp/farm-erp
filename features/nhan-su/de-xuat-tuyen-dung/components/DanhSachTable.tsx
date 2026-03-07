import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Briefcase, ExternalLink } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import type { DeXuatTuyenDungWithCounts } from '../core/types';
import { useDeXuatTuyenDungStore } from '../store/useDeXuatTuyenDungStore';

const STATUS_KEYS: Record<number, string> = {
  0: 'deXuatTuyenDung.status.nhap',
  1: 'deXuatTuyenDung.status.choDuyet',
  2: 'deXuatTuyenDung.status.daDuyet',
  3: 'deXuatTuyenDung.status.tuChoi',
};

interface Props {
  data: DeXuatTuyenDungWithCounts[];
  isLoading: boolean;
  onEdit: (item: DeXuatTuyenDungWithCounts) => void;
  onDelete: (id: string) => void;
  onView?: (item: DeXuatTuyenDungWithCounts) => void;
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
  } = useDeXuatTuyenDungStore();

  const renderStatusBadge = (status: number) => {
    const key = STATUS_KEYS[status] ?? 'deXuatTuyenDung.status.nhap';
    const variant =
      status === 2
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        : status === 3
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          : status === 1
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            : 'bg-muted text-muted-foreground border-border';
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variant}`}
      >
        {t(key)}
      </span>
    );
  };

  const renderCell = (colId: string, item: DeXuatTuyenDungWithCounts) => {
    switch (colId) {
      case 'ma_de_xuat':
        return (
          <span className="font-mono text-sm font-medium text-foreground">{item.ma_de_xuat}</span>
        );
      case 'ten_chuc_vu':
        return (
          <span className="text-sm text-foreground">
            {item.ten_chuc_vu ?? '—'}
            {item.ten_phong_ban ? (
              <span className="text-muted-foreground text-xs block">{item.ten_phong_ban}</span>
            ) : null}
          </span>
        );
      case 'tieu_de':
        return (
          <span className="text-sm text-foreground line-clamp-2 max-w-[280px]">
            {item.tieu_de || '—'}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[280px]">
            {item.mo_ta || '—'}
          </span>
        );
      case 'so_luong':
        return (
          <span className="text-sm font-medium tabular-nums text-foreground">{item.so_luong}</span>
        );
      case 'so_luong_onboard':
        return (
          <span className="text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
            {item.so_luong_onboard ?? 0}
          </span>
        );
      case 'so_luong_da_nghi':
        return (
          <span className="text-sm font-medium tabular-nums text-amber-600 dark:text-amber-400">
            {item.so_luong_da_nghi ?? 0}
          </span>
        );
      case 'so_luong_con_lai':
        return (
          <span className="text-sm font-medium tabular-nums text-foreground">
            {item.so_luong_con_lai ?? 0}
          </span>
        );
      case 'link_tuyen':
        if (!item.link_tuyen?.trim()) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <a
            href={item.link_tuyen}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
            {t('deXuatTuyenDung.viewLink')}
          </a>
        );
      case 'trang_thai':
        return renderStatusBadge(item.trang_thai);
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_tao)}
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

  const renderMobileCard = (item: DeXuatTuyenDung, isSelected: boolean) => (
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
          <Briefcase size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {item.ma_de_xuat}
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
            <span className="text-xs text-muted-foreground">{item.ten_chuc_vu ?? '—'}</span>
            {renderStatusBadge(item.trang_thai)}
          </div>
        </div>
      </div>
      {(item.tieu_de || item.mo_ta) && (
        <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
          {item.tieu_de && (
            <>
              <p className="text-muted-foreground mb-0.5">{t('deXuatTuyenDung.store.tieuDeCol')}</p>
              <p className="font-medium text-foreground line-clamp-2">{item.tieu_de}</p>
            </>
          )}
          {item.mo_ta && (
            <>
              <p className="text-muted-foreground mb-0.5">{t('deXuatTuyenDung.store.moTaCol')}</p>
              <p className="text-foreground line-clamp-2">{item.mo_ta}</p>
            </>
          )}
        </div>
      )}
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">
          {t('deXuatTuyenDung.store.soLuongCol')}: {item.so_luong} · {t('deXuatTuyenDung.store.soLuongOnboardCol')}: {item.so_luong_onboard ?? 0} · {t('deXuatTuyenDung.store.soLuongDaNghiCol')}: {item.so_luong_da_nghi ?? 0} · {t('deXuatTuyenDung.store.soLuongConLaiCol')}: {item.so_luong_con_lai ?? 0} · {formatDateTimeShort(item.tg_tao)}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
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
            className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
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
      onRowClick={(item) => onView?.(item)}
    />
  );
};

export default DanhSachTable;
