import React from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, RefreshCw, Trash2, Package } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { cn } from '../../../../lib/utils';
import { getKetQuaLabel } from '../core/constants';
import { useChiTietKiemKeTaiSanStore } from '../store/useChiTietKiemKeTaiSanStore';
import type { ChiTietKiemKe } from '../core/types';

interface Props {
  data: ChiTietKiemKe[];
  isLoading: boolean;
  showActions?: boolean;
  isDangKiemKe?: boolean;
  onNhapKetQua?: (item: ChiTietKiemKe) => void;
  onCapNhatSo?: (id: string) => void;
  onDelete?: (item: ChiTietKiemKe) => void;
  capNhatSoLoading?: boolean;
  nhapKetQuaLoading?: boolean;
  deleteLoading?: boolean;
}

const ChiTietKiemKeTaiSanTable: React.FC<Props> = ({
  data,
  isLoading,
  showActions = false,
  isDangKiemKe = false,
  onNhapKetQua,
  onCapNhatSo,
  onDelete,
  capNhatSoLoading,
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
  } = useChiTietKiemKeTaiSanStore();

  const isChenh =
    (c: ChiTietKiemKe) =>
      c.ket_qua === 'Chênh nơi lưu' ||
      c.ket_qua === 'Chênh người giữ' ||
      c.ket_qua === 'Chênh trạng thái';
  const canCapNhatSo = (c: ChiTietKiemKe) =>
    isChenh(c) &&
    (c.id_noi_luu_thuc_te != null || c.id_nguoi_giu_thuc_te != null || c.id_trang_thai_thuc_te != null);

  const renderKetQuaBadge = (ket_qua: string) => {
    const cls = cn(
      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
      ket_qua === 'Khớp' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      ket_qua === 'Chưa kiểm' && 'bg-muted text-muted-foreground border-border',
      (ket_qua === 'Chênh nơi lưu' || ket_qua === 'Chênh người giữ' || ket_qua === 'Chênh trạng thái') &&
        'bg-amber-500/10 text-amber-700 border-amber-500/20',
      ket_qua === 'Thiếu' && 'bg-rose-500/10 text-rose-700 border-rose-500/20'
    );
    return <span className={cls}>{getKetQuaLabel(ket_qua as any)}</span>;
  };

  const renderCell = (colId: string, item: ChiTietKiemKe) => {
    switch (colId) {
      case 'tai_san':
        return (
          <div>
            <span className="font-medium text-sm">{item.ten_tai_san || item.ma_tai_san || '—'}</span>
            {item.ma_tai_san && (
              <span className="text-xs text-muted-foreground block">{item.ma_tai_san}</span>
            )}
          </div>
        );
      case 'noi_luu_so':
        return <span className="text-sm">{item.ten_noi_luu_so || '—'}</span>;
      case 'nguoi_giu_so':
        return <span className="text-sm">{item.ten_nguoi_giu_so || '—'}</span>;
      case 'trang_thai_so':
        return <span className="text-sm">{item.ten_trang_thai_so || '—'}</span>;
      case 'ket_qua':
        return renderKetQuaBadge(item.ket_qua);
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
            {isDangKiemKe && onNhapKetQua && (
              <Tooltip content={t('kiemKeTaiSan.table.nhapKetQua')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNhapKetQua(item);
                  }}
                  disabled={nhapKetQuaLoading}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                  aria-label={t('kiemKeTaiSan.table.nhapKetQua')}
                >
                  <PenLine size={15} />
                </button>
              </Tooltip>
            )}
            {isDangKiemKe && onCapNhatSo && canCapNhatSo(item) && (
              <Tooltip content={t('kiemKeTaiSan.capNhatSoTheoKetQua')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCapNhatSo(item.id);
                  }}
                  disabled={capNhatSoLoading}
                  className="p-1.5 text-secondary-foreground hover:bg-muted rounded-md transition-all"
                  aria-label={t('kiemKeTaiSan.capNhatSoTheoKetQua')}
                >
                  <RefreshCw size={15} />
                </button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip content={t('kiemKeTaiSan.table.xoaDong')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  disabled={deleteLoading}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                  aria-label={t('kiemKeTaiSan.table.xoaDong')}
                >
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return <span className="text-sm">{String((item as unknown as Record<string, unknown>)[colId] ?? '—')}</span>;
    }
  };

  const renderMobileCard = (item: ChiTietKiemKe, isSelected: boolean) => (
    <div className={cn('p-3', isSelected && 'border-primary bg-primary/5')}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.ten_tai_san || item.ma_tai_san || '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{item.ten_noi_luu_so || '—'}</p>
          </div>
        </div>
        {renderKetQuaBadge(item.ket_qua)}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground mt-1.5">
        <span>{t('kiemKeTaiSan.store.nguoiGiuSoCol')}: <strong className="text-foreground">{item.ten_nguoi_giu_so || '—'}</strong></span>
        <span>{t('kiemKeTaiSan.store.trangThaiSoCol')}: <strong className="text-foreground">{item.ten_trang_thai_so || '—'}</strong></span>
      </div>
      {showActions && (
        <div className="flex gap-1.5 mt-2 pt-2 border-t border-border justify-end">
          {isDangKiemKe && onNhapKetQua && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNhapKetQua(item);
              }}
              className="p-1.5 text-primary bg-primary/5 hover:bg-primary/10 rounded-md"
              aria-label={t('kiemKeTaiSan.table.nhapKetQua')}
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
              aria-label={t('kiemKeTaiSan.table.xoaDong')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <GenericTable<ChiTietKiemKe>
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('kiemKeTaiSan.loading')}
      emptyTitle={t('kiemKeTaiSan.chiTietEmpty')}
      emptyDescription={t('kiemKeTaiSan.chiTietEmptyHint')}
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
    />
  );
};

export default ChiTietKiemKeTaiSanTable;
