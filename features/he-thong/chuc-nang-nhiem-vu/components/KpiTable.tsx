import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Power, Target } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import { useKpiTableStore } from '../store/useFunctionTaskStore';
import type { KpiIndicator, KpiCycle } from '../core/types';

interface Props {
  data: KpiIndicator[];
  isLoading: boolean;
  onEdit: (item: KpiIndicator) => void;
  onDelete: (id: string) => void;
  onStatusChange: (item: KpiIndicator) => void;
}

const cycleLabel = (cycle: KpiCycle, t: (k: string) => string) => {
  switch (cycle) {
    case 'month': return t('chucNangNhiemVu.form.cycleMonth');
    case 'quarter': return t('chucNangNhiemVu.form.cycleQuarter');
    case 'year': return t('chucNangNhiemVu.form.cycleYear');
    default: return cycle;
  }
};

const KpiTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onStatusChange }) => {
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
  } = useKpiTableStore();

  const renderStatusBadge = (status: number) =>
    status === 1 ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {t('chucNangNhiemVu.active')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {t('chucNangNhiemVu.inactive')}
      </span>
    );

  const renderCell = (colId: string, item: KpiIndicator) => {
    switch (colId) {
      case 'ten_chi_so':
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Target size={14} />
            </div>
            <span className="font-medium text-foreground">{item.ten_chi_so}</span>
          </div>
        );
      case 'don_vi':
        return <span className="text-sm">{item.don_vi}</span>;
      case 'chi_tieu_nguong':
        return <span className="text-sm font-medium">{item.chi_tieu_nguong}</span>;
      case 'chu_ky_danh_gia':
        return <span className="text-sm text-muted-foreground">{cycleLabel(item.chu_ky_danh_gia, t)}</span>;
      case 'thu_tu':
        return <span className="text-sm">{item.thu_tu}</span>;
      case 'trang_thai':
        return renderStatusBadge(item.trang_thai);
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onStatusChange(item); }}
              className="p-2 rounded-lg transition-all text-muted-foreground hover:bg-muted"
              aria-label={t('common.status')}
            >
              <Power size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
              aria-label={t('common.edit')}
            >
              <Edit size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
              aria-label={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: KpiIndicator, isSelected: boolean) => (
    <div
      className={`rounded-xl border p-4 ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Target size={18} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{item.ten_chi_so}</p>
            <p className="text-xs text-muted-foreground">{item.don_vi} · {item.chi_tieu_nguong}</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelection(item.id)}
          className="w-5 h-5 rounded border-border text-primary"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{cycleLabel(item.chu_ky_danh_gia, t)}</span>
        {renderStatusBadge(item.trang_thai)}
        <div className="flex gap-2">
          <button type="button" onClick={() => onEdit(item)} className="p-2 text-primary bg-primary/10 rounded-lg">
            <Edit size={16} />
          </button>
          <button type="button" onClick={() => onDelete(item.id)} className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
            <Trash2 size={16} />
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
      onRowClick={(item) => onEdit(item)}
      keyExtractor={(item) => item.id}
    />
  );
};

export default KpiTable;
