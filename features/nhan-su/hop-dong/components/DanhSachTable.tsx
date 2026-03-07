import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit, Printer, FileSignature, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import {
  getLoaiHopDongLabel,
  getLoaiHopDongBadgeClass,
  getTrangThaiHopDongLabel,
  getTrangThaiHopDongBadgeClass,
  getDaysUntilEnd,
} from '../core/constants';
import { useHopDongStore } from '../store/useHopDongStore';
import type { HopDong } from '../core/types';

const PREVIEW_BASE = '/nhan-su/hop-dong/preview';

interface Props {
  data: HopDong[];
  isLoading: boolean;
  onView: (item: HopDong) => void;
  onEdit: (item: HopDong) => void;
  onPrint: (item: HopDong) => void;
  onDelete: (id: string) => void;
}

const DanhSachTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onPrint, onDelete }) => {
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
  } = useHopDongStore();

  const renderCell = (colId: string, item: HopDong) => {
    switch (colId) {
      case 'ten_ung_vien':
        return (
          <span
            className="font-medium text-sm text-foreground block min-w-0 truncate"
            title={item.ten_ung_vien ?? undefined}
          >
            {item.ten_ung_vien ?? '—'}
          </span>
        );
      case 'loai_hop_dong':
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getLoaiHopDongBadgeClass(item.loai_hop_dong)}`}
          >
            {getLoaiHopDongLabel(item.loai_hop_dong, t)}
          </span>
        );
      case 'so_hop_dong':
        return (
          <span className="text-sm text-foreground font-mono tabular-nums">
            {item.so_hop_dong}
          </span>
        );
      case 'ngay_bat_dau':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDate(item.ngay_bat_dau)}
          </span>
        );
      case 'ngay_ket_thuc': {
        const days = item.loai_hop_dong === 'thu-viec' ? getDaysUntilEnd(item.ngay_ket_thuc) : null;
        const expiringSoon = days != null && days >= 0 && days <= 7;
        return (
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {item.ngay_ket_thuc ? formatDate(item.ngay_ket_thuc) : '—'}
            </span>
            {expiringSoon && (
              <span className="inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {t('hopDong.sapHetHan')}
              </span>
            )}
          </div>
        );
      }
      case 'ngay_vao_lam':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {item.ngay_vao_lam ? formatDate(item.ngay_vao_lam) : '—'}
          </span>
        );
      case 'trang_thai':
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getTrangThaiHopDongBadgeClass(item.trang_thai)}`}
          >
            {getTrangThaiHopDongLabel(item.trang_thai, t)}
          </span>
        );
      case 'muc_luong':
        return (
          <span className="text-sm text-foreground tabular-nums whitespace-nowrap">
            {item.muc_luong != null && item.muc_luong !== '' ? item.muc_luong : '—'}
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
            <Tooltip content={t('common.view')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(item);
                }}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-all"
                aria-label={t('common.view')}
              >
                <Eye size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('hopDong.edit')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                aria-label={t('hopDong.edit')}
              >
                <Edit size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('hopDong.detail.toolbar.print')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint(item);
                }}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-all"
                aria-label={t('hopDong.detail.toolbar.print')}
              >
                <Printer size={16} />
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

  const renderMobileCard = (item: HopDong, isSelected: boolean) => (
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
          <FileSignature size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {item.ten_ung_vien ?? '—'}
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
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getLoaiHopDongBadgeClass(item.loai_hop_dong)}`}
            >
              {getLoaiHopDongLabel(item.loai_hop_dong, t)}
            </span>
            {item.loai_hop_dong === 'thu-viec' && (() => {
              const days = getDaysUntilEnd(item.ngay_ket_thuc);
              if (days != null && days >= 0 && days <= 7) {
                return (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {t('hopDong.sapHetHan')}
                  </span>
                );
              }
              return null;
            })()}
            <span className="text-xs text-muted-foreground">{item.so_hop_dong}</span>
            {item.ngay_vao_lam && (
              <span className="text-xs text-muted-foreground">{formatDate(item.ngay_vao_lam)}</span>
            )}
            {item.muc_luong != null && item.muc_luong !== '' && (
              <span className="text-xs text-muted-foreground tabular-nums">{item.muc_luong}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDateTimeShort(item.tg_tao)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1.5 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView(item);
          }}
          className="p-2 text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-all"
          aria-label={t('common.view')}
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all"
          aria-label={t('hopDong.edit')}
        >
          <Edit size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrint(item);
          }}
          className="p-2 text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-all"
          aria-label={t('hopDong.detail.toolbar.print')}
        >
          <Printer size={14} />
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
      emptyTitle={t('hopDong.emptyTitle')}
      emptyDescription={t('hopDong.emptyDescription')}
    />
  );
};

export default DanhSachTable;
