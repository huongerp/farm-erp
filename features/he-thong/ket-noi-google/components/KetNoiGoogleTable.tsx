import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import { cn, formatDateTimeShort } from '../../../../lib/utils';
import { useKetNoiGoogleStore } from '../store/useKetNoiGoogleStore';
import { tinhTrangKetNoi } from '../core/trang-thai';
import type { KetNoiGoogle } from '../core/types';
import TinhTrangBadge from './TinhTrangBadge';

interface Props {
  data: KetNoiGoogle[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onView: (item: KetNoiGoogle) => void;
}

const KetNoiGoogleTable: React.FC<Props> = ({ data, isLoading, isError, onRetry, onView }) => {
  const { t } = useTranslation();
  const { columns, resizeColumn, pagination, setPage, setPageSize, selectedIds, toggleSelection, toggleAllSelection, sort, setSort } =
    useKetNoiGoogleStore();

  const soLich = (item: KetNoiGoogle) => (
    <span className="text-sm text-foreground">
      {t('ketNoiGoogle.scheduleCount', { total: item.so_lich, on: item.so_lich_dang_bat })}
      {item.so_lich_loi > 0 && <span className="ml-1 text-amber-600 dark:text-amber-400">· {t('ketNoiGoogle.errorCount', { n: item.so_lich_loi })}</span>}
    </span>
  );

  const renderCell = (colId: string, item: KetNoiGoogle) => {
    switch (colId) {
      case 'ho_va_ten':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground text-sm">{item.ho_va_ten ?? `#${item.nhan_vien_id}`}</span>
            {item.ten_chuc_vu && <span className="text-xs text-muted-foreground">{item.ten_chuc_vu}</span>}
          </div>
        );
      case 'ten_phong_ban':
        return <span className="text-sm text-muted-foreground">{item.ten_phong_ban}</span>;
      case 'ten_chuc_vu':
        return <span className="text-sm text-muted-foreground">{item.ten_chuc_vu}</span>;
      case 'google_email':
        return <span className="text-sm text-foreground">{item.google_email}</span>;
      case 'tinh_trang':
        return <TinhTrangBadge value={tinhTrangKetNoi(item)} />;
      case 'so_lich':
        return soLich(item);
      case 'lan_dong_bo_cuoi':
        return <span className="text-sm text-muted-foreground tabular-nums">{item.lan_dong_bo_cuoi ? formatDateTimeShort(item.lan_dong_bo_cuoi) : '—'}</span>;
      case 'tg_tao':
        return <span className="text-sm text-muted-foreground tabular-nums">{formatDateTimeShort(item.tg_tao)}</span>;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: KetNoiGoogle, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView(item)}
      className={cn('bg-card rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98]', isSelected ? 'border-primary' : 'border-border')}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
          <Link2 size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ho_va_ten ?? `#${item.nhan_vien_id}`}</h4>
            <TinhTrangBadge value={tinhTrangKetNoi(item)} />
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.google_email}</p>
        </div>
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-border text-xs text-muted-foreground">
        {soLich(item)}
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      onResizeColumn={resizeColumn}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      loadingText={t('ketNoiGoogle.loading')}
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
      onRowClick={onView}
    />
  );
};

export default KetNoiGoogleTable;
