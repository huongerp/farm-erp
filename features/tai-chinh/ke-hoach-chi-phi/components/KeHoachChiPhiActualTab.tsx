import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThucChiTheoThang } from '../hooks/use-ke-hoach-chi-phi';
import { useKeHoachChiPhiStore } from '../store/useKeHoachChiPhiStore';
import MonthlyBudgetTable, { type MonthlyBudgetRow } from './MonthlyBudgetTable';
import TransactionDrillDown from './TransactionDrillDown';

const KeHoachChiPhiActualTab: React.FC = () => {
  const { t } = useTranslation();
  const { filters } = useKeHoachChiPhiStore();
  const { data: thucChiRows = [], isLoading } = useThucChiTheoThang(filters.nam);
  const [drillDown, setDrillDown] = useState<{
    nam: number;
    thang: number;
    idDanhMuc: string;
    tenDanhMuc: string;
  } | null>(null);

  const rows: MonthlyBudgetRow[] = useMemo(
    () =>
      thucChiRows.map((r) => ({
        id_danh_muc: r.id_danh_muc,
        ten_danh_muc: r.ten_danh_muc,
        thang_1: r.thang_1,
        thang_2: r.thang_2,
        thang_3: r.thang_3,
        thang_4: r.thang_4,
        thang_5: r.thang_5,
        thang_6: r.thang_6,
        thang_7: r.thang_7,
        thang_8: r.thang_8,
        thang_9: r.thang_9,
        thang_10: r.thang_10,
        thang_11: r.thang_11,
        thang_12: r.thang_12,
        tong_nam: r.tong_nam,
      })),
    [thucChiRows]
  );

  const handleCellClick = (thang: number, idDanhMuc: string | undefined) => {
    if (!idDanhMuc) return;
    const row = thucChiRows.find((r) => r.id_danh_muc === idDanhMuc);
    if (row) setDrillDown({ nam: filters.nam, thang, idDanhMuc, tenDanhMuc: row.ten_danh_muc });
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden p-4">
      <p className="text-sm text-muted-foreground mb-3 shrink-0">
        {t('keHoachChiPhi.actualTabDesc')}
      </p>
      <div className="flex-1 min-h-0 border border-border rounded-xl bg-card overflow-hidden">
        <MonthlyBudgetTable
          rows={rows}
          variant="actual"
          nam={filters.nam}
          showTongNam
          onCellClick={handleCellClick}
          isLoading={isLoading}
          emptyMessage={t('keHoachChiPhi.noActualData')}
        />
      </div>
      {drillDown && (
        <TransactionDrillDown
          nam={drillDown.nam}
          thang={drillDown.thang}
          idDanhMuc={drillDown.idDanhMuc}
          tenDanhMuc={drillDown.tenDanhMuc}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  );
};

export default KeHoachChiPhiActualTab;
