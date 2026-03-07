import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useKeHoachChiPhiByNam, useThucChiTheoThang } from '../hooks/use-ke-hoach-chi-phi';
import { useKeHoachChiPhiStore } from '../store/useKeHoachChiPhiStore';
import MonthlyBudgetTable, { type MonthlyBudgetRow } from './MonthlyBudgetTable';
import { formatCurrency } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import type { KeHoachChiPhi } from '../core/types';
import { THANG_KEYS } from '../core/types';

/** Gộp danh sách dòng kế hoạch theo id_danh_muc (tổng 12 tháng). */
function aggregatePlanByDanhMuc(rows: KeHoachChiPhi[]): MonthlyBudgetRow[] {
  const byDanhMuc = new Map<string, { ten_danh_muc: string; thang: Record<number, number> }>();
  for (const r of rows) {
    if (!byDanhMuc.has(r.id_danh_muc)) {
      byDanhMuc.set(r.id_danh_muc, {
        ten_danh_muc: r.ten_danh_muc,
        thang: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
      });
    }
    const entry = byDanhMuc.get(r.id_danh_muc)!;
    for (let m = 1; m <= 12; m++) {
      const key = THANG_KEYS[m - 1];
      entry.thang[m] = (entry.thang[m] ?? 0) + (Number(r[key]) ?? 0);
    }
  }
  const result: MonthlyBudgetRow[] = [];
  byDanhMuc.forEach((v, id_danh_muc) => {
    const t = v.thang;
    const tong_nam = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((s, m) => s + (t[m] ?? 0), 0);
    result.push({
      id_danh_muc,
      ten_danh_muc: v.ten_danh_muc,
      thang_1: t[1] ?? 0,
      thang_2: t[2] ?? 0,
      thang_3: t[3] ?? 0,
      thang_4: t[4] ?? 0,
      thang_5: t[5] ?? 0,
      thang_6: t[6] ?? 0,
      thang_7: t[7] ?? 0,
      thang_8: t[8] ?? 0,
      thang_9: t[9] ?? 0,
      thang_10: t[10] ?? 0,
      thang_11: t[11] ?? 0,
      thang_12: t[12] ?? 0,
      tong_nam,
    });
  });
  return result;
}

const KeHoachChiPhiCompareTab: React.FC = () => {
  const { t } = useTranslation();
  const { filters } = useKeHoachChiPhiStore();
  const { data: flatRows = [], isLoading: planLoading } = useKeHoachChiPhiByNam(filters.nam);
  const { data: actualRows = [], isLoading: actualLoading } = useThucChiTheoThang(filters.nam);
  const planRows = useMemo(() => aggregatePlanByDanhMuc(flatRows), [flatRows]);

  const getActual = (idDanhMuc: string, thangKey: string) => {
    const row = actualRows.find((r) => r.id_danh_muc === idDanhMuc);
    return row ? (row as Record<string, number>)[thangKey] ?? 0 : 0;
  };

  const renderCell = (thang: number, value: number, row: MonthlyBudgetRow) => {
    const thangKey = `thang_${thang}`;
    const planned = Number(value) || 0;
    const actual = row.id_danh_muc ? getActual(row.id_danh_muc, thangKey) : 0;
    const pct = planned > 0 ? (actual / planned) * 100 : 0;
    const isOver = actual > planned;
    const isWarning = planned > 0 && pct >= 80 && pct <= 100;

    return (
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            isOver && 'text-rose-600 dark:text-rose-400',
            !isOver && actual > 0 && 'text-emerald-600 dark:text-emerald-400',
            isWarning && !isOver && 'text-amber-600 dark:text-amber-400'
          )}
        >
          {formatCurrency(actual)}
        </span>
        {planned > 0 && (
          <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
        )}
      </div>
    );
  };

  const getCellClassName = (thang: number, row: MonthlyBudgetRow) => {
    const thangKey = `thang_${thang}`;
    const planned = Number((row as Record<string, number>)[thangKey]) || 0;
    const actual = row.id_danh_muc ? getActual(row.id_danh_muc, thangKey) : 0;
    const pct = planned > 0 ? (actual / planned) * 100 : 0;
    if (actual > planned) return 'bg-rose-500/10';
    if (pct >= 80 && pct <= 100) return 'bg-amber-500/10';
    if (actual > 0 && actual < planned) return 'bg-emerald-500/10';
    return '';
  };

  const displayRows: MonthlyBudgetRow[] = planRows;

  const isLoading = planLoading || actualLoading;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden p-4">
      <p className="text-sm text-muted-foreground mb-3 shrink-0">
        {t('keHoachChiPhi.compareTabDesc')}
      </p>
      <div className="flex-1 min-h-0 border border-border rounded-xl bg-card overflow-hidden">
        <MonthlyBudgetTable
          rows={displayRows}
          variant="compare"
          nam={filters.nam}
          showTongNam
          renderCell={renderCell}
          getCellClassName={getCellClassName}
          isLoading={isLoading}
          emptyMessage={t('keHoachChiPhi.noPlanForYear')}
        />
      </div>
    </div>
  );
};

export default KeHoachChiPhiCompareTab;
