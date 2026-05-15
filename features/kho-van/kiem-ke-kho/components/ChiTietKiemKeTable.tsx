import React from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, Trash2, Package, ExternalLink, RefreshCw } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { cn } from '../../../../lib/utils';
import { getKetQuaLabel } from '../core/constants';
import { useChiTietKiemKeStore } from '../store/useChiTietKiemKeStore';
import type { ChiTietKiemKeKho } from '../core/types';

const getPhieuKhoDieuChinhPreviewUrl = (idPhieu: string) =>
  `/mua-hang/phieu-kho/preview/${encodeURIComponent(idPhieu)}`;

interface Props {
  data: ChiTietKiemKeKho[];
  isLoading: boolean;
  showActions?: boolean;
  isDangKiemKe?: boolean;
  onNhapKetQua?: (item: ChiTietKiemKeKho) => void;
  onDieuChinh?: (id: string) => void;
  onDelete?: (item: ChiTietKiemKeKho) => void;
  dieuChinhLoading?: boolean;
  nhapKetQuaLoading?: boolean;
  deleteLoading?: boolean;
}

const ChiTietKiemKeTable: React.FC<Props> = ({
  data,
  isLoading,
  showActions = false,
  isDangKiemKe = false,
  onNhapKetQua,
  onDieuChinh,
  onDelete,
  dieuChinhLoading,
  nhapKetQuaLoading,
  deleteLoading,
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
  } = useChiTietKiemKeStore();

  const rowCanDieuChinh = (item: ChiTietKiemKeKho) =>
    Boolean(
      isDangKiemKe &&
        onDieuChinh &&
        showActions &&
        !item.id_phieu_kho_dieu_chinh &&
        item.so_luong_thuc_te != null &&
        item.so_luong_thuc_te !== item.so_luong_so
    );

  const renderKetQuaBadge = (ket_qua: string) => {
    const cls = cn(
      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
      ket_qua === 'khop' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      ket_qua === 'thieu' && 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      ket_qua === 'thua' && 'bg-violet-500/10 text-violet-700 border-violet-500/20',
      ket_qua === 'chua_kiem' && 'bg-muted text-muted-foreground border-border'
    );
    return <span className={cls}>{getKetQuaLabel(ket_qua as any, t)}</span>;
  };

  const renderCell = (colId: string, item: ChiTietKiemKeKho) => {
    switch (colId) {
      case 'ten_kho':
        return <span className="font-medium text-sm">{item.ten_kho || item.ma_kho || '—'}</span>;
      case 'ten_hang':
        return (
          <div className="min-w-0 break-words">
            <span className="font-medium text-sm">{item.ten_hang || item.ma_hang || '—'}</span>
            {item.ma_hang && (
              <span className="text-xs text-muted-foreground block">{item.ma_hang}</span>
            )}
          </div>
        );
      case 'so_luong_so':
        return <span className="text-sm tabular-nums">{item.so_luong_so}</span>;
      case 'so_luong_thuc_te':
        return (
          <span className="text-sm tabular-nums">
            {item.so_luong_thuc_te != null ? item.so_luong_thuc_te : '—'}
          </span>
        );
      case 'ket_qua':
        return renderKetQuaBadge(item.ket_qua);
      case 'dieu_chinh_ton': {
        if (item.id_phieu_kho_dieu_chinh) {
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {t('kiemKeKho.dieuChinhStatus.done')}
              </span>
              <Tooltip content={t('kiemKeKho.table.xemPhieuDieuChinh')} placement="top">
                <a
                  href={getPhieuKhoDieuChinhPreviewUrl(item.id_phieu_kho_dieu_chinh)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-primary hover:bg-primary/10 rounded-md inline-flex"
                  aria-label={t('kiemKeKho.table.xemPhieuDieuChinh')}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                </a>
              </Tooltip>
            </div>
          );
        }
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('kiemKeKho.dieuChinhStatus.pending')}
          </span>
        );
      }
      case 'so_luong_dieu_chinh':
        return (
          <span className="text-sm tabular-nums">
            {item.so_luong_dieu_chinh != null ? item.so_luong_dieu_chinh : '—'}
          </span>
        );
      case 'don_vi_tinh':
        return <span className="text-sm text-muted-foreground">{item.don_vi_tinh || '—'}</span>;
      case 'ghi_chu_dong':
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
            {item.ghi_chu_dong || '—'}
          </span>
        );
      case 'actions':
        if (!showActions) return null;
        return (
          <div className="flex items-center justify-center gap-0.5">
            {rowCanDieuChinh(item) && onDieuChinh && (
              <Tooltip content={t('kiemKeKho.dieuChinhTonTheoKetQua')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDieuChinh(item.id);
                  }}
                  disabled={dieuChinhLoading}
                  className="p-1.5 text-secondary-foreground hover:bg-muted rounded-md transition-all"
                  aria-label={t('kiemKeKho.dieuChinhTonTheoKetQua')}
                >
                  <RefreshCw size={15} />
                </button>
              </Tooltip>
            )}
            {isDangKiemKe && onNhapKetQua && (
              <Tooltip content={t('kiemKeKho.table.nhapKetQua')} placement="left">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onNhapKetQua(item); }}
                  disabled={nhapKetQuaLoading}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                  aria-label={t('kiemKeKho.table.nhapKetQua')}
                >
                  <PenLine size={15} />
                </button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip content={t('kiemKeKho.table.xoaDong')} placement="left">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                  disabled={deleteLoading}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                  aria-label={t('kiemKeKho.table.xoaDong')}
                >
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return (
          <span className="text-sm">{String((item as unknown as Record<string, unknown>)[colId] ?? '—')}</span>
        );
    }
  };

  const renderMobileCard = (item: ChiTietKiemKeKho, isSelected: boolean) => (
    <div className={cn('p-3', isSelected && 'border-primary bg-primary/5')}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.ten_hang || item.ma_hang || '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{item.ten_kho || item.ma_kho}</p>
          </div>
        </div>
        {renderKetQuaBadge(item.ket_qua)}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground mt-1.5">
        <span>{t('kiemKeKho.store.soLuongSoCol')}: <strong className="text-foreground">{item.so_luong_so}</strong></span>
        <span>
          {t('kiemKeKho.store.soLuongThucTeCol')}:{' '}
          <strong className="text-foreground">{item.so_luong_thuc_te != null ? item.so_luong_thuc_te : '—'}</strong>
        </span>
        {item.so_luong_dieu_chinh != null && (
          <span>
            {t('kiemKeKho.store.soLuongDieuChinhCol')}:{' '}
            <strong className="text-foreground">{item.so_luong_dieu_chinh}</strong>
          </span>
        )}
        {item.don_vi_tinh && <span>{item.don_vi_tinh}</span>}
      </div>
      {showActions && (
        <div className="flex gap-1.5 mt-2 pt-2 border-t border-border justify-end">
          {rowCanDieuChinh(item) && onDieuChinh && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDieuChinh(item.id);
              }}
              disabled={dieuChinhLoading}
              className="p-1.5 text-secondary-foreground bg-muted hover:bg-muted/80 rounded-md"
              aria-label={t('kiemKeKho.dieuChinhTonTheoKetQua')}
            >
              <RefreshCw size={14} />
            </button>
          )}
          {isDangKiemKe && onNhapKetQua && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNhapKetQua(item);
              }}
              className="p-1.5 text-primary bg-primary/5 hover:bg-primary/10 rounded-md"
              aria-label={t('kiemKeKho.table.nhapKetQua')}
            >
              <PenLine size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-md"
              aria-label={t('kiemKeKho.table.xoaDong')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <GenericTable<ChiTietKiemKeKho>
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('kiemKeKho.loading')}
      emptyTitle={t('kiemKeKho.chiTietEmpty')}
      emptyDescription={t('kiemKeKho.chiTietEmptyHint')}
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
      showActionsColumn={showActions}
      actionsColumnWidth={120}
    />
  );
};

export default ChiTietKiemKeTable;
