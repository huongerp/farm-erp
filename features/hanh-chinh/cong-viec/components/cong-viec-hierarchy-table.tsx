import React from 'react';
import { useTranslation } from 'react-i18next';
import { HierarchyTable } from '../../../../components/shared/HierarchyTable';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { CongViec } from '../core/types';
import { getTrangThaiLabel, getUuTienLabel, getDueStatus } from '../core/constants';
import { useCauHinhCongViec } from '../../thiet-lap-cong-viec/hooks/use-cau-hinh-cong-viec';

export type CongViecRow = { item: CongViec; level: number };

interface Props {
  data: CongViecRow[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  onEdit: (item: CongViec) => void;
  onDelete: (id: string) => void;
  onView?: (item: CongViec) => void;
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
}) => {
  const { t } = useTranslation();
  const { data: cauHinh } = useCauHinhCongViec();

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
    const baseTd = (content: React.ReactNode) => (
      <td key={col.id} className="px-4 py-3.5" style={getColumnCellStyle(col)}>
        {content}
      </td>
    );

    switch (col.id) {
      case 'ma_cong_viec':
        return (
          <td key={col.id} className="px-4 py-3.5" style={{ ...getColumnCellStyle(col), paddingLeft }}>
            <span className="font-mono text-sm font-medium text-foreground">{item.ma_cong_viec}</span>
          </td>
        );
      case 'tieu_de':
        return (
          <td key={col.id} className="px-4 py-3.5" style={{ ...getColumnCellStyle(col), paddingLeft }}>
            <span className="text-sm text-foreground line-clamp-2 max-w-[280px]">{item.tieu_de}</span>
          </td>
        );
      case 'ten_du_an':
        return baseTd(<span className="text-sm text-muted-foreground">{item.ten_du_an || '—'}</span>);
      case 'uu_tien':
        return baseTd(renderUuTienBadge(item.uu_tien));
      case 'trang_thai':
        return baseTd(renderTrangThaiBadge(item.trang_thai));
      case 'ngay_het_han': {
        const dueStatus = getDueStatus(item.ngay_het_han, cauHinh ?? undefined);
        return (
          <td key={col.id} className="px-4 py-3.5" style={getColumnCellStyle(col)}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm text-foreground tabular-nums">{formatDate(item.ngay_het_han)}</span>
              {dueStatus === 'sap_han' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                  {t('congViec.dueSoon')}
                </span>
              )}
              {dueStatus === 'qua_han' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                  {t('congViec.overdue')}
                </span>
              )}
            </div>
          </td>
        );
      }
      case 'phan_tram_hoan_thanh':
        return baseTd(
          <span className="text-sm font-medium tabular-nums">{item.phan_tram_hoan_thanh}%</span>
        );
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
      getId={(row) => row.item.id}
      getLevel={(row) => row.level}
      renderCell={renderCell}
      onToggleSelection={onToggleSelection}
      onToggleAllSelection={onToggleAllSelection}
      onEdit={(row) => onEdit(row.item)}
      onDelete={(id) => onDelete(id)}
      onView={onView ? (row) => onView(row.item) : undefined}
      className="flex-1 min-h-0 overflow-auto"
    />
  );
};

export default CongViecHierarchyTable;
