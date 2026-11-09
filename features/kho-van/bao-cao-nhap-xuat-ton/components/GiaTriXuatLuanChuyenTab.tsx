import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Coins, PackageX, Tags, TrendingUp } from 'lucide-react';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import ErrorState from '../../../../components/shared/ErrorState';
import { StatsKpiGrid, StatsTableCard } from '../../../../components/shared/stats';
import type { StatsKpiCardItem, StatsTableRow } from '../../../../components/shared/stats';
import { formatNumberVN } from '../../../../lib/utils';
import { useNXTGiaTri } from '../hooks/use-bao-cao-nxt';
import type { NXTReportFilters } from '../core/types';

const money = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });

const GiaTriXuatLuanChuyenTab: React.FC<{ filters: NXTReportFilters }> = ({ filters }) => {
  const { t } = useTranslation();
  const statsQuery = useNXTGiaTri(filters);
  const stats = statsQuery.data;

  const kpis: StatsKpiCardItem[] = [
    {
      id: 'tienXuat',
      label: t('baoCaonhapXuatTon.giaTri.kpiTienXuat'),
      value: money(stats?.tong.tien_xuat ?? 0),
      icon: Coins,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'tienChuyen',
      label: t('baoCaonhapXuatTon.giaTri.kpiTienChuyen'),
      value: money(stats?.tong.tien_chuyen ?? 0),
      icon: TrendingUp,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      id: 'soDongChuaGia',
      label: t('baoCaonhapXuatTon.giaTri.kpiSoDongChuaGia'),
      value: money(stats?.tong.so_dong_chua_gia ?? 0),
      icon: PackageX,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  const rowsPhamCap: StatsTableRow[] = (stats?.theoPhamCap ?? []).map((row) => ({
    id: row.pham_cap ?? '__chua_phan_loai__',
    label: row.chuaPhanLoai ? t('baoCaonhapXuatTon.giaTri.chuaPhanLoai') : (row.pham_cap ?? '—'),
    value: `${money(row.tien_xuat)} / ${money(row.tien_chuyen)}  (${(row.tyLe * 100).toFixed(1)}%)`,
  }));

  const rowsTheoKho: StatsTableRow[] = (stats?.theoKho ?? []).map((row) => ({
    id: row.id_kho,
    label: row.ten_kho,
    value: t('baoCaonhapXuatTon.giaTri.theoKho.value', {
      xuat: money(row.tien_xuat),
      di: money(row.tien_chuyen_di),
      ve: money(row.tien_nhan_ve),
      chenh: money(row.chenh_lech),
    }),
  }));

  const rowsLuanChuyen: StatsTableRow[] = (stats?.luanChuyen ?? []).map((row) => ({
    id: `${row.id_kho_di}-${row.id_kho_den}`,
    label: `${row.ten_kho_di} → ${row.ten_kho_den}`,
    value: money(row.tien),
  }));

  const rowsChuaCoGia: StatsTableRow[] = (stats?.chuaCoGia ?? []).map((row) => ({
    id: row.id_hang_hoa,
    label: `${row.ten_hang} (${row.ma_hang})`,
    value: `${row.so_dong} ${t('baoCaonhapXuatTon.giaTri.chuaCoGia.dong')}`,
  }));

  return (
    <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
      {statsQuery.isPending ? (
        <LoadingSpinnerWithText text={t('common.loading')} />
      ) : statsQuery.isError ? (
        <ErrorState onRetry={() => statsQuery.refetch()} />
      ) : (
        <>
          <StatsKpiGrid items={kpis} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <StatsTableCard
              title={t('baoCaonhapXuatTon.giaTri.theoPhamCap.title')}
              icon={Tags}
              rows={rowsPhamCap}
              columnLabelKey="baoCaonhapXuatTon.giaTri.theoPhamCap.colPhamCap"
              columnValueKey="baoCaonhapXuatTon.giaTri.theoPhamCap.colGiaTri"
            />

            <StatsTableCard
              title={t('baoCaonhapXuatTon.giaTri.theoKho.title')}
              icon={TrendingUp}
              rows={rowsTheoKho}
              columnLabelKey="baoCaonhapXuatTon.giaTri.theoKho.colKho"
              columnValueKey="baoCaonhapXuatTon.giaTri.theoKho.colGiaTri"
            />

            <StatsTableCard
              title={t('baoCaonhapXuatTon.giaTri.luanChuyen.title')}
              icon={ArrowLeftRight}
              rows={rowsLuanChuyen}
              columnLabelKey="baoCaonhapXuatTon.giaTri.luanChuyen.colDuong"
              columnValueKey="baoCaonhapXuatTon.giaTri.luanChuyen.colTien"
            />

            {stats && stats.chuaCoGia.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-1">
                  {t('baoCaonhapXuatTon.giaTri.chuaCoGia.hint')}
                </p>
                <StatsTableCard
                  title={t('baoCaonhapXuatTon.giaTri.chuaCoGia.title')}
                  icon={PackageX}
                  rows={rowsChuaCoGia}
                  columnLabelKey="baoCaonhapXuatTon.giaTri.chuaCoGia.colHang"
                  columnValueKey="baoCaonhapXuatTon.giaTri.chuaCoGia.colSoDong"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GiaTriXuatLuanChuyenTab;
