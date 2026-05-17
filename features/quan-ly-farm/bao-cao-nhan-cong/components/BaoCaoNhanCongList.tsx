import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  sumSlCongNgay,
  sumSlCongNua,
  sumSlTangCa,
  sumSoGioTc,
  sumTongCongQuyDoiPhieu,
  sumTongGioTangCaTichPhieu,
} from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: FarmBaoCaoNhanCong[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: FarmBaoCaoNhanCong) => void;
  onDelete?: (id: string) => void;
  onView?: (item: FarmBaoCaoNhanCong) => void;
  /** Khi trả về false, ẩn nút sửa trên dòng đó (vẫn có thể xem chi tiết). */
  canEditRow?: (item: FarmBaoCaoNhanCong) => boolean;
  canDeleteRow?: (item: FarmBaoCaoNhanCong) => boolean;
}

const BaoCaoNhanCongList: React.FC<Props> = ({
  data,
  columns,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
  canEditRow,
  canDeleteRow,
}) => {
  const { t } = useTranslation();

  const allowEdit = (item: FarmBaoCaoNhanCong) => canEditRow?.(item) ?? true;
  const allowDelete = (item: FarmBaoCaoNhanCong) => canDeleteRow?.(item) ?? true;

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderCell = (colId: string, item: FarmBaoCaoNhanCong) => {
    switch (colId) {
      case 'ngay':
        return <span className="text-sm font-medium tabular-nums">{formatDateShort(item.ngay)}</span>;
      case 'ten_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{item.ten_chi_nhanh ?? '—'}</span>;
      case 'trang_thai': {
        const locked = item.trang_thai === 'khoa';
        return (
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
              locked
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100'
                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
            )}
          >
            {locked ? t('baoCaoNhanCong.trangThai.khoa') : t('baoCaoNhanCong.trangThai.mo')}
          </span>
        );
      }
      case 'hinh_anh': {
        const urls = item.hinh_anh_urls ?? [];
        const n = urls.length;
        const first = urls[0];
        if (!first) {
          return <span className="text-xs text-muted-foreground tabular-nums">—</span>;
        }
        return (
          <div
            className="flex items-center justify-center"
            title={t('baoCaoNhanCong.list.photoCountTooltip', { count: n })}
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted/50">
              <img src={first} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              {n > 1 ? (
                <span className="absolute bottom-0 right-0 rounded-tl bg-black/65 px-[3px] py-px text-[9px] font-semibold leading-none text-white tabular-nums">
                  {n}
                </span>
              ) : null}
            </div>
          </div>
        );
      }
      case 'tong_cong_ngay':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSlCongNgay(item))}</span>;
      case 'tong_cong_nua':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSlCongNua(item))}</span>;
      case 'tong_cong_quy_doi':
        return (
          <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(sumTongCongQuyDoiPhieu(item))}</span>
        );
      case 'tong_tang_ca':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSlTangCa(item))}</span>;
      case 'tong_gio_tc':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSoGioTc(item))}</span>;
      case 'tong_gio_tang_ca_tich':
        return (
          <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(sumTongGioTangCaTichPhieu(item))}</span>
        );
      case 'ghi_chu':
        return (
          <div
            className="text-sm text-muted-foreground max-h-28 max-w-[320px] overflow-y-auto whitespace-pre-wrap leading-snug"
            title={item.ghi_chu ?? undefined}
          >
            {item.ghi_chu?.trim() ? item.ghi_chu : '—'}
          </div>
        );
      case 'ten_nguoi_tao':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]" title={item.ten_nguoi_tao ?? ''}>
            {item.ten_nguoi_tao?.trim() ? item.ten_nguoi_tao : '—'}
          </span>
        );
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap" title={item.tg_tao}>
            {formatDateTimeShort(item.tg_tao)}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap" title={item.tg_cap_nhat}>
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && allowEdit(item) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                title={t('common.edit')}
                aria-label={t('common.edit')}
              >
                <Edit size={14} />
              </button>
            )}
            {onDelete && allowDelete(item) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                title={t('common.delete')}
                aria-label={t('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: FarmBaoCaoNhanCong, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
      className={cn(
        'bg-card rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98]',
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      )}
    >
      <div className="text-sm font-semibold tabular-nums mb-1">{formatDateShort(item.ngay)}</div>
      <div className="text-sm text-foreground mb-1">{item.ten_chi_nhanh ?? '—'}</div>
      <div className="text-xs text-muted-foreground mb-1">
        {t('baoCaoNhanCong.store.colTrangThai')}:{' '}
        {item.trang_thai === 'khoa' ? t('baoCaoNhanCong.trangThai.khoa') : t('baoCaoNhanCong.trangThai.mo')}
      </div>
      {(item.hinh_anh_urls?.length ?? 0) > 0 && (
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-muted-foreground shrink-0">{t('baoCaoNhanCong.store.colHinhAnh')}:</span>
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded border border-border bg-muted/50">
            <img
              src={item.hinh_anh_urls[0]}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            {(item.hinh_anh_urls?.length ?? 0) > 1 ? (
              <span className="absolute bottom-0 right-0 rounded-tl bg-black/65 px-[2px] py-px text-[8px] font-semibold leading-none text-white tabular-nums">
                {item.hinh_anh_urls.length}
              </span>
            ) : null}
          </div>
        </div>
      )}
      <div className="text-xs text-muted-foreground mb-1">
        {t('baoCaoNhanCong.store.colTongCongNgay')}: {formatNumberVN(sumSlCongNgay(item))}
      </div>
      <div className="text-xs text-muted-foreground mb-1">
        {t('baoCaoNhanCong.store.colTongCongQuyDoi')}:{' '}
        <span className="font-semibold text-primary tabular-nums">{formatNumberVN(sumTongCongQuyDoiPhieu(item))}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-1">
        {t('baoCaoNhanCong.store.colTongCongNua')}: {formatNumberVN(sumSlCongNua(item))} ·{' '}
        {t('baoCaoNhanCong.store.colTongTangCa')}: {formatNumberVN(sumSlTangCa(item))} ·{' '}
        {t('baoCaoNhanCong.store.colGioTangCa')}: {formatNumberVN(sumSoGioTc(item))} ·{' '}
        {t('baoCaoNhanCong.store.colTongGioTangCa')}:{' '}
        <span className="font-semibold text-primary tabular-nums">{formatNumberVN(sumTongGioTangCaTichPhieu(item))}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-1">
        {t('baoCaoNhanCong.store.colTgTao')}: {formatDateTimeShort(item.tg_tao)}
      </div>
      <div className="text-xs text-muted-foreground mb-1">
        {t('baoCaoNhanCong.store.colUpdated')}: {formatDateTimeShort(item.tg_cap_nhat)}
      </div>
      {(item.ten_nguoi_tao?.trim() ?? '') !== '' && (
        <div className="text-xs text-muted-foreground mb-1">
          {t('baoCaoNhanCong.store.colNguoiTao')}: {item.ten_nguoi_tao}
        </div>
      )}
      <div className="flex justify-end gap-1 pt-2 border-t border-border mt-2">
        {onEdit && allowEdit(item) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg"
            aria-label={t('common.edit')}
          >
            <Edit size={14} />
          </button>
        )}
        {onDelete && allowDelete(item) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <GenericTable<FarmBaoCaoNhanCong>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('baoCaoNhanCong.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('baoCaoNhanCong.empty')}
      emptyDescription={t('baoCaoNhanCong.emptyHint')}
    />
  );
};

export default BaoCaoNhanCongList;
