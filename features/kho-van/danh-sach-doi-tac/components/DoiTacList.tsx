import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import type { DoiTac } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: DoiTac[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: DoiTac) => void;
  onDelete?: (id: string) => void;
  onView?: (item: DoiTac) => void;
}

const DoiTacList: React.FC<Props> = ({
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
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderCell = (colId: string, item: DoiTac) => {
    switch (colId) {
      case 'thu_tu':
        return <span className="text-sm text-muted-foreground">{item.thu_tu}</span>;
      case 'loai_doi_tac':
        return (
          <span className="text-sm text-muted-foreground">
            {item.loai_doi_tac === 'nha_cung_cap' ? t('doiTac.tabs.nhaCungCap') : t('doiTac.tabs.khachHang')}
          </span>
        );
      case 'ma_ncc':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.ma_ncc}
          </span>
        );
      case 'ten_ncc':
        return <span className="font-medium text-foreground">{item.ten_ncc}</span>;
      case 'ten_nhom':
        return <span className="text-sm text-muted-foreground">{item.ten_nhom ?? '—'}</span>;
      case 'dien_thoai':
        return <span className="text-sm text-muted-foreground">{item.dien_thoai ?? '—'}</span>;
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {(item.ten_tags ?? []).length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              (item.ten_tags ?? []).map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {name}
                </span>
              ))
            )}
          </div>
        );
      case 'trang_thai':
        return item.trang_thai === 'Đang hoạt động' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {t('common.activeStatus')}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            {t('common.inactiveStatus')}
          </span>
        );
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1.5 text-primary hover:bg-primary/10 rounded-md" title={t('common.edit')} aria-label={t('common.edit')}>
                <Edit size={14} />
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md" title={t('common.delete')} aria-label={t('common.delete')}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: DoiTac, isSelected: boolean) => (
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
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
          {item.ma_ncc}
        </span>
        <span className="text-xs text-muted-foreground">
          {item.loai_doi_tac === 'nha_cung_cap' ? t('doiTac.tabs.nhaCungCap') : t('doiTac.tabs.khachHang')}
        </span>
      </div>
      <div className="font-medium text-foreground text-sm mb-1">{item.ten_ncc}</div>
      <div className="text-xs text-muted-foreground mb-2">{item.ten_nhom ?? '—'} {item.dien_thoai ? `· ${item.dien_thoai}` : ''}</div>
      {(item.ten_tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(item.ten_tags ?? []).map((name) => (
            <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {name}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>
        <div className="flex gap-1">
          {onEdit && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg" aria-label={t('common.edit')}>
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg" aria-label={t('common.delete')}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable<DoiTac>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('doiTac.loading')}
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
      emptyTitle={t('doiTac.empty')}
      emptyDescription={t('doiTac.emptyHint')}
    />
  );
};

export default DoiTacList;
