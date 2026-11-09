import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../lib/utils';

export interface CotBang<T> {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  title: string;
  icon?: LucideIcon;
  rows: T[];
  columns: CotBang<T>[];
  rowKey: (row: T, i: number) => string;
  onRowClick?: (row: T) => void;
  maxHeight?: string;
}

/** Bảng thống kê nhiều cột (StatsTableCard chỉ có 2 cột). */
function BangThongKe<T>({ title, icon: Icon, rows, columns, rowKey, onRowClick, maxHeight = 'max-h-[320px]' }: Props<T>) {
  const { t } = useTranslation();
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        {Icon && <Icon size={18} className="text-muted-foreground shrink-0" />}
        <span className="font-medium text-foreground text-sm">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{rows.length}</span>
      </div>
      <div className={cn('overflow-auto', maxHeight)}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">{t('stats.noData')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="text-muted-foreground border-b border-border">
                {columns.map((c) => (
                  <th key={c.key} className={cn('px-3 py-2 font-medium whitespace-nowrap', c.align === 'right' ? 'text-right' : 'text-left')}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={rowKey(r, i)}
                  className={cn('border-b border-border/50', onRowClick && 'cursor-pointer hover:bg-muted/40')}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-3 py-2', c.align === 'right' ? 'text-right tabular-nums' : 'text-left')}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default BangThongKe;
