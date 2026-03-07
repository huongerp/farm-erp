import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Printer, Mail, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getLoaiThuLabel, getLoaiThuBadgeClass } from '../core/constants';
import { useThuGuiUngVienStore } from '../store/useThuGuiUngVienStore';
import type { ThuGuiUngVien } from '../core/types';

interface Props {
  data: ThuGuiUngVien[];
  isLoading: boolean;
  onView: (item: ThuGuiUngVien) => void;
  onEdit: (item: ThuGuiUngVien) => void;
  onPrint: (item: ThuGuiUngVien) => void;
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
  } = useThuGuiUngVienStore();

  const renderCell = (colId: string, item: ThuGuiUngVien) => {
    switch (colId) {
      case 'ten_ung_vien':
        return (
          <span className="font-medium text-sm text-foreground block min-w-0 truncate" title={item.ten_ung_vien ?? undefined}>
            {item.ten_ung_vien ?? '—'}
          </span>
        );
      case 'loai_thu':
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getLoaiThuBadgeClass(item.loai_thu)}`}>
            {getLoaiThuLabel(item.loai_thu, t)}
          </span>
        );
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDateTimeShort(item.tg_tao)}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('thuGuiUngVien.edit')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                aria-label={t('thuGuiUngVien.edit')}
              >
                <Edit size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('thuGuiUngVien.print')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint(item);
                }}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-all"
                aria-label={t('thuGuiUngVien.print')}
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

  const renderMobileCard = (item: ThuGuiUngVien, isSelected: boolean) => (
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
          <Mail size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_ung_vien ?? '—'}</h4>
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
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getLoaiThuBadgeClass(item.loai_thu)}`}>
              {getLoaiThuLabel(item.loai_thu, t)}
            </span>
            <span className="text-xs text-muted-foreground">{formatDateTimeShort(item.tg_tao)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1.5 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all"
          aria-label={t('thuGuiUngVien.edit')}
        >
          <Edit size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrint(item); }}
          className="p-2 text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-all"
          aria-label={t('thuGuiUngVien.print')}
        >
          <Printer size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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
      emptyTitle={t('thuGuiUngVien.emptyTitle')}
      emptyDescription={t('thuGuiUngVien.emptyDescription')}
    />
  );
};

export default DanhSachTable;
