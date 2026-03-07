import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import type { PhieuBaoTriSuaChua } from '../core/types';
import { getHangMucLabel } from '../core/constants';
import { useBaoTriSuaChuaStore } from '../store/useBaoTriSuaChuaStore';

interface Props {
  data: PhieuBaoTriSuaChua[];
  isLoading: boolean;
  onView?: (item: PhieuBaoTriSuaChua) => void;
  onEdit?: (item: PhieuBaoTriSuaChua) => void;
  onDelete?: (item: PhieuBaoTriSuaChua) => void;
  showActions?: boolean;
}

const PhieuBaoTriTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete, showActions = true }) => {
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
  } = useBaoTriSuaChuaStore();

  const renderHangMucBadge = (hangMuc: PhieuBaoTriSuaChua['hang_muc']) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      {getHangMucLabel(hangMuc, t)}
    </span>
  );

  const renderCell = (colId: string, item: PhieuBaoTriSuaChua) => {
    switch (colId) {
      case 'hang_muc':
        return renderHangMucBadge(item.hang_muc);
      case 'ten_tai_san':
        return (
          <div className="flex flex-col gap-0.5 min-w-[140px]">
            <span className="font-medium text-foreground text-sm">{item.ten_tai_san || item.ma_tai_san || '—'}</span>
            {item.ma_tai_san && item.ten_tai_san && (
              <span className="text-xs text-muted-foreground">{item.ma_tai_san}</span>
            )}
          </div>
        );
      case 'ngay_yeu_cau':
      case 'ngay_hen':
        return (
          <span className="text-sm tabular-nums">{formatDate(item[colId as keyof PhieuBaoTriSuaChua] as string)}</span>
        );
      case 'ten_nguoi_phu_trach':
        return <span className="text-sm text-foreground">{item.ten_nguoi_phu_trach || '—'}</span>;
      case 'trang_thai':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.trang_thai === 1 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
            {item.trang_thai === 1 ? t('baoTriSuaChua.statusCompleted') : t('baoTriSuaChua.statusPending')}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
            {item.mo_ta || '—'}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        if (!showActions) return null;
        return (
          <div className="flex items-center justify-center gap-1">
            {onEdit && (
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
            )}
            {onDelete && (
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return <span className="text-sm">{String(item[colId as keyof PhieuBaoTriSuaChua] ?? '—')}</span>;
    }
  };

  const handleRowClick = onView ?? onEdit;
  const renderMobileCard = (item: PhieuBaoTriSuaChua, isSelected: boolean) => (
    <div
      className={isSelected ? 'border-primary bg-primary/5' : ''}
      onClick={() => handleRowClick?.(item)}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="font-medium text-sm">{getHangMucLabel(item.hang_muc, t)}</span>
        <span className="text-xs text-muted-foreground">{formatDate(item.ngay_yeu_cau)}</span>
      </div>
      <p className="text-sm text-foreground mt-0.5">{item.ten_tai_san || item.ma_tai_san || '—'}</p>
      <p className="text-xs text-muted-foreground">{item.ten_nguoi_phu_trach || '—'}</p>
    </div>
  );

  return (
    <GenericTable<PhieuBaoTriSuaChua>
      data={data}
      columns={columns}
      isLoading={isLoading}
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
      onRowClick={handleRowClick}
      keyExtractor={(item) => item.id}
      loadingText={t('baoTriSuaChua.loading')}
      emptyTitle={t('baoTriSuaChua.empty')}
      emptyDescription={t('baoTriSuaChua.emptyHint')}
    />
  );
};

export default PhieuBaoTriTable;
