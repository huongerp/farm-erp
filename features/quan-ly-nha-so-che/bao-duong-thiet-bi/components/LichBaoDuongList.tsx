import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { cn, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import type { LichBaoDuongRow } from '../core/list-types';
import { TinhTrangHanBadge } from './Badges';

interface Props {
  data: LichBaoDuongRow[];
  columns: ColumnConfig[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalRecordsOverride: number;
  onResizeColumn?: (id: string, width: number) => void;
  onGhiNhan?: (item: LichBaoDuongRow) => void;
}

const LichBaoDuongList: React.FC<Props> = ({
  data,
  columns,
  isLoading,
  isFetching,
  isError,
  onRetry,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalRecordsOverride,
  onResizeColumn,
  onGhiNhan,
}) => {
  const { t } = useTranslation();
  const homNay = getTodayISO();

  const chuKyText = (chuKyNgay: number | null) =>
    chuKyNgay != null ? t('baoDuongThietBi.chuKy.ngay', { n: chuKyNgay }) : t('baoDuongThietBi.chuKy.khongTheoLich');

  const renderCell = (colId: string, item: LichBaoDuongRow) => {
    const one = (text: React.ReactNode, className?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)}>{text}</span>
    );
    switch (colId) {
      case 'thiet_bi':
        return (
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{item.thiet_bi_ten}</div>
            <div className="text-xs text-muted-foreground truncate">
              {[item.thiet_bi_ma_ts, item.thiet_bi_khu_vuc].filter(Boolean).join(' · ') || '—'}
            </div>
          </div>
        );
      case 'noi_dung':
        return one(item.noi_dung, 'font-medium');
      case 'chu_ky_ngay':
        return one(chuKyText(item.chu_ky_ngay), 'tabular-nums');
      case 'lan_gan_nhat':
        return one(item.lan_gan_nhat ? formatYmdToDisplay(item.lan_gan_nhat) : '—', 'tabular-nums text-muted-foreground');
      case 'han_ke_tiep':
        return one(item.han_ke_tiep ? formatYmdToDisplay(item.han_ke_tiep) : '—', 'tabular-nums text-muted-foreground');
      case 'tinh_trang':
        return <TinhTrangHanBadge han={item.han_ke_tiep} homNay={homNay} />;
      case 'actions':
        return onGhiNhan ? (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGhiNhan(item);
              }}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 active:scale-95 transition-all"
            >
              <ClipboardCheck size={14} className="shrink-0" />
              <span>{t('baoDuongThietBi.viec.ghiNhan')}</span>
            </button>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: LichBaoDuongRow, isSelected: boolean) => (
    <div className={cn('bg-card rounded-xl border p-3.5 shadow-sm transition-all', isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold truncate">{item.thiet_bi_ten}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {[item.thiet_bi_ma_ts, item.thiet_bi_khu_vuc].filter(Boolean).join(' · ') || '—'}
          </p>
          <p className="text-sm mt-1">{item.noi_dung}</p>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {chuKyText(item.chu_ky_ngay)}
            {item.han_ke_tiep ? ` · ${t('baoDuongThietBi.col.hanKeTiep')}: ${formatYmdToDisplay(item.han_ke_tiep)}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <TinhTrangHanBadge han={item.han_ke_tiep} homNay={homNay} />
        </div>
      </div>
      {onGhiNhan && (
        <button
          type="button"
          onClick={() => onGhiNhan(item)}
          className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10 active:scale-95 transition-all"
        >
          <ClipboardCheck size={15} />
          {t('baoDuongThietBi.viec.ghiNhan')}
        </button>
      )}
    </div>
  );

  return (
    <GenericTable<LichBaoDuongRow>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={onRetry}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      totalRecordsOverride={totalRecordsOverride}
      onResizeColumn={onResizeColumn}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      actionsColumnWidth={116}
      loadingText={t('baoDuongThietBi.loading')}
      emptyTitle={t('baoDuongThietBi.empty')}
      emptyDescription={t('baoDuongThietBi.lich.emptyHint')}
    />
  );
};

export default LichBaoDuongList;
