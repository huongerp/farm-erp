import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../../lib/utils';
import { THANG_KEYS } from '../core/types';
import { cn } from '../../../../lib/utils';

export interface MonthlyBudgetRow {
  id?: string;
  id_danh_muc?: string;
  ten_danh_muc: string;
  /** Mô tả nội dung chi tiết dòng khoản mục */
  mo_ta?: string;
  thang_1: number;
  thang_2: number;
  thang_3: number;
  thang_4: number;
  thang_5: number;
  thang_6: number;
  thang_7: number;
  thang_8: number;
  thang_9: number;
  thang_10: number;
  thang_11: number;
  thang_12: number;
  tong_nam: number;
}

export type MonthlyBudgetTableVariant = 'plan' | 'actual' | 'compare';

interface MonthlyBudgetTableProps {
  rows: MonthlyBudgetRow[];
  variant?: MonthlyBudgetTableVariant;
  /** Năm để hiển thị trong header (optional) */
  nam?: number;
  /** Click vào ô theo tháng (1-12) và id_danh_muc để drill-down */
  onCellClick?: (thang: number, idDanhMuc: string | undefined) => void;
  /** Class cho ô theo (thang, id_danh_muc) - dùng cho so sánh (xanh/đỏ) */
  getCellClassName?: (thang: number, row: MonthlyBudgetRow) => string;
  /** Custom render cell (nếu cần hiển thị thêm variance, progress) */
  renderCell?: (thang: number, value: number, row: MonthlyBudgetRow) => React.ReactNode;
  /** Có hiển thị cột Tổng năm không */
  showTongNam?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const MonthlyBudgetTable: React.FC<MonthlyBudgetTableProps> = ({
  rows,
  variant = 'plan',
  nam,
  onCellClick,
  getCellClassName,
  renderCell,
  showTongNam = true,
  isLoading = false,
  emptyMessage,
  className,
}) => {
  const { t } = useTranslation();
  const isReadOnly = variant === 'actual' || variant === 'compare';
  const headerYear = nam ?? new Date().getFullYear();

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
    <div className={cn('overflow-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur border-b border-border">
          <tr>
            <th className="sticky left-0 z-20 min-w-[180px] max-w-[280px] px-3 py-2.5 text-left font-semibold text-foreground/90 bg-muted/80 border-b border-r border-border">
              {t('keHoachChiPhi.columns.danhMuc')}
            </th>
            <th className="min-w-[140px] max-w-[240px] px-3 py-2.5 text-left font-semibold text-foreground/90 bg-muted/80 border-b border-r border-border">
              {t('keHoachChiPhi.columns.moTa')}
            </th>
            {THANG_KEYS.map((_, i) => (
              <th
                key={i}
                className="min-w-[100px] px-2 py-2.5 text-center font-semibold text-foreground/90 border-b border-border whitespace-nowrap"
              >
                {t('keHoachChiPhi.monthShort', { n: i + 1 })}
              </th>
            ))}
            {showTongNam && (
              <th className="min-w-[120px] px-2 py-2.5 text-right font-semibold text-foreground/90 border-b border-border bg-muted/50">
                {t('keHoachChiPhi.columns.tongNam')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={row.id ?? row.id_danh_muc ?? rowIdx}
              className="hover:bg-muted/40 transition-colors border-b border-border"
            >
              <td className="sticky left-0 z-10 px-3 py-2 font-medium text-foreground bg-card border-r border-border">
                {row.ten_danh_muc}
              </td>
              <td className="px-3 py-2 text-sm text-muted-foreground bg-card border-r border-border max-w-[240px] truncate" title={row.mo_ta}>
                {row.mo_ta || '–'}
              </td>
              {THANG_KEYS.map((key, i) => {
                const thang = i + 1;
                const value = row[key];
                const cellClass = getCellClassName?.(thang, row);
                const content = renderCell ? renderCell(thang, value, row) : formatCurrency(value);
                return (
                  <td
                    key={key}
                    className={cn(
                      'min-w-[100px] px-2 py-2 text-right tabular-nums border-border',
                      isReadOnly && onCellClick && 'cursor-pointer hover:bg-muted/60',
                      cellClass
                    )}
                    onClick={() =>
                      isReadOnly && onCellClick && row.id_danh_muc && onCellClick(thang, row.id_danh_muc)
                    }
                    role={isReadOnly && onCellClick ? 'button' : undefined}
                  >
                    {content}
                  </td>
                );
              })}
              {showTongNam && (
                <td className="min-w-[120px] px-2 py-2 text-right font-medium tabular-nums bg-muted/30">
                  {formatCurrency(row.tong_nam)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyBudgetTable;
