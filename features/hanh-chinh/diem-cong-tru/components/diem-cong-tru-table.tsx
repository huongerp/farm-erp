import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import { formatKyThangNam } from '../../bang-luong/utils/ky-hien-thi';
import { DiemCongTruRecord } from '../core/types';
import { useDiemCongTruStore } from '../store/useDiemCongTruStore';
import { getDiemCongTruLoaiLabel } from '../core/constants';

interface Props {
  data: DiemCongTruRecord[];
  isLoading: boolean;
  /** Đang tải trang mới nhưng đã có dữ liệu cũ — hiện lớp phủ mờ thay vì skeleton. */
  isFetching?: boolean;
  /** Tổng số bản ghi khớp bộ lọc (phân trang ở server). */
  totalRecordsOverride?: number;
  onEdit: (item: DiemCongTruRecord) => void;
  onDelete: (id: string) => void;
  onView?: (item: DiemCongTruRecord) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const DiemCongTruTable: React.FC<Props> = ({ isFetching, totalRecordsOverride, data, isLoading, onEdit, onDelete, onView, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const {
    columns,
    resizeColumn,
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
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
        {getDiemCongTruLoaiLabel(loai, t)}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
        {getDiemCongTruLoaiLabel(loai, t)}
      </span>
    );

  const renderCell = (colId: string, item: DiemCongTruRecord) => {
    switch (colId) {
      case 'ten_nhan_vien':
        return (
          <span className="text-sm text-foreground whitespace-nowrap">
            {item.ma_nhan_vien && item.ten_nhan_vien
              ? `${item.ma_nhan_vien} - ${item.ten_nhan_vien}`
              : item.ten_nhan_vien || item.ma_nhan_vien || '—'}
          </span>
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
            {canUpdate && (
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
            )}
            {canDelete && (
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
            )}
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate">
            {item.ma_nhan_vien && item.ten_nhan_vien
              ? `${item.ma_nhan_vien} - ${item.ten_nhan_vien}`
              : item.ten_nhan_vien || item.ma_nhan_vien || '—'}
          </h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
            {t('diemCongTru.card.ky')} {formatKyThangNam(item.nam, item.thang)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {renderLoaiBadge(item.loai)}
          <div role="presentation" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(item.id)}
              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
              aria-label={t('common.select')}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2.5">
        <span className="text-xs text-muted-foreground truncate">
          {t('diemCongTru.store.categoryCol')}: <span className="text-foreground">{item.ten_hang_muc || item.ma_hang_muc || '—'}</span>
        </span>
        <div className="shrink-0">
          <span className="text-xs text-muted-foreground mr-1.5">{t('diemCongTru.store.diemCol')}</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{item.diem}</span>
        </div>
      </div>
      {item.mo_ta && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {t('diemCongTru.store.moTaCol')}: <span className="text-foreground">{item.mo_ta}</span>
        </p>
      )}
      {(canUpdate || canDelete) && (
        <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
          {canUpdate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
              aria-label={t('common.edit')}
            >
              <Edit size={16} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="h-10 w-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
              aria-label={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      onResizeColumn={resizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
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
