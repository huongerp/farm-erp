import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Scale } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import { DiemCongTruRecord } from '../core/types';
import { useDiemCongTruStore } from '../store/useDiemCongTruStore';
import { getDiemCongTruLoaiLabel } from '../core/constants';

interface Props {
  data: DiemCongTruRecord[];
  isLoading: boolean;
  onEdit: (item: DiemCongTruRecord) => void;
  onDelete: (id: string) => void;
  onView?: (item: DiemCongTruRecord) => void;
}

const DiemCongTruTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onView }) => {
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
  } = useDiemCongTruStore();

  const formatPeriod = (nam: number, thang: number) => `${nam}-${String(thang).padStart(2, '0')}`;

  const renderLoaiBadge = (loai: 'cong' | 'tru') =>
    loai === 'cong' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
        {getDiemCongTruLoaiLabel(loai, t)}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
        {getDiemCongTruLoaiLabel(loai, t)}
      </span>
    );

  const renderCell = (colId: string, item: DiemCongTruRecord) => {
    switch (colId) {
      case 'ten_nhan_vien':
        return (
          <div className="flex flex-col gap-0.5 min-w-[140px]">
            <span className="font-medium text-foreground text-sm">{item.ten_nhan_vien || '—'}</span>
            {item.ma_nhan_vien && (
              <span className="text-xs text-muted-foreground">{item.ma_nhan_vien}</span>
            )}
          </div>
        );
      case 'period':
        return (
          <span className="text-sm font-medium text-foreground tabular-nums">
            {formatPeriod(item.nam, item.thang)}
          </span>
        );
      case 'loai':
        return renderLoaiBadge(item.loai);
      case 'ten_hang_muc':
        return (
          <span className="text-sm text-foreground">
            {item.ten_hang_muc || item.ma_hang_muc || '—'}
          </span>
        );
      case 'diem':
        return (
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {item.diem}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[240px]">
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

  const renderMobileCard = (item: DiemCongTruRecord, isSelected: boolean) => (
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
          <Scale size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {item.ten_nhan_vien || '—'}
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
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatPeriod(item.nam, item.thang)}
            </span>
            {renderLoaiBadge(item.loai)}
            <span className="text-xs font-semibold text-foreground">{item.diem} điểm</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
        <div>
          <p className="text-muted-foreground mb-0.5">{t('diemCongTru.store.categoryCol')}</p>
          <p className="font-medium text-foreground line-clamp-1">
            {item.ten_hang_muc || item.ma_hang_muc || '—'}
          </p>
        </div>
        {item.mo_ta && (
          <div>
            <p className="text-muted-foreground mb-0.5">{t('diemCongTru.store.moTaCol')}</p>
            <p className="text-foreground line-clamp-2">{item.mo_ta}</p>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">{formatDateTimeShort(item.tg_cap_nhat)}</span>
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
      loadingText={t('diemCongTru.loading')}
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

export default DiemCongTruTable;
