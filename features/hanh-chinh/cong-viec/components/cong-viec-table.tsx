import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, ClipboardList } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import type { CongViec } from '../core/types';
import { useCongViecStore } from '../store/useCongViecStore';
import { getTrangThaiLabel, getUuTienLabel } from '../core/constants';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';

interface Props {
  data: CongViec[];
  isLoading: boolean;
  onEdit: (item: CongViec) => void;
  onDelete: (id: number | string) => void;
  onView?: (item: CongViec) => void;
}

const CongViecTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onView }) => {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployees();
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
  } = useCongViecStore();

  const employeeNameMap = useMemo(() => {
    const m: Record<number, string> = {};
    employees.forEach((e) => {
      const id = typeof e.id === 'number' ? e.id : parseInt(String(e.id), 10);
      if (!Number.isNaN(id) && id > 0) {
        m[id] = e.ho_ten?.trim() || e.ma_nhan_vien || String(e.id);
      }
    });
    return m;
  }, [employees]);
  const getEmployeeName = (id: number | null | undefined) => {
    if (id == null) return '—';
    return employeeNameMap[id] ?? String(id);
  };

  const renderTrangThaiBadge = (trangThai: CongViec['trang_thai']) => {
    const label = getTrangThaiLabel(trangThai, t);
    const cls =
      trangThai === 'hoan_thanh'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : trangThai === 'dang_thuc_hien'
          ? 'bg-blue-50 text-blue-700 border-blue-100'
          : trangThai === 'cho_bao_cao'
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : trangThai === 'huy'
              ? 'bg-muted text-muted-foreground border-border'
              : 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
        {label}
      </span>
    );
  };

  const renderUuTienBadge = (uuTien: CongViec['uu_tien']) => {
    const label = getUuTienLabel(uuTien, t);
    const cls =
      uuTien === 'cao'
        ? 'bg-rose-50 text-rose-700 border-rose-100'
        : uuTien === 'trung_binh'
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
        {label}
      </span>
    );
  };

  const renderCell = (colId: string, item: CongViec) => {
    switch (colId) {
      case 'tieu_de':
        return (
          <span className="text-sm font-medium text-foreground line-clamp-1 max-w-[280px]">
            {item.tieu_de}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[320px]">
            {item.mo_ta?.trim() || '—'}
          </span>
        );
      case 'id_nguoi_giao':
        return (
          <span className="text-sm text-muted-foreground truncate block max-w-[140px]" title={getEmployeeName(item.id_nguoi_giao)}>
            {getEmployeeName(item.id_nguoi_giao)}
          </span>
        );
      case 'trach_nhiem':
        return (
          <span className="text-sm text-foreground truncate block max-w-[140px]" title={getEmployeeName(item.trach_nhiem)}>
            {getEmployeeName(item.trach_nhiem)}
          </span>
        );
      case 'nguoi_ho_tro':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]" title={(item.nguoi_ho_tro ?? []).map(getEmployeeName).join(', ')}>
            {(item.nguoi_ho_tro ?? []).length === 0 ? '—' : (item.nguoi_ho_tro ?? []).map(getEmployeeName).join(', ')}
          </span>
        );
      case 'uu_tien':
        return renderUuTienBadge(item.uu_tien);
      case 'trang_thai':
        return renderTrangThaiBadge(item.trang_thai);
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

  const renderMobileCard = (item: CongViec, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <ClipboardList size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm line-clamp-2">{item.tieu_de}</h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelection(String(item.id))}
                className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                aria-label={t('common.select')}
              />
            </div>
          </div>
          {item.mo_ta?.trim() && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.mo_ta.trim()}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
            <span><span className="font-medium text-foreground/80">{t('congViec.form.trachNhiem')}:</span> {getEmployeeName(item.trach_nhiem)}</span>
            <span><span className="font-medium text-foreground/80">{t('congViec.form.nguoiGiao')}:</span> {getEmployeeName(item.id_nguoi_giao)}</span>
            {(item.nguoi_ho_tro ?? []).length > 0 && (
              <span><span className="font-medium text-foreground/80">{t('congViec.form.nguoiHoTro')}:</span> {(item.nguoi_ho_tro ?? []).map(getEmployeeName).join(', ')}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {renderUuTienBadge(item.uu_tien)}
            {renderTrangThaiBadge(item.trang_thai)}
            <span className="text-xs text-muted-foreground">{formatDateTimeShort(item.tg_cap_nhat)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border flex-wrap gap-1">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all"
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
            className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-lg transition-all"
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
      density="compact"
      loadingText={t('congViec.loading')}
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
      keyExtractor={(item) => String(item.id)}
      onRowClick={(item) => onView?.(item)}
      emptyTitle={t('congViec.empty')}
      emptyDescription={t('congViec.emptyHint')}
    />
  );
};

export default CongViecTable;
