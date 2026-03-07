import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../../lib/utils';
import type { KeHoachChiPhi } from '../core/types';
import { THANG_KEYS } from '../core/types';
import { cn } from '../../../../lib/utils';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { Edit, Trash2 } from 'lucide-react';

interface KeHoachChiPhiPlanFlatTableProps {
  rows: KeHoachChiPhi[];
  /** Cột hiển thị (đã lọc visible, sắp theo order). */
  visibleColumns: ColumnConfig[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  onView?: (row: KeHoachChiPhi) => void;
  onEdit?: (row: KeHoachChiPhi) => void;
  onDelete?: (id: string) => void;
}

function getMonthValue(row: KeHoachChiPhi, key: (typeof THANG_KEYS)[number]): number {
  return row[key] ?? 0;
}

function getMonthSlDg(
  row: KeHoachChiPhi,
  key: (typeof THANG_KEYS)[number]
): { so_luong?: number; don_gia?: number } {
  const i = THANG_KEYS.indexOf(key);
  const slKey = `thang_${i + 1}_so_luong` as keyof KeHoachChiPhi;
  const dgKey = `thang_${i + 1}_don_gia` as keyof KeHoachChiPhi;
  const so_luong = row[slKey] as number | undefined;
  const don_gia = row[dgKey] as number | undefined;
  return { so_luong, don_gia };
}

/** Rút gọn đơn giá để hiển thị gọn trong ô: "1 tr", "500 ng". */
function shortDonGia(d: number): string {
  if (d >= 1e6) return `${d / 1e6} tr`;
  if (d >= 1000) return `${d / 1000} ng`;
  return String(d);
}

const KeHoachChiPhiPlanFlatTable: React.FC<KeHoachChiPhiPlanFlatTableProps> = ({
  rows,
  visibleColumns,
  isLoading = false,
  emptyMessage,
  className,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds?.has(r.id));
  const someSelected = rows.some((r) => selectedIds?.has(r.id));

  /** Offset left (px) cho sticky cột khoản mục và mô tả (sau cột checkbox + các cột trước nó). */
  const stickyLeftPx = React.useMemo(() => {
    const checkboxW = 40;
    let acc = checkboxW;
    const out: Record<string, number> = {};
    for (const col of visibleColumns) {
      if (col.id === 'ten_danh_muc') {
        out.ten_danh_muc = acc;
      } else if (col.id === 'mo_ta') {
        out.mo_ta = acc;
      }
      acc += col.minWidth ?? 100;
    }
    return out;
  }, [visibleColumns]);

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center min-h-[200px] py-12 text-muted-foreground',
          className
        )}
      >
        {t('common.loading')}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div
        className={cn(
          'flex items-center justify-center min-h-[200px] py-12 text-muted-foreground text-sm',
          className
        )}
      >
        {emptyMessage ?? t('keHoachChiPhi.noData')}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col flex-1 min-h-0 gap-4', className)}>
      {/* Mobile: card view */}
      <div className="md:hidden flex flex-col gap-3 overflow-auto flex-1 min-h-0">
        {rows.map((row) => (
          <div
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => onView?.(row)}
            onKeyDown={(e) => e.key === 'Enter' && onView?.(row)}
            className="bg-card rounded-xl border border-border p-3.5 shadow-sm shrink-0"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-foreground text-sm">{row.ten_danh_muc}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{row.nam}</span>
            </div>
            {row.ten_phong_ban && (
              <div className="text-xs text-muted-foreground mb-1">{row.ten_phong_ban}</div>
            )}
            <div className="text-right font-medium text-foreground tabular-nums mb-2">
              {formatCurrency(row.tong_nam)}
            </div>
            {row.tong_sl != null && (
              <div className="text-xs text-muted-foreground mb-2">
                {t('keHoachChiPhi.columns.tongSl')}: {row.tong_sl}
              </div>
            )}
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {THANG_KEYS.slice(0, 4).map((key, i) => (
                <div key={key} className="bg-muted/40 rounded px-1.5 py-1 text-center">
                  <div className="font-medium tabular-nums">{t('keHoachChiPhi.monthShort', { n: i + 1 })}</div>
                  <div className="tabular-nums text-muted-foreground">{formatCurrency(getMonthValue(row, key))}</div>
                  {(() => {
                    const { so_luong, don_gia } = getMonthSlDg(row, key);
                    if ((so_luong != null && so_luong !== 0) || (don_gia != null && don_gia !== 0)) {
                      return (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {so_luong ?? '–'} · {don_gia != null && don_gia > 0 ? shortDonGia(don_gia) : '–'}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {t('keHoachChiPhi.andMoreMonths', { n: THANG_KEYS.length - 4 })}
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-border">
              {onEdit && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(row); }} className="p-2 text-primary hover:bg-primary/10 rounded-md">
                  <Edit size={14} />
                </button>
              )}
              {onDelete && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(row.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-md">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table chuẩn header/body + cột thao tác sticky phải */}
      <div className="hidden md:block overflow-auto flex-1 min-h-0">
        <table className="w-full border-collapse text-sm text-left" style={{ minWidth: 'max-content' }}>
          <colgroup>
            {selectedIds && onToggleSelection && onToggleAll && <col style={{ width: 40 }} />}
            {visibleColumns.map((col) => (
              <col key={col.id} style={{ width: col.minWidth ?? 100 }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
            <tr>
              {selectedIds && onToggleSelection && onToggleAll && (
                <th className="px-4 py-3 w-10 sticky left-0 z-[3] bg-muted/95 border-r border-border shadow-[4px_0_8px_rgba(0,0,0,0.06)]" style={{ minWidth: 40 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={(e) => onToggleAll(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                    aria-label={t('common.selectAll')}
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap',
                    col.id === 'tong_cong' || col.id.startsWith('thang_') ? 'text-right' : 'text-left',
                    col.id === 'actions' && 'sticky right-0 z-[3] bg-muted/95 border-l border-border shadow-[-4px_0_8px_rgba(0,0,0,0.06)]',
                    (col.id === 'ten_danh_muc' || col.id === 'mo_ta') && 'sticky z-[3] bg-muted/95 border-r border-border shadow-[4px_0_8px_rgba(0,0,0,0.06)]'
                  )}
                  style={
                    col.id === 'actions'
                      ? { ...getColumnCellStyle(col), minWidth: 88 }
                      : col.id === 'ten_danh_muc' && stickyLeftPx.ten_danh_muc != null
                        ? { ...getColumnCellStyle(col), left: stickyLeftPx.ten_danh_muc }
                        : col.id === 'mo_ta' && stickyLeftPx.mo_ta != null
                          ? { ...getColumnCellStyle(col), left: stickyLeftPx.mo_ta }
                          : getColumnCellStyle(col)
                  }
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
            {rows.map((row) => (
              <tr
                key={row.id}
                role={onView ? 'button' : undefined}
                tabIndex={onView ? 0 : undefined}
                onClick={() => onView?.(row)}
                onKeyDown={(e) => onView && e.key === 'Enter' && onView(row)}
                className={cn(
                  'group hover:bg-muted/50 transition-colors',
                  onView && 'cursor-pointer'
                )}
              >
                {selectedIds && onToggleSelection && onToggleAll && (
                  <td className="px-4 py-3 sticky left-0 z-[1] bg-card border-r border-border/50 shadow-[4px_0_8px_rgba(0,0,0,0.06)] group-hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => onToggleSelection(row.id)}
                      className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                      aria-label={t('common.select')}
                    />
                  </td>
                )}
                {visibleColumns.map((col) => {
                  if (col.id === 'nam') {
                    return (
                      <td key={col.id} className="px-4 py-3 text-foreground tabular-nums align-top" style={getColumnCellStyle(col)}>
                        {row.nam}
                      </td>
                    );
                  }
                  if (col.id === 'ten_phong_ban') {
                    return (
                      <td key={col.id} className="px-4 py-3 text-foreground align-top text-muted-foreground truncate min-w-0" style={getColumnCellStyle(col)} title={row.ten_phong_ban}>
                        {row.ten_phong_ban || '–'}
                      </td>
                    );
                  }
                  if (col.id === 'ten_danh_muc') {
                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-3 text-foreground align-top font-medium min-w-0',
                          stickyLeftPx.ten_danh_muc != null && 'sticky z-[1] bg-card border-r border-border/50 shadow-[4px_0_8px_rgba(0,0,0,0.06)] group-hover:bg-muted'
                        )}
                        style={stickyLeftPx.ten_danh_muc != null ? { ...getColumnCellStyle(col), left: stickyLeftPx.ten_danh_muc } : getColumnCellStyle(col)}
                      >
                        {row.ten_danh_muc}
                      </td>
                    );
                  }
                  if (col.id === 'mo_ta') {
                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-3 text-muted-foreground align-top truncate min-w-0',
                          stickyLeftPx.mo_ta != null && 'sticky z-[1] bg-card border-r border-border/50 shadow-[4px_0_8px_rgba(0,0,0,0.06)] group-hover:bg-muted'
                        )}
                        style={stickyLeftPx.mo_ta != null ? { ...getColumnCellStyle(col), left: stickyLeftPx.mo_ta } : getColumnCellStyle(col)}
                        title={row.mo_ta}
                      >
                        {row.mo_ta || '–'}
                      </td>
                    );
                  }
                  if (col.id === 'tong_cong') {
                    return (
                      <td key={col.id} className="px-4 py-3 text-right text-foreground tabular-nums align-top whitespace-nowrap" style={getColumnCellStyle(col)}>
                        {formatCurrency(row.tong_nam)}
                      </td>
                    );
                  }
                  if (col.id === 'tong_sl') {
                    return (
                      <td key={col.id} className="px-4 py-3 text-right text-foreground tabular-nums align-top" style={getColumnCellStyle(col)}>
                        {row.tong_sl != null ? row.tong_sl : '–'}
                      </td>
                    );
                  }
                  if (col.id.startsWith('thang_') && !col.id.includes('_so_luong') && !col.id.includes('_don_gia')) {
                    const num = parseInt(col.id.replace('thang_', ''), 10);
                    if (num >= 1 && num <= 12) {
                      const key = THANG_KEYS[num - 1];
                      const amount = getMonthValue(row, key);
                      const { so_luong, don_gia } = getMonthSlDg(row, key);
                      const hasSlDg = (so_luong != null && so_luong !== 0) || (don_gia != null && don_gia !== 0);
                      return (
                        <td key={col.id} className="px-4 py-3 text-right align-top" style={getColumnCellStyle(col)}>
                          <div className="flex flex-col gap-0.5 w-full min-w-0">
                            <span className="tabular-nums text-foreground text-xs leading-tight whitespace-nowrap">
                              {formatCurrency(amount)}
                            </span>
                            {hasSlDg && (
                              <span className="text-[11px] text-muted-foreground leading-tight whitespace-nowrap">
                                {so_luong ?? '–'} · {don_gia != null && don_gia > 0 ? shortDonGia(don_gia) : '–'}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    }
                  }
                  if (col.id === 'actions') {
                    return (
                      <td key={col.id} className="px-4 py-3 text-right sticky right-0 z-[1] bg-card border-l border-border/50 shadow-[-4px_0_8px_rgba(0,0,0,0.06)] group-hover:bg-muted" style={{ ...getColumnCellStyle(col), minWidth: 88 }} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                              title={t('common.edit')}
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(row.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                              title={t('common.delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  }
                  return <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeHoachChiPhiPlanFlatTable;
