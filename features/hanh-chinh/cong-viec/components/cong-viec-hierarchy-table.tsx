import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HierarchyTable } from '../../../../components/shared/HierarchyTable';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { CongViec } from '../core/types';
import { getTrangThaiLabel, getUuTienLabel } from '../core/constants';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';

export type CongViecRow = { item: CongViec; level: number };

interface Props {
  data: CongViecRow[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  onEdit: (item: CongViec) => void;
  onDelete: (id: number | string) => void;
  onView?: (item: CongViec) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const CongViecHierarchyTable: React.FC<Props> = ({
  data,
  columns,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  onEdit,
  onDelete,
  onView,
  canUpdate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployeesRefQuery();
  const employeeNameMap = useMemo(() => {
    const m: Record<number, string> = {};
    employees.forEach((e) => {
      const id = typeof e.id === 'number' ? e.id : parseInt(String(e.id), 10);
      if (!Number.isNaN(id) && id > 0) m[id] = e.ho_ten?.trim() || e.ma_nhan_vien || String(e.id);
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

  const renderCell = (row: CongViecRow, col: ColumnConfig) => {
    const { item, level } = row;
    const paddingLeft = level > 1 ? (level - 1) * 20 : 0;
    const cellClass = 'px-3 py-1.5';
    const baseTd = (content: React.ReactNode) => (
      <td key={col.id} className={cellClass} style={getColumnCellStyle(col)}>
        {content}
      </td>
    );

    switch (col.id) {
      case 'tieu_de':
        return (
          <td key={col.id} className={cellClass} style={{ ...getColumnCellStyle(col), paddingLeft }}>
            <span className="text-sm font-medium text-foreground line-clamp-1 max-w-[280px]">{item.tieu_de}</span>
          </td>
        );
      case 'mo_ta':
        return baseTd(
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[320px]">{item.mo_ta?.trim() || '—'}</span>
        );
      case 'id_nguoi_giao':
        return baseTd(
          <span className="text-sm text-muted-foreground truncate block max-w-[140px]" title={getEmployeeName(item.id_nguoi_giao)}>
            {getEmployeeName(item.id_nguoi_giao)}
          </span>
        );
      case 'trach_nhiem':
        return baseTd(
          <span className="text-sm text-foreground truncate block max-w-[140px]" title={getEmployeeName(item.trach_nhiem)}>
            {getEmployeeName(item.trach_nhiem)}
          </span>
        );
      case 'nguoi_ho_tro':
        return baseTd(
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]" title={(item.nguoi_ho_tro ?? []).map(getEmployeeName).join(', ')}>
            {(item.nguoi_ho_tro ?? []).length === 0 ? '—' : (item.nguoi_ho_tro ?? []).map(getEmployeeName).join(', ')}
          </span>
        );
      case 'uu_tien':
        return baseTd(renderUuTienBadge(item.uu_tien));
      case 'trang_thai':
        return baseTd(renderTrangThaiBadge(item.trang_thai));
      case 'tg_cap_nhat':
        return baseTd(
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      default:
        return baseTd(null);
    }
  };

  const visibleColumns = columns.filter((c) => c.visible).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <HierarchyTable<CongViecRow>
      data={data}
      columns={visibleColumns}
      selectedIds={selectedIds}
      getId={(row) => String(row.item.id)}
      getLevel={(row) => row.level}
      renderCell={renderCell}
      onToggleSelection={onToggleSelection}
      onToggleAllSelection={onToggleAllSelection}
      onEdit={canUpdate ? (row) => onEdit(row.item) : undefined}
      onDelete={canDelete ? (id) => onDelete(id) : undefined}
      onView={onView ? (row) => onView(row.item) : undefined}
      className="flex-1 min-h-0 overflow-auto"
    />
  );
};

export default CongViecHierarchyTable;
